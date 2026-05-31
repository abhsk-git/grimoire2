from flask import Blueprint, request, jsonify, render_template, redirect, abort, Response
import json, re, unicodedata, os, datetime, ipaddress, socket
from urllib.parse import urlparse
from utils import get_db, login_required, optional_auth, verify_token, cache_get, cache_set, cache_delete_prefix
from extensions import limiter
import nh3
from bs4 import BeautifulSoup
import threading
from mailer import send_comment_notification, send_reply_notification

bp = Blueprint('blog', __name__)

MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB

_SAFE_EMBED_HOSTS = {
    'www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com',
    'player.vimeo.com', 'vimeo.com',
    'twitter.com', 'www.twitter.com',
    'www.instagram.com',
    'open.spotify.com',
    'soundcloud.com',
    'codepen.io',
}

def _is_safe_external_url(url: str) -> bool:
    """SSRF prevention: reject private/loopback IPs."""
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ('http', 'https'):
            return False
        host = parsed.hostname
        if not host:
            return False
        ip = ipaddress.ip_address(socket.getaddrinfo(host, None)[0][4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            return False
        return True
    except Exception:
        return False


def _validate_comment_media(media_url, media_type):
    """Validate an optional comment attachment.

    Returns (url, type) to store, (None, None) when no media was supplied,
    or False when media was supplied but is not allowed.

    GIFs must be https URLs on *.giphy.com (we only ever hand out GIPHY URLs
    via the proxy). Stickers must point at our own self-hosted pack. This keeps
    comment media to an allowlist — no arbitrary user-supplied image URLs.
    """
    if not media_url:
        return (None, None)
    media_url = str(media_url).strip()[:512]
    if media_type not in ('gif', 'sticker'):
        return False
    if media_type == 'sticker':
        if not re.fullmatch(r'/static/stickers/[a-z0-9_-]+\.svg', media_url):
            return False
    else:  # gif
        p = urlparse(media_url)
        host = (p.hostname or '').lower()
        if p.scheme != 'https' or not (host == 'giphy.com' or host.endswith('.giphy.com')):
            return False
    return (media_url, media_type)


_HERE = os.path.dirname(os.path.abspath(__file__))


# ── Utilities ─────────────────────────────────────────────────────────────────

def _delete_local_file(url):
    """Delete a local upload file given its URL. Ignores external URLs."""
    if not url or not url.startswith('/static/uploads/'):
        return
    path = os.path.join(_HERE, '..', url.lstrip('/'))
    try:
        if os.path.isfile(path):
            os.remove(path)
    except OSError:
        pass


def _extract_content_urls(content):
    """Return all local image URLs embedded in EditorJS content JSON."""
    urls = []
    try:
        blocks = (json.loads(content) if isinstance(content, str) else content).get('blocks', [])
        for block in blocks:
            if block.get('type') == 'image':
                url = (block.get('data') or {}).get('file', {}).get('url', '')
                if url.startswith('/static/uploads/'):
                    urls.append(url)
    except Exception:
        pass
    return urls

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


def _reading_time(content):
    try:
        text = re.sub(r'<[^>]+>', ' ', content or '')
        words = len(text.split())
        minutes = words / 200
        return max(1, round(minutes))
    except Exception:
        return 1


_INLINE_TAGS  = frozenset({'b', 'i', 'u', 's', 'strong', 'em', 'del', 'a', 'code', 'mark', 'sub', 'sup', 'span'})
_INLINE_ATTRS = {'a': {'href', 'title', 'target'}, 'span': {'style', 'class'}, 'mark': {'style', 'data-color'}}

_TIPTAP_TAGS  = frozenset({
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'figure', 'figcaption', 'hr', 'br', 'div', 'span',
    'strong', 'em', 'b', 'i', 'u', 's', 'del',
    'a', 'mark', 'sub', 'sup', 'img', 'input',
    'details', 'summary', 'iframe',
})
_TIPTAP_ATTRS = {
    'a':         {'href', 'title', 'target'},
    'img':       {'src', 'alt', 'loading', 'class', 'width', 'height'},
    'span':      {'style', 'class', 'data-type'},
    'div':       {'class', 'data-type', 'data-callout'},
    'code':      {'class'},
    'pre':       {'class'},
    'th':        {'colspan', 'rowspan'},
    'td':        {'colspan', 'rowspan'},
    'input':     {'type', 'checked', 'disabled'},
    'li':        {'data-checked'},
    'p':         {'style', 'class'},
    'h1': {'id'}, 'h2': {'id'}, 'h3': {'id'},
    'h4': {'id'}, 'h5': {'id'}, 'h6': {'id'},
    'blockquote': {'style'},
    'mark':      {'style', 'data-color'},
    'figure':    {'class'},
    'details':   {'open'},
    'ul':        {'data-type'},
    'ol':        {'start'},
    'iframe':    {'src', 'frameborder', 'allowfullscreen', 'loading', 'width', 'height'},
}


def _sanitize_inline(text: str) -> str:
    """Sanitize EditorJS inline HTML with nh3 (allows safe formatting tags only)."""
    if not text:
        return ''
    return nh3.clean(text, tags=_INLINE_TAGS, attributes=_INLINE_ATTRS, link_rel='noopener noreferrer')


def _sanitize_tiptap_html(html: str) -> str:
    """Sanitize full Tiptap HTML before persisting: strip XSS via nh3, then validate iframe srcs."""
    if not html:
        return ''
    cleaned = nh3.clean(html, tags=_TIPTAP_TAGS, attributes=_TIPTAP_ATTRS, link_rel='noopener noreferrer')
    # Validate iframe srcs against the embed allowlist
    soup = BeautifulSoup(cleaned, 'html.parser')
    safe_hosts = {h.lstrip('www.') for h in _SAFE_EMBED_HOSTS}
    for iframe in soup.find_all('iframe'):
        src = iframe.get('src', '')
        try:
            parsed = urlparse(src)
            host = (parsed.hostname or '').lstrip('www.')
            if parsed.scheme not in ('http', 'https') or host not in safe_hosts:
                iframe.decompose()
        except Exception:
            iframe.decompose()
    return str(soup)


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
            raw_embed = bd.get('embed', '') or ''
            parsed_embed = urlparse(raw_embed)
            embed_host   = (parsed_embed.hostname or '').lstrip('www.')
            safe_embed_hosts = {h.lstrip('www.') for h in _SAFE_EMBED_HOSTS}
            if parsed_embed.scheme not in ('http', 'https') or embed_host not in safe_embed_hosts:
                continue  # drop untrusted embed blocks entirely
            embed    = _e.escape(raw_embed)
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


# ── Notification helpers ───────────────────────────────────────────────────────

def _fire_comment_notifications(cur, post_id: int, parent_id, commenter_user_id, commenter_name: str, comment_text: str):
    """Dispatch comment/reply notification emails in a background thread."""
    from blueprints.settings import _load as _load_settings

    try:
        # Get post info + author
        cur.execute(
            'SELECT title, slug, user_id FROM blog_posts WHERE id=%s',
            (post_id,)
        )
        post = cur.fetchone()
        if not post:
            return

        post_title     = post['title']
        post_slug      = post['slug']
        post_author_id = post['user_id']

        notify_targets = []  # list of (email, name, kind) tuples

        # 1. Notify the post author on any top-level comment (and replies, unless they are the commenter)
        if post_author_id != commenter_user_id:
            cur.execute('SELECT email, settings FROM users WHERE id=%s', (post_author_id,))
            author_row = cur.fetchone()
            if author_row:
                author_settings = _load_settings(author_row.get('settings'))
                if author_settings.get('notifications', {}).get('onComment', True):
                    notify_targets.append((author_row['email'], 'comment'))

        # 2. Notify the parent commenter if this is a reply
        if parent_id:
            cur.execute(
                'SELECT user_id FROM blog_comments WHERE id=%s',
                (parent_id,)
            )
            parent = cur.fetchone()
            if parent and parent['user_id'] and parent['user_id'] != commenter_user_id and parent['user_id'] != post_author_id:
                cur.execute('SELECT email, settings FROM users WHERE id=%s', (parent['user_id'],))
                parent_row = cur.fetchone()
                if parent_row:
                    parent_settings = _load_settings(parent_row.get('settings'))
                    if parent_settings.get('notifications', {}).get('onReply', True):
                        notify_targets.append((parent_row['email'], 'reply'))

        if not notify_targets:
            return

        def _send_all():
            for email, kind in notify_targets:
                try:
                    if kind == 'comment':
                        send_comment_notification(email, post_title, post_slug, commenter_name, comment_text)
                    else:
                        send_reply_notification(email, post_title, post_slug, commenter_name, comment_text)
                except Exception:
                    pass

        threading.Thread(target=_send_all, daemon=True).start()

    except Exception:
        pass  # notifications are best-effort


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

    # Cache unfiltered first-page requests (the common explore load)
    cache_key = f'blog_posts:{q}:{tag}:{page}:{per_page}'
    if not q and not tag and page == 1:
        cached = cache_get(cache_key)
        if cached is not None:
            return jsonify(cached)

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
                   u.id as author_id, u.name as author_name, u.avatar as author_avatar,
                   u.handle as author_handle
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

    result = {'posts': posts, 'total': total, 'page': page, 'per_page': per_page}
    if not q and not tag and page == 1:
        cache_set(cache_key, result, ttl=30)
    return jsonify(result)


@bp.route('/api/blog/posts', methods=['POST'])
@login_required
def create_post():
    data    = request.json or {}
    title   = (data.get('title') or 'Untitled').strip()[:500]
    raw_content = (data.get('content') or '').strip()
    # Sanitize Tiptap HTML; leave EditorJS JSON untouched (it's sanitized at render time)
    content = _sanitize_tiptap_html(raw_content) if not raw_content.lstrip().startswith('{') else raw_content
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
            SELECT p.*, u.name as author_name, u.avatar as author_avatar,
                   u.bio as author_bio, u.handle as author_handle
            FROM blog_posts p JOIN users u ON p.user_id=u.id
            WHERE p.slug=%s AND (p.status='published' OR p.user_id=%s)
        ''', (slug, request.user_id or -1))
        post = cur.fetchone()
    finally:
        db.close()
    if not post:
        return jsonify({'error': 'Not found'}), 404
    if request.user_id != post['user_id']:
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
        cur.execute('SELECT id,slug,cover_image FROM blog_posts WHERE id=%s AND user_id=%s', (post_id, request.user_id))
        row = cur.fetchone()
        if not row:
            return jsonify({'error': 'Not found'}), 404

        old_cover = row.get('cover_image') or ''

        title       = (data.get('title') or 'Untitled').strip()[:500]
        raw_content = (data.get('content') or '').strip()
        content     = _sanitize_tiptap_html(raw_content) if not raw_content.lstrip().startswith('{') else raw_content
        excerpt     = (data.get('excerpt') or '').strip()[:500]
        cover       = (data.get('cover_image') or '')[:500]
        tags        = _normalize_tags(data.get('tags') or '')
        rtime       = _reading_time(content)
        raw_slug    = (data.get('slug') or _generate_slug(title)).strip()
        slug        = _unique_slug(cur, raw_slug, exclude_id=post_id)

        cur.execute('''
            UPDATE blog_posts SET title=%s,slug=%s,excerpt=%s,content=%s,
            cover_image=%s,tags=%s,reading_time=%s,updated_at=NOW()
            WHERE id=%s AND user_id=%s
        ''', (title, slug, excerpt, content, cover, tags, rtime, post_id, request.user_id))
        db.commit()

        if old_cover and old_cover != cover:
            _delete_local_file(old_cover)

        return jsonify({'success': True, 'slug': slug})
    except Exception:
        return jsonify({'error': 'Failed to update post'}), 500
    finally:
        db.close()


@bp.route('/api/blog/posts/<int:post_id>', methods=['DELETE'])
@login_required
def delete_post(post_id):
    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute('SELECT cover_image, content FROM blog_posts WHERE id=%s AND user_id=%s', (post_id, request.user_id))
        row = cur.fetchone()
        if not row:
            return jsonify({'error': 'Not found'}), 404

        cur.execute('DELETE FROM blog_posts WHERE id=%s AND user_id=%s', (post_id, request.user_id))
        db.commit()

        _delete_local_file(row.get('cover_image') or '')
        for url in _extract_content_urls(row.get('content') or '{}'):
            _delete_local_file(url)
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
        cur.execute('SELECT user_id FROM blog_posts WHERE id=%s', (post_id,))
        post_row = cur.fetchone()
        if not post_row:
            return jsonify({'error': 'Not found'}), 404
        if request.user_id and request.user_id == post_row['user_id']:
            return jsonify({'error': 'Cannot like your own post'}), 403

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
            SELECT c.id, c.content, c.media_url, c.media_type, c.author_name,
                   c.user_id, c.created_at, c.parent_id, c.likes, c.dislikes,
                   u.name as user_name, u.avatar as user_avatar, u.handle as user_handle
            FROM blog_comments c
            LEFT JOIN users u ON c.user_id=u.id
            WHERE c.post_id=%s ORDER BY c.created_at ASC LIMIT 500
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
        c['author_name']   = display
        c['avatar']        = c.get('user_avatar') or \
            f"https://ui-avatars.com/api/?name={_q(display[:2])}&size=40&background=6366f1&color=fff"
        c['author_avatar'] = c['avatar']
        c['handle']        = c.get('user_handle')
        c['parent_id']     = c.get('parent_id')
        c['likes']         = c.get('likes') or 0
        c['dislikes']      = c.get('dislikes') or 0
    return jsonify(comments)


@bp.route('/api/blog/posts/<int:post_id>/comments', methods=['POST'])
@optional_auth
def add_comment(post_id):
    data       = request.json or {}
    content    = (data.get('content') or '').strip()[:2000]
    media      = _validate_comment_media(data.get('media_url'), data.get('media_type'))
    if media is False:
        return jsonify({'error': 'Invalid attachment'}), 400
    media_url, media_type = media
    if not content and not media_url:
        return jsonify({'error': 'Comment cannot be empty'}), 400
    guest_name = (data.get('author_name') or 'Anonymous').strip()[:100]
    parent_id  = data.get('parent_id') or None

    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute("SELECT id FROM blog_posts WHERE id=%s AND status='published'", (post_id,))
        if not cur.fetchone():
            return jsonify({'error': 'Post not found'}), 404

        if parent_id:
            cur.execute('SELECT id FROM blog_comments WHERE id=%s AND post_id=%s', (parent_id, post_id))
            if not cur.fetchone():
                return jsonify({'error': 'Invalid parent comment'}), 400

        if request.user_id:
            cur.execute('SELECT name FROM users WHERE id=%s', (request.user_id,))
            u = cur.fetchone()
            stored_author = u['name'] if u else 'Unknown'
        else:
            stored_author = guest_name

        cur.execute(
            'INSERT INTO blog_comments (post_id,parent_id,user_id,author_name,content,media_url,media_type) '
            'VALUES (%s,%s,%s,%s,%s,%s,%s)',
            (post_id, parent_id, request.user_id, stored_author, content, media_url, media_type)
        )
        db.commit()
        cid = cur.lastrowid

        # Fire notification emails off the request thread so they don't block the response
        notify_text = content or ('[sticker]' if media_type == 'sticker' else '[GIF]')
        _fire_comment_notifications(cur, post_id, parent_id, request.user_id, stored_author, notify_text)

        if request.user_id:
            cur.execute('''
                SELECT c.id, c.content, c.media_url, c.media_type, c.author_name,
                       c.user_id, c.created_at, c.parent_id, c.likes, c.dislikes,
                       u.name as user_name, u.avatar as user_avatar, u.handle as user_handle
                FROM blog_comments c JOIN users u ON c.user_id=u.id WHERE c.id=%s
            ''', (cid,))
        else:
            cur.execute(
                'SELECT id,content,media_url,media_type,author_name,user_id,created_at,parent_id,likes,dislikes '
                'FROM blog_comments WHERE id=%s',
                (cid,)
            )
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
        c['handle']        = c.get('user_handle')
        c['parent_id']     = c.get('parent_id')
        c['likes']         = c.get('likes') or 0
        c['dislikes']      = c.get('dislikes') or 0
        return jsonify(c), 201
    except Exception:
        return jsonify({'error': 'Failed to post comment'}), 500
    finally:
        db.close()


@bp.route('/api/blog/comments/<int:comment_id>', methods=['DELETE'])
@login_required
def delete_comment(comment_id):
    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute('''
            SELECT c.id FROM blog_comments c
            LEFT JOIN blog_posts p ON c.post_id=p.id
            WHERE c.id=%s AND (c.user_id=%s OR p.user_id=%s)
        ''', (comment_id, request.user_id, request.user_id))
        if not cur.fetchone():
            return jsonify({'error': 'Not found'}), 404

        # Delete the whole subtree, not just one level — replies can chain
        # (reply→reply→…), and leaving descendants behind orphans them.
        # Gathered iteratively so this works regardless of MySQL CTE support.
        ids      = [comment_id]
        frontier = [comment_id]
        while frontier:
            placeholders = ','.join(['%s'] * len(frontier))
            cur.execute(
                f'SELECT id FROM blog_comments WHERE parent_id IN ({placeholders})',
                frontier
            )
            children = [row['id'] for row in cur.fetchall()]
            new      = [c for c in children if c not in ids]
            ids.extend(new)
            frontier = new

        placeholders = ','.join(['%s'] * len(ids))
        cur.execute(f'DELETE FROM comment_votes WHERE comment_id IN ({placeholders})', ids)
        cur.execute(f'DELETE FROM blog_comments WHERE id IN ({placeholders})', ids)
        db.commit()
    finally:
        db.close()
    return jsonify({'success': True})


@bp.route('/api/blog/comments/<int:comment_id>/vote', methods=['POST'])
def vote_comment(comment_id):
    data        = request.json or {}
    vote        = data.get('vote')
    session_key = (data.get('session_key') or '').strip()[:64]

    if vote not in (1, -1) or not session_key:
        return jsonify({'error': 'Invalid vote'}), 400

    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute(
            'SELECT vote FROM comment_votes WHERE comment_id=%s AND session_key=%s',
            (comment_id, session_key)
        )
        existing = cur.fetchone()

        if existing:
            if existing['vote'] == vote:
                # Same vote → toggle off
                cur.execute(
                    'DELETE FROM comment_votes WHERE comment_id=%s AND session_key=%s',
                    (comment_id, session_key)
                )
                if vote == 1:
                    cur.execute('UPDATE blog_comments SET likes=GREATEST(0,likes-1) WHERE id=%s', (comment_id,))
                else:
                    cur.execute('UPDATE blog_comments SET dislikes=GREATEST(0,dislikes-1) WHERE id=%s', (comment_id,))
                action = 'removed'
            else:
                # Flip vote
                cur.execute(
                    'UPDATE comment_votes SET vote=%s WHERE comment_id=%s AND session_key=%s',
                    (vote, comment_id, session_key)
                )
                if vote == 1:
                    cur.execute(
                        'UPDATE blog_comments SET likes=likes+1, dislikes=GREATEST(0,dislikes-1) WHERE id=%s',
                        (comment_id,)
                    )
                else:
                    cur.execute(
                        'UPDATE blog_comments SET dislikes=dislikes+1, likes=GREATEST(0,likes-1) WHERE id=%s',
                        (comment_id,)
                    )
                action = 'changed'
        else:
            cur.execute(
                'INSERT INTO comment_votes (comment_id, session_key, vote) VALUES (%s,%s,%s)',
                (comment_id, session_key, vote)
            )
            if vote == 1:
                cur.execute('UPDATE blog_comments SET likes=likes+1 WHERE id=%s', (comment_id,))
            else:
                cur.execute('UPDATE blog_comments SET dislikes=dislikes+1 WHERE id=%s', (comment_id,))
            action = 'added'

        db.commit()
        cur.execute('SELECT likes, dislikes FROM blog_comments WHERE id=%s', (comment_id,))
        row = cur.fetchone()
        return jsonify({
            'action':   action,
            'likes':    row['likes']    if row else 0,
            'dislikes': row['dislikes'] if row else 0,
        })
    except Exception:
        return jsonify({'error': 'Failed to vote'}), 500
    finally:
        db.close()


# ── GIF + sticker pickers for comments ────────────────────────────────────────
# Tenor (Google) stopped accepting new API clients in Jan 2026 and shuts down
# entirely on 2026-06-30, so this proxies GIPHY instead.
GIPHY_BASE = 'https://api.giphy.com/v1/gifs'


@bp.route('/api/blog/gifs', methods=['GET'])
@limiter.limit('60 per minute; 600 per hour')
def gif_search():
    """Server-side proxy for GIPHY. Keeps the API key off the client and lets
    the rate limiter throttle abuse. Empty query returns GIPHY's trending feed."""
    key = os.environ.get('GIPHY_KEY', '')
    if not key:
        return jsonify({'error': 'GIF search is not configured', 'results': []}), 503

    q = (request.args.get('q') or '').strip()[:80]
    try:
        offset = max(0, min(int(request.args.get('pos') or 0), 4999))
    except (ValueError, TypeError):
        offset = 0

    import requests as http_requests
    params = {
        'api_key': key,
        'limit':   24,
        'offset':  offset,
        'rating':  'pg-13',
        'bundle':  'messaging_non_clips',
    }
    if q:
        params['q'] = q
        endpoint = f'{GIPHY_BASE}/search'
    else:
        endpoint = f'{GIPHY_BASE}/trending'

    try:
        r    = http_requests.get(endpoint, params=params, timeout=8)
        data = r.json()
    except Exception:
        return jsonify({'error': 'GIF service unavailable', 'results': []}), 502

    out = []
    for item in data.get('data', []):
        images  = item.get('images', {}) or {}
        full    = images.get('original', {}) or {}
        preview = images.get('fixed_width', {}) or images.get('downsized', {}) or full
        url     = full.get('url')
        if not url:
            continue
        try:
            dims = [int(full.get('width') or 0), int(full.get('height') or 0)]
        except (ValueError, TypeError):
            dims = [0, 0]
        out.append({
            'id':          item.get('id'),
            'url':         url,
            'preview':     preview.get('url') or url,
            'dims':        dims,
            'description': (item.get('title') or 'gif')[:120],
        })
    next_offset = offset + len(out)
    return jsonify({'results': out, 'next': str(next_offset) if out else ''})


@bp.route('/api/blog/stickers', methods=['GET'])
def list_stickers():
    """Manifest for the self-hosted weeb sticker pack (api/static/stickers)."""
    sticker_dir   = os.path.join(_HERE, '..', 'static', 'stickers')
    manifest_path = os.path.join(sticker_dir, 'manifest.json')
    items = []
    try:
        with open(manifest_path, encoding='utf-8') as f:
            manifest = json.load(f)
        for s in manifest:
            sid = s.get('id', '')
            if re.fullmatch(r'[a-z0-9_-]+', sid) and \
               os.path.exists(os.path.join(sticker_dir, f'{sid}.svg')):
                items.append({
                    'id':    sid,
                    'label': s.get('label', sid),
                    'url':   f'/static/stickers/{sid}.svg',
                })
    except Exception:
        pass
    return jsonify(items)


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
        if not _is_safe_external_url(url):
            return jsonify({'success': 0, 'message': 'URL not allowed'}), 400
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


@bp.route('/api/search', methods=['GET'])
def search():
    q = request.args.get('q', '').strip()
    if not q or len(q) < 2:
        return jsonify([])
    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        like = f'%{q}%'
        cur.execute('''
            SELECT p.id, p.title, p.slug, p.excerpt, p.cover_image,
                   p.reading_time, p.published_at, p.tags,
                   u.name AS author_name, u.avatar AS author_avatar, u.handle AS author_handle
            FROM blog_posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.status = 'published'
              AND (p.title LIKE %s OR p.excerpt LIKE %s OR p.tags LIKE %s)
            ORDER BY p.published_at DESC
            LIMIT 12
        ''', (like, like, like))
        results = cur.fetchall()
    finally:
        db.close()
    for r in results:
        if r.get('published_at'):
            r['published_at'] = r['published_at'].isoformat()
    return jsonify(results)


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
            SELECT u.id, u.name, u.avatar, u.handle,
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
