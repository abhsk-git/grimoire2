from flask import Blueprint, request, jsonify, Response
from utils import get_db, optional_auth, cache_get, cache_set

bp = Blueprint('explore', __name__)


@bp.route('/api/explore', methods=['GET'])
@optional_auth
def explore_links():
    q   = request.args.get('q', '')
    tag = request.args.get('tag', '')
    try:
        page     = max(1, int(request.args.get('page', 1)))
        per_page = min(max(1, int(request.args.get('per_page', 24))), 100)
    except (ValueError, TypeError):
        page, per_page = 1, 24
    offset = (page - 1) * per_page

    cache_key = f'explore:{q}:{tag}:{page}:{per_page}'
    if not q and not tag and page == 1:
        cached = cache_get(cache_key)
        if cached is not None:
            return jsonify(cached)

    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        conditions = ['1=1']
        params     = []

        if q:
            conditions.append(
                '(MATCH(l.title, l.description, l.tags) AGAINST(%s IN BOOLEAN MODE)'
                ' OR l.title LIKE %s)'
            )
            params += [f'{q}*', f'%{q}%']
        if tag:
            conditions.append('FIND_IN_SET(%s, l.tags)')
            params.append(tag)

        privacy_filter = "COALESCE(JSON_EXTRACT(u.settings, '$.privacy.hideFromExplore'), false) = false"
        where = ' AND '.join(conditions)

        cur.execute(f'''
            SELECT COUNT(*) as total FROM links l
            JOIN users u ON l.user_id = u.id
            WHERE {where} AND {privacy_filter}
        ''', params)
        total = cur.fetchone()['total']

        cur.execute(f'''
            SELECT l.id, l.url, l.title, l.description, l.image, l.favicon,
                   l.tags, l.visit_count, l.created_at,
                   u.id as author_id, u.name as author_name, u.avatar as author_avatar
            FROM links l
            JOIN users u ON l.user_id = u.id
            WHERE {where} AND {privacy_filter}
            ORDER BY l.created_at DESC
            LIMIT %s OFFSET %s
        ''', params + [per_page, offset])
        links = cur.fetchall()
    finally:
        db.close()

    for lnk in links:
        if lnk.get('created_at'): lnk['created_at'] = lnk['created_at'].isoformat()

    result = {'links': links, 'total': total, 'page': page, 'per_page': per_page}
    if not q and not tag and page == 1:
        cache_set(cache_key, result, ttl=30)
    return jsonify(result)


@bp.route('/api/user/<handle>', methods=['GET'])
def user_profile(handle):
    import json as _json
    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        # Look up by actual handle column first, then name slug, then numeric ID
        cur.execute('SELECT id, name, avatar, bio, banner, website, social_links, handle FROM users WHERE handle=%s', (handle,))
        user = cur.fetchone()
        if not user:
            name_from_handle = handle.replace('-', ' ')
            cur.execute('SELECT id, name, avatar, bio, banner, website, social_links, handle FROM users WHERE LOWER(name) = LOWER(%s)', (name_from_handle,))
            user = cur.fetchone()
        if not user and handle.isdigit():
            cur.execute('SELECT id, name, avatar, bio, banner, website, social_links, handle FROM users WHERE id = %s', (int(handle),))
            user = cur.fetchone()
        if not user:
            return jsonify({'error': 'Not found'}), 404
        if user.get('social_links') and isinstance(user['social_links'], str):
            try: user['social_links'] = _json.loads(user['social_links'])
            except Exception: user['social_links'] = {}

        uid = user['id']
        cur.execute('''
            SELECT l.id, l.url, l.title, l.description, l.favicon, l.tags, l.created_at
            FROM links l
            WHERE l.user_id = %s
            ORDER BY l.created_at DESC LIMIT 50
        ''', (uid,))
        links = cur.fetchall()

        cur.execute('''
            SELECT id, title, slug, excerpt, reading_time, views, likes, published_at
            FROM blog_posts
            WHERE user_id = %s AND status = "published"
            ORDER BY published_at DESC LIMIT 20
        ''', (uid,))
        posts = cur.fetchall()
    finally:
        db.close()

    for l in links:
        if l.get('created_at'): l['created_at'] = l['created_at'].isoformat()
    for p in posts:
        if p.get('published_at'): p['published_at'] = p['published_at'].isoformat()

    return jsonify({'user': user, 'links': links, 'posts': posts})


@bp.route('/api/user/<handle>/rss.xml', methods=['GET'])
def user_rss(handle):
    import html as _e
    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute('SELECT id, name FROM users WHERE handle=%s', (handle,))
        user = cur.fetchone()
        if not user:
            return jsonify({'error': 'Not found'}), 404
        cur.execute('''
            SELECT title, slug, excerpt, published_at
            FROM blog_posts
            WHERE user_id=%s AND status='published'
            ORDER BY published_at DESC LIMIT 20
        ''', (user['id'],))
        posts = cur.fetchall()
    finally:
        db.close()
    host  = request.host_url.rstrip('/')
    items = ''
    for p in posts:
        dt = p['published_at'].strftime('%a, %d %b %Y %H:%M:%S +0000') if p.get('published_at') else ''
        items += f'''
        <item>
          <title><![CDATA[{p["title"]}]]></title>
          <link>{host}/blog/{p["slug"]}</link>
          <description><![CDATA[{p.get("excerpt","") or ""}]]></description>
          <author>{_e.escape(user["name"])}</author>
          <pubDate>{dt}</pubDate>
          <guid>{host}/blog/{p["slug"]}</guid>
        </item>'''
    xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>{_e.escape(user["name"])} on Grimoire</title>
    <link>{host}/user/{_e.escape(handle)}</link>
    <description>Posts by {_e.escape(user["name"])} on Grimoire</description>
    {items}
  </channel>
</rss>'''
    return Response(xml, mimetype='application/rss+xml')


@bp.route('/api/explore/trending-tags', methods=['GET'])
def trending_tags():
    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute('SELECT tags FROM links WHERE tags != ""')
        rows = cur.fetchall()
    finally:
        db.close()
    tag_counts = {}
    for row in rows:
        for tag in row['tags'].split(','):
            tag = tag.strip()
            if tag:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
    tags = sorted(tag_counts.items(), key=lambda x: -x[1])[:20]
    return jsonify([{'name': t[0], 'count': t[1]} for t in tags])
