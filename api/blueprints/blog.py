from flask import Blueprint, request, jsonify, render_template, redirect, abort, Response
import json, re, unicodedata, os, datetime
from utils import get_db, login_required, optional_auth, verify_token

bp = Blueprint('blog', __name__)

MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB


# ── Utilities ─────────────────────────────────────────────────────────────────

def _generate_slug(title):
    s = unicodedata.normalize('NFKD', title).encode('ascii', 'ignore').decode('ascii')
    s = re.sub(r'[^\w\s-]', '', s).strip().lower()
    s = re.sub(r'[-\s]+', '-', s)
    return (s or 'post')[:180]


def _unique_slug(cur, base, exclude_id=None):
    slug, i = base, 2
    while True:
        if exclude_id:
            cur.execute('SELECT id FROM blog_posts WHERE slug=%s AND id!=%s', (slug, exclude_id))
        else:
            cur.execute('SELECT id FROM blog_posts WHERE slug=%s', (slug,))
        if not cur.fetchone():
            return slug
        slug, i = f'{base}-{i}', i + 1


def _reading_time(content_json):
    try:
        data = json.loads(content_json) if isinstance(content_json, str) else content_json
        text = ''
        for b in data.get('blocks', []):
            bd, bt = b.get('data', {}), b.get('type', '')
            if bt in ('paragraph', 'header', 'quote'):
                text += ' ' + re.sub(r'<[^>]+>', '', bd.get('text', ''))
            elif bt == 'list':
                text += ' '.join(bd.get('items', []))
            elif bt == 'code':
                text += ' ' + bd.get('code', '')
        return max(1, round(len(text.split()) / 200))
    except Exception:
        return 1


def _sanitize_inline(text):
    """Strip dangerous HTML while preserving EditorJS inline formatting tags."""
    if not text:
        return ''
    # Remove dangerous block-level tags and their content
    text = re.sub(
        r'<(?:script|style|iframe|object|embed)[\s>][\s\S]*?</(?:script|style|iframe|object|embed)>',
        '', text, flags=re.IGNORECASE
    )
    # Remove self-closing dangerous tags
    text = re.sub(r'<(?:script|style|iframe|object|embed)\s*/>', '', text, flags=re.IGNORECASE)
    # Remove on* event handler attributes
    text = re.sub(r'''\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)''', '', text, flags=re.IGNORECASE)
    # Remove javascript: URI in href/src/action
    text = re.sub(r'''(?:href|src|action)\s*=\s*["']?\s*javascript:[^"'\s>]*''', '', text, flags=re.IGNORECASE)
    # Remove data: URIs in src (potential XSS vector)
    text = re.sub(r'''src\s*=\s*["']?\s*data:[^"'\s>]*''', '', text, flags=re.IGNORECASE)
    return text


def _to_html(content_json):
    import html as _e
    try:
        data = json.loads(content_json) if isinstance(content_json, str) else content_json
    except Exception:
        return '<p>Content unavailable.</p>'

    parts = []
    for b in data.get('blocks', []):
        bt, bd = b.get('type', ''), b.get('data', {})

        if bt == 'paragraph':
            # text may contain EditorJS inline HTML — sanitize rather than fully escape
            parts.append(f'<p>{_sanitize_inline(bd.get("text", ""))}</p>')

        elif bt == 'header':
            lvl  = min(max(int(bd.get('level', 2)), 1), 6)
            text = _sanitize_inline(bd.get('text', ''))
            raw  = re.sub(r'<[^>]+>', '', text).strip()
            anchor = re.sub(r'[-\s]+', '-', re.sub(r'[^\w\s-]', '', raw.lower())).strip('-')
            parts.append(f'<h{lvl} id="{_e.escape(anchor)}">{text}</h{lvl}>')

        elif bt == 'list':
            tag   = 'ol' if bd.get('style') == 'ordered' else 'ul'
            items = ''.join(f'<li>{_sanitize_inline(i)}</li>' for i in bd.get('items', []))
            parts.append(f'<{tag}>{items}</{tag}>')

        elif bt == 'checklist':
            rows = ''
            for item in bd.get('items', []):
                chk  = 'checked' if item.get('checked') else ''
                text = _sanitize_inline(item.get('text', ''))
                rows += f'<label class="cl-item"><input type="checkbox" {chk} disabled><span>{text}</span></label>'
            parts.append(f'<div class="blog-checklist">{rows}</div>')

        elif bt == 'quote':
            cap_raw = bd.get('caption', '')
            cap     = f'<cite>{_sanitize_inline(cap_raw)}</cite>' if cap_raw else ''
            align   = _e.escape(bd.get('alignment', 'left'))
            parts.append(f'<blockquote style="text-align:{align}"><p>{_sanitize_inline(bd.get("text",""))}</p>{cap}</blockquote>')

        elif bt == 'code':
            # Code is always fully escaped — no inline formatting expected
            lang = _e.escape(bd.get('language', ''))
            code = _e.escape(bd.get('code', ''))
            parts.append(f'<pre><code class="language-{lang}">{code}</code></pre>')

        elif bt == 'image':
            url     = _e.escape(bd.get('file', {}).get('url', '') or bd.get('url', ''))
            cap_raw = bd.get('caption', '')
            cap_san = _sanitize_inline(cap_raw)
            cls = ' '.join(filter(None, [
                'stretched'  if bd.get('stretched')      else '',
                'bordered'   if bd.get('withBorder')     else '',
                'with-bg'    if bd.get('withBackground') else '',
            ]))
            cap_html = f'<figcaption>{cap_san}</figcaption>' if cap_raw else ''
            parts.append(
                f'<figure class="blog-figure {cls}">'
                f'<img src="{url}" alt="{_e.escape(re.sub(r"<[^>]+>","",cap_raw))}" loading="lazy">'
                f'{cap_html}</figure>'
            )

        elif bt == 'embed':
            embed    = _e.escape(bd.get('embed', ''))
            cap_raw  = bd.get('caption', '')
            cap_html = f'<figcaption>{_sanitize_inline(cap_raw)}</figcaption>' if cap_raw else ''
            parts.append(
                f'<figure class="blog-embed">'
                f'<iframe src="{embed}" frameborder="0" allowfullscreen loading="lazy"></iframe>'
                f'{cap_html}</figure>'
            )

        elif bt == 'table':
            rows_html = ''
            for i, row in enumerate(bd.get('content', [])):
                tag = 'th' if i == 0 else 'td'
                rows_html += '<tr>' + ''.join(f'<{tag}>{_sanitize_inline(c)}</{tag}>' for c in row) + '</tr>'
            parts.append(f'<div class="table-wrap"><table>{rows_html}</table></div>')

        elif bt == 'delimiter':
            parts.append('<div class="blog-delimiter">✦ &nbsp; ✦ &nbsp; ✦</div>')

        elif bt == 'warning':
            import html as _e2
            title   = _sanitize_inline(bd.get('title', ''))
            message = _sanitize_inline(bd.get('message', ''))
            parts.append(f'<div class="blog-warning"><strong>{title}</strong><p>{message}</p></div>')

    return '\n'.join(parts)


def _fmt_date(dt):
    if not dt:
        return ''
    months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return f'{months[dt.month - 1]} {dt.day}, {dt.year}'


def _normalize_tags(raw):
    """Normalize a comma-separated tag string: lowercase, strip, remove dupes."""
    tags = [re.sub(r'[^\w-]', '', t.strip().lower()) for t in (raw or '').split(',')]
    seen, out = set(), []
    for t in tags:
        if t and t not in seen:
            seen.add(t)
            out.append(t)
    return ','.join(out)[:300]


# ── Page routes ───────────────────────────────────────────────────────────────

@bp.route('/blog/<slug>')
@optional_auth
def post_page(slug):
    db = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute('''
            SELECT p.*, u.name as author_name, u.avatar as author_avatar, u.bio as author_bio
            FROM blog_posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.slug=%s AND (p.status='published' OR p.user_id=%s)
        ''', (slug, request.user_id or -1))
        post = cur.fetchone()
    finally:
        db.close()
    if not post:
        abort(404)
    db2 = get_db()
    cur2 = db2.cursor()
    try:
        cur2.execute('UPDATE blog_posts SET views=views+1 WHERE id=%s', (post['id'],))
        db2.commit()
    finally:
        db2.close()

    post['content_html'] = _to_html(post.get('content') or '{}')
    post['pub_date']     = _fmt_date(post.get('published_at'))
    post['is_owner']     = (request.user_id == post['user_id'])
    post['tags_list']    = [t.strip() for t in (post.get('tags') or '').split(',') if t.strip()]
    return render_template('blog_post.html', post=post, user_id=request.user_id)


@bp.route('/write')
@bp.route('/write/<int:post_id>')
def editor_page(post_id=None):
    user_id = verify_token(request.cookies.get('token'))
    if not user_id:
        return redirect('/explore')
    post = None
    if post_id:
        db = get_db()
        cur = db.cursor(dictionary=True)
        try:
            cur.execute('SELECT * FROM blog_posts WHERE id=%s AND user_id=%s', (post_id, user_id))
            post = cur.fetchone()
        finally:
            db.close()
        if not post:
            abort(404)
    return render_template('blog_editor.html', post=post)


# ── API ───────────────────────────────────────────────────────────────────────

@bp.route('/api/blog/posts', methods=['GET'])
@optional_auth
def list_posts():
    q   = request.args.get('q', '')
    tag = request.args.get('tag', '')
    try:
        page     = max(1, int(request.args.get('page', 1)))
        per_page = min(max(1, int(request.args.get('per_page', 12))), 50)
    except (ValueError, TypeError):
        page, per_page = 1, 12
    offset = (page - 1) * per_page

    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        conds, params = ["p.status='published'"], []
        if q:
            conds.append('(MATCH(p.title,p.excerpt,p.tags) AGAINST(%s IN BOOLEAN MODE) OR p.title LIKE %s)')
            params += [f'{q}*', f'%{q}%']
        if tag:
            conds.append('FIND_IN_SET(%s, p.tags)')
            params.append(tag.lower())

        where = ' AND '.join(conds)
        cur.execute(f'SELECT COUNT(*) as total FROM blog_posts p WHERE {where}', params)
        total = cur.fetchone()['total']

        cur.execute(f'''
            SELECT p.id, p.title, p.slug, p.excerpt, p.cover_image, p.tags,
                   p.reading_time, p.views, p.likes, p.published_at, p.featured,
                   u.id as author_id, u.name as author_name, u.avatar as author_avatar
            FROM blog_posts p JOIN users u ON p.user_id=u.id
            WHERE {where}
            ORDER BY p.featured DESC, p.published_at DESC
            LIMIT %s OFFSET %s
        ''', params + [per_page, offset])
        posts = cur.fetchall()
    finally:
        db.close()

    for p in posts:
        if p.get('published_at'):
            p['pub_date']     = _fmt_date(p['published_at'])
            p['published_at'] = p['published_at'].isoformat()

    return jsonify({'posts': posts, 'total': total, 'page': page, 'per_page': per_page})


@bp.route('/api/blog/posts', methods=['POST'])
@login_required
def create_post():
    data    = request.json or {}
    title   = (data.get('title') or 'Untitled').strip()[:500]
    content = data.get('content', '{}')
    try:
        content = json.dumps(json.loads(content) if isinstance(content, str) else content)
    except Exception:
        content = '{}'

    excerpt = (data.get('excerpt') or '').strip()[:500]
    cover   = (data.get('cover_image') or '')[:500]
    tags    = _normalize_tags(data.get('tags') or '')
    rtime   = _reading_time(content)

    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        slug = _unique_slug(cur, _generate_slug(title))
        cur.execute('''
            INSERT INTO blog_posts (user_id,title,slug,excerpt,content,cover_image,tags,reading_time)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
        ''', (request.user_id, title, slug, excerpt, content, cover, tags, rtime))
        db.commit()
        post_id = cur.lastrowid
        cur.execute('SELECT id,title,slug,status FROM blog_posts WHERE id=%s', (post_id,))
        return jsonify(cur.fetchone()), 201
    except Exception:
        return jsonify({'error': 'Failed to create post'}), 500
    finally:
        db.close()


@bp.route('/api/blog/posts/slug/<slug>', methods=['GET'])
@optional_auth
def get_post_by_slug(slug):
    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute('''
            SELECT p.*, u.name as author_name, u.avatar as author_avatar, u.bio as author_bio
            FROM blog_posts p JOIN users u ON p.user_id=u.id
            WHERE p.slug=%s AND (p.status='published' OR p.user_id=%s)
        ''', (slug, request.user_id or -1))
        post = cur.fetchone()
    finally:
        db.close()
    if not post:
        return jsonify({'error': 'Not found'}), 404
    db2  = get_db()
    cur2 = db2.cursor()
    try:
        cur2.execute('UPDATE blog_posts SET views=views+1 WHERE id=%s', (post['id'],))
        db2.commit()
    finally:
        db2.close()
    for f in ('created_at', 'updated_at', 'published_at'):
        if post.get(f): post[f] = post[f].isoformat()
    post['is_owner'] = (request.user_id == post['user_id'])
    return jsonify(post)


@bp.route('/api/blog/posts/<int:post_id>', methods=['GET'])
@optional_auth
def get_post(post_id):
    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute('''
            SELECT p.*, u.name as author_name, u.avatar as author_avatar
            FROM blog_posts p JOIN users u ON p.user_id=u.id
            WHERE p.id=%s AND (p.status='published' OR p.user_id=%s)
        ''', (post_id, request.user_id or -1))
        post = cur.fetchone()
    finally:
        db.close()
    if not post:
        return jsonify({'error': 'Not found'}), 404
    for f in ('created_at', 'updated_at', 'published_at'):
        if post.get(f): post[f] = post[f].isoformat()
    return jsonify(post)


@bp.route('/api/blog/posts/<int:post_id>', methods=['PUT'])
@login_required
def update_post(post_id):
    data = request.json or {}
    db   = get_db()
    cur  = db.cursor(dictionary=True)
    try:
        cur.execute('SELECT id,slug FROM blog_posts WHERE id=%s AND user_id=%s', (post_id, request.user_id))
        row = cur.fetchone()
        if not row:
            return jsonify({'error': 'Not found'}), 404

        title   = (data.get('title') or 'Untitled').strip()[:500]
        content = data.get('content', '{}')
        try:
            content = json.dumps(json.loads(content) if isinstance(content, str) else content)
        except Exception:
            content = '{}'

        excerpt  = (data.get('excerpt') or '').strip()[:500]
        cover    = (data.get('cover_image') or '')[:500]
        tags     = _normalize_tags(data.get('tags') or '')
        rtime    = _reading_time(content)
        raw_slug = (data.get('slug') or _generate_slug(title)).strip()
        slug     = _unique_slug(cur, raw_slug, exclude_id=post_id)

        cur.execute('''
            UPDATE blog_posts SET title=%s,slug=%s,excerpt=%s,content=%s,
            cover_image=%s,tags=%s,reading_time=%s,updated_at=NOW()
            WHERE id=%s AND user_id=%s
        ''', (title, slug, excerpt, content, cover, tags, rtime, post_id, request.user_id))
        db.commit()
        return jsonify({'success': True, 'slug': slug})
    except Exception:
        return jsonify({'error': 'Failed to update post'}), 500
    finally:
        db.close()


@bp.route('/api/blog/posts/<int:post_id>', methods=['DELETE'])
@login_required
def delete_post(post_id):
    db  = get_db()
    cur = db.cursor()
    try:
        cur.execute('DELETE FROM blog_posts WHERE id=%s AND user_id=%s', (post_id, request.user_id))
        db.commit()
    finally:
        db.close()
    return jsonify({'success': True})


@bp.route('/api/blog/posts/<int:post_id>/publish', methods=['POST'])
@login_required
def toggle_publish(post_id):
    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute('SELECT id,status FROM blog_posts WHERE id=%s AND user_id=%s', (post_id, request.user_id))
        row = cur.fetchone()
        if not row:
            return jsonify({'error': 'Not found'}), 404
        new_status = 'published' if row['status'] != 'published' else 'draft'
        if new_status == 'published':
            cur.execute("UPDATE blog_posts SET status='published',published_at=NOW() WHERE id=%s", (post_id,))
        else:
            cur.execute("UPDATE blog_posts SET status='draft' WHERE id=%s", (post_id,))
        db.commit()
        return jsonify({'success': True, 'status': new_status})
    finally:
        db.close()


@bp.route('/api/blog/posts/<int:post_id>/featured', methods=['POST'])
@login_required
def toggle_featured(post_id):
    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        # Only allow the post owner to feature their own post
        cur.execute('SELECT id,featured FROM blog_posts WHERE id=%s AND user_id=%s', (post_id, request.user_id))
        row = cur.fetchone()
        if not row:
            return jsonify({'error': 'Not found'}), 404
        new_val = 0 if row['featured'] else 1
        cur.execute('UPDATE blog_posts SET featured=%s WHERE id=%s', (new_val, post_id))
        db.commit()
        return jsonify({'success': True, 'featured': bool(new_val)})
    finally:
        db.close()


@bp.route('/api/blog/posts/<int:post_id>/like', methods=['POST'])
@optional_auth
def like_post(post_id):
    data        = request.json or {}
    session_key = (data.get('session_key') or '')[:64]

    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        if request.user_id:
            cur.execute('SELECT id FROM blog_likes WHERE post_id=%s AND user_id=%s', (post_id, request.user_id))
            if cur.fetchone():
                cur.execute('DELETE FROM blog_likes WHERE post_id=%s AND user_id=%s', (post_id, request.user_id))
                cur.execute('UPDATE blog_posts SET likes=GREATEST(0,likes-1) WHERE id=%s', (post_id,))
                action = 'unliked'
            else:
                cur.execute('INSERT INTO blog_likes (post_id,user_id) VALUES (%s,%s)', (post_id, request.user_id))
                cur.execute('UPDATE blog_posts SET likes=likes+1 WHERE id=%s', (post_id,))
                action = 'liked'
        elif session_key:
            cur.execute('SELECT id FROM blog_likes WHERE post_id=%s AND session_key=%s', (post_id, session_key))
            if cur.fetchone():
                cur.execute('DELETE FROM blog_likes WHERE post_id=%s AND session_key=%s', (post_id, session_key))
                cur.execute('UPDATE blog_posts SET likes=GREATEST(0,likes-1) WHERE id=%s', (post_id,))
                action = 'unliked'
            else:
                cur.execute('INSERT INTO blog_likes (post_id,session_key) VALUES (%s,%s)', (post_id, session_key))
                cur.execute('UPDATE blog_posts SET likes=likes+1 WHERE id=%s', (post_id,))
                action = 'liked'
        else:
            return jsonify({'error': 'No identity provided'}), 400

        db.commit()
        cur.execute('SELECT likes FROM blog_posts WHERE id=%s', (post_id,))
        row = cur.fetchone()
        return jsonify({'success': True, 'action': action, 'likes': row['likes'] if row else 0})
    except Exception:
        return jsonify({'error': 'Failed to update like'}), 500
    finally:
        db.close()


@bp.route('/api/blog/posts/<int:post_id>/comments', methods=['GET'])
def get_comments(post_id):
    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute('''
            SELECT c.id, c.content, c.author_name, c.user_id, c.created_at,
                   u.name as user_name, u.avatar as user_avatar
            FROM blog_comments c
            LEFT JOIN users u ON c.user_id=u.id
            WHERE c.post_id=%s ORDER BY c.created_at ASC LIMIT 200
        ''', (post_id,))
        comments = cur.fetchall()
    finally:
        db.close()

    from urllib.parse import quote as _q
    for c in comments:
        if c.get('created_at'):
            c['created_at'] = c['created_at'].isoformat()
        display = c.get('user_name') or c.get('author_name') or 'Anonymous'
        c['display_name']  = display
        c['author_name']   = display   # backward-compat alias
        c['avatar']        = c.get('user_avatar') or \
            f"https://ui-avatars.com/api/?name={_q(display[:2])}&size=40&background=6366f1&color=fff"
        c['author_avatar'] = c['avatar']
    return jsonify(comments)


@bp.route('/api/blog/posts/<int:post_id>/comments', methods=['POST'])
@optional_auth
def add_comment(post_id):
    data    = request.json or {}
    content = (data.get('content') or '').strip()[:2000]
    if not content:
        return jsonify({'error': 'Comment cannot be empty'}), 400
    # For guests, use provided name; for users, we'll fetch from DB
    guest_name = (data.get('author_name') or 'Anonymous').strip()[:100]

    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute("SELECT id FROM blog_posts WHERE id=%s AND status='published'", (post_id,))
        if not cur.fetchone():
            return jsonify({'error': 'Post not found'}), 404

        if request.user_id:
            # Fetch the user's actual name so author_name is always populated
            cur.execute('SELECT name FROM users WHERE id=%s', (request.user_id,))
            u = cur.fetchone()
            stored_author = u['name'] if u else 'Unknown'
        else:
            stored_author = guest_name

        cur.execute(
            'INSERT INTO blog_comments (post_id,user_id,author_name,content) VALUES (%s,%s,%s,%s)',
            (post_id, request.user_id, stored_author, content)
        )
        db.commit()
        cid = cur.lastrowid

        if request.user_id:
            cur.execute('''
                SELECT c.id, c.content, c.author_name, c.user_id, c.created_at,
                       u.name as user_name, u.avatar as user_avatar
                FROM blog_comments c JOIN users u ON c.user_id=u.id WHERE c.id=%s
            ''', (cid,))
        else:
            cur.execute('SELECT id,content,author_name,user_id,created_at FROM blog_comments WHERE id=%s', (cid,))
        c = cur.fetchone()

        if c.get('created_at'):
            c['created_at'] = c['created_at'].isoformat()
        from urllib.parse import quote as _q
        display = c.get('user_name') or c.get('author_name') or 'Anonymous'
        c['display_name']  = display
        c['author_name']   = display
        c['avatar']        = c.get('user_avatar') or \
            f"https://ui-avatars.com/api/?name={_q(display[:2])}&size=40&background=6366f1&color=fff"
        c['author_avatar'] = c['avatar']
        return jsonify(c), 201
    except Exception:
        return jsonify({'error': 'Failed to post comment'}), 500
    finally:
        db.close()


@bp.route('/api/blog/comments/<int:comment_id>', methods=['DELETE'])
@login_required
def delete_comment(comment_id):
    db  = get_db()
    cur = db.cursor()
    try:
        cur.execute('''
            DELETE c FROM blog_comments c
            LEFT JOIN blog_posts p ON c.post_id=p.id
            WHERE c.id=%s AND (c.user_id=%s OR p.user_id=%s)
        ''', (comment_id, request.user_id, request.user_id))
        db.commit()
    finally:
        db.close()
    return jsonify({'success': True})


@bp.route('/api/blog/my-posts', methods=['GET'])
@login_required
def my_posts():
    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute('''
            SELECT id,title,slug,status,tags,reading_time,views,likes,
                   cover_image,excerpt,created_at,updated_at,published_at
            FROM blog_posts WHERE user_id=%s ORDER BY updated_at DESC
        ''', (request.user_id,))
        posts = cur.fetchall()
    finally:
        db.close()
    for p in posts:
        for f in ('created_at', 'updated_at', 'published_at'):
            if p.get(f): p[f] = p[f].isoformat()
    return jsonify(posts)


@bp.route('/api/blog/tags', methods=['GET'])
def blog_tags():
    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute("SELECT tags FROM blog_posts WHERE status='published' AND tags!=''")
        rows = cur.fetchall()
    finally:
        db.close()
    counts = {}
    for row in rows:
        for t in row['tags'].split(','):
            t = t.strip()
            if t: counts[t] = counts.get(t, 0) + 1
    return jsonify([{'name': k, 'count': v} for k, v in sorted(counts.items(), key=lambda x: -x[1])[:50]])


@bp.route('/api/blog/upload', methods=['POST'])
@login_required
def upload_image():
    import uuid
    import requests as http_requests

    upload_dir = os.path.join(os.path.dirname(__file__), '..', 'static', 'uploads', 'blog')
    os.makedirs(upload_dir, exist_ok=True)

    # ── URL upload (from editor's "upload by URL" feature) ────────────────────
    if request.is_json:
        data = request.json or {}
        url  = (data.get('url') or '').strip()
        if not url:
            return jsonify({'success': 0, 'message': 'No URL provided'}), 400
        if not url.startswith(('http://', 'https://')):
            return jsonify({'success': 0, 'message': 'Invalid URL'}), 400
        try:
            r = http_requests.get(url, timeout=10, stream=True,
                                  headers={'User-Agent': 'Mozilla/5.0 (compatible; Grimoire/1.0)'})
            ct = r.headers.get('Content-Type', '').split(';')[0].strip().lower()
            ext_map = {
                'image/jpeg': '.jpg', 'image/jpg': '.jpg',
                'image/png': '.png', 'image/gif': '.gif',
                'image/webp': '.webp', 'image/svg+xml': '.svg',
            }
            ext = ext_map.get(ct)
            if not ext:
                return jsonify({'success': 0, 'message': 'URL does not point to a supported image'}), 400

            content = b''
            for chunk in r.iter_content(chunk_size=65536):
                content += chunk
                if len(content) > MAX_UPLOAD_BYTES:
                    return jsonify({'success': 0, 'message': 'Image exceeds 5 MB limit'}), 400

            fname = f'{uuid.uuid4().hex}{ext}'
            path  = os.path.join(upload_dir, fname)
            with open(path, 'wb') as f:
                f.write(content)
            return jsonify({'success': 1, 'file': {'url': f'/static/uploads/blog/{fname}'}})
        except Exception:
            return jsonify({'success': 0, 'message': 'Failed to fetch image from URL'}), 400

    # ── File upload ───────────────────────────────────────────────────────────
    if 'image' not in request.files:
        return jsonify({'success': 0, 'message': 'No file provided'}), 400

    f   = request.files['image']
    ext = os.path.splitext(f.filename or '')[1].lower()
    if ext not in ('.jpg', '.jpeg', '.png', '.gif', '.webp'):
        return jsonify({'success': 0, 'message': 'Unsupported file type'}), 400

    # Check size by reading into memory (max 5 MB)
    data = f.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        return jsonify({'success': 0, 'message': 'File exceeds 5 MB limit'}), 400

    # Basic magic-byte check to ensure it's actually an image
    MAGIC = {
        b'\xff\xd8\xff': '.jpg',
        b'\x89PNG': '.png',
        b'GIF8': '.gif',
        b'RIFF': '.webp',  # webp starts RIFF....WEBP
    }
    is_valid = any(data[:len(sig)] == sig for sig in MAGIC)
    # SVG / WebP extra checks relaxed — rely on extension for those
    if not is_valid and ext not in ('.webp', '.gif'):
        return jsonify({'success': 0, 'message': 'File content does not match image type'}), 400

    fname = f'{uuid.uuid4().hex}{ext}'
    path  = os.path.join(upload_dir, fname)
    with open(path, 'wb') as out:
        out.write(data)

    return jsonify({'success': 1, 'file': {'url': f'/static/uploads/blog/{fname}'}})


@bp.route('/api/blog/rss.xml', methods=['GET'])
def rss_feed():
    import html as _e
    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute('''
            SELECT p.title, p.slug, p.excerpt, p.published_at, u.name as author_name
            FROM blog_posts p JOIN users u ON p.user_id=u.id
            WHERE p.status='published' ORDER BY p.published_at DESC LIMIT 20
        ''')
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
          <author>{_e.escape(p["author_name"])}</author>
          <pubDate>{dt}</pubDate>
          <guid>{host}/blog/{p["slug"]}</guid>
        </item>'''
    xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Grimoire</title>
    <link>{host}/explore</link>
    <description>Stories and articles from the Grimoire community</description>
    {items}
  </channel>
</rss>'''
    return Response(xml, mimetype='application/rss+xml')


@bp.route('/api/blog/writers', methods=['GET'])
def blog_writers():
    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute('''
            SELECT u.id, u.name, u.avatar,
                   COUNT(p.id)  AS post_count,
                   SUM(p.views) AS total_views,
                   SUM(p.likes) AS total_likes
            FROM blog_posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.status = 'published'
            GROUP BY u.id
            ORDER BY total_views DESC
            LIMIT 20
        ''')
        writers = cur.fetchall()
    finally:
        db.close()
    for w in writers:
        w['total_views'] = int(w['total_views'] or 0)
        w['total_likes'] = int(w['total_likes'] or 0)
    return jsonify(writers)
