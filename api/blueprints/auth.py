from flask import Blueprint, request, jsonify, redirect, url_for
import bcrypt, secrets, datetime, json, os, time, re
from werkzeug.utils import secure_filename
from utils import get_db, create_token, verify_token, login_required
from extensions import oauth

_here = os.path.dirname(os.path.abspath(__file__))
_UPLOAD_BASE = os.path.join(_here, '..', 'static', 'uploads')
_ALLOWED_IMG = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
_HANDLE_RE   = re.compile(r'^[a-z0-9][a-z0-9\-]{0,28}[a-z0-9]$')
_RESERVED    = {'api', 'admin', 'static', 'login', 'register', 'explore',
                'dashboard', 'settings', 'write', 'blog', 'user', 'feed'}

def _allowed_img(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in _ALLOWED_IMG

def _save_upload(f, subfolder):
    ext = f.filename.rsplit('.', 1)[1].lower()
    fname = f"{int(time.time() * 1000)}.{ext}"
    dest = os.path.join(_UPLOAD_BASE, subfolder, fname)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    f.save(dest)
    return f"/static/uploads/{subfolder}/{fname}"

def _delete_local_upload(url):
    """Delete a previously uploaded local file if the URL points to our static folder."""
    if not url or not url.startswith('/static/uploads/'):
        return
    path = os.path.join(_here, '..', url.lstrip('/'))
    try:
        if os.path.isfile(path):
            os.remove(path)
    except OSError:
        pass

bp = Blueprint('auth', __name__)


def _validate_password(pw):
    """Return an error string or None if the password is acceptable."""
    if not pw or not pw.strip():
        return 'Password cannot be empty or whitespace'
    if len(pw) < 8:
        return 'Password must be at least 8 characters'
    return None


@bp.route('/api/auth/register', methods=['POST'])
def register():
    data     = request.json or {}
    name     = data.get('name', '').strip()
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not name or not email or not password:
        return jsonify({'error': 'All fields required'}), 400

    pw_error = _validate_password(password)
    if pw_error:
        return jsonify({'error': pw_error}), 400

    from urllib.parse import quote_plus
    hashed     = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    avatar_url = f"https://ui-avatars.com/api/?name={quote_plus(name)}&background=6366f1&color=fff"

    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute('SELECT id FROM users WHERE email=%s', (email,))
        if cur.fetchone():
            return jsonify({'error': 'Email already registered'}), 400
        cur.execute(
            'INSERT INTO users (name, email, password_hash, avatar) VALUES (%s,%s,%s,%s)',
            (name, email, hashed, avatar_url)
        )
        db.commit()
        user_id = cur.lastrowid
        token   = create_token(user_id)
        resp    = jsonify({'success': True, 'user': {'id': user_id, 'name': name, 'email': email}})
        resp.set_cookie('token', token, httponly=True, samesite='Lax', max_age=30*24*3600)
        return resp
    except Exception:
        return jsonify({'error': 'Registration failed. Please try again.'}), 500
    finally:
        db.close()


@bp.route('/api/auth/login', methods=['POST'])
def login():
    data     = request.json or {}
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute('SELECT * FROM users WHERE email=%s', (email,))
        user = cur.fetchone()
        if not user or not user.get('password_hash'):
            return jsonify({'error': 'Invalid credentials'}), 401
        if not bcrypt.checkpw(password.encode(), user['password_hash'].encode()):
            return jsonify({'error': 'Invalid credentials'}), 401
        token = create_token(user['id'])
        resp  = jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'avatar': user['avatar'],
            }
        })
        resp.set_cookie('token', token, httponly=True, samesite='Lax', max_age=30*24*3600)
        return resp
    finally:
        db.close()


@bp.route('/api/auth/google')
def google_login():
    redirect_uri = url_for('auth.google_callback', _external=True)
    return oauth.google.authorize_redirect(redirect_uri)


@bp.route('/api/auth/google/callback')
def google_callback():
    from urllib.parse import quote_plus
    try:
        token    = oauth.google.authorize_access_token()
        userinfo = token.get('userinfo')
        email    = userinfo['email']
        name     = userinfo.get('name', email)
        avatar   = userinfo.get('picture', '')
        google_id = userinfo['sub']

        db  = get_db()
        cur = db.cursor(dictionary=True)
        try:
            cur.execute('SELECT * FROM users WHERE google_id=%s OR email=%s', (google_id, email))
            user = cur.fetchone()
            if not user:
                avatar_url = avatar or f"https://ui-avatars.com/api/?name={quote_plus(name)}&background=6366f1&color=fff"
                cur.execute(
                    'INSERT INTO users (name, email, avatar, google_id) VALUES (%s,%s,%s,%s)',
                    (name, email, avatar_url, google_id)
                )
                db.commit()
                user_id = cur.lastrowid
            else:
                user_id = user['id']
                if not user.get('google_id'):
                    cur.execute(
                        'UPDATE users SET google_id=%s, avatar=%s WHERE id=%s',
                        (google_id, avatar or user['avatar'], user_id)
                    )
                    db.commit()
        finally:
            db.close()

        jwt_token = create_token(user_id)
        resp = redirect('/dashboard')
        resp.set_cookie('token', jwt_token, httponly=True, samesite='Lax', max_age=30*24*3600)
        return resp
    except Exception as e:
        from urllib.parse import quote_plus
        return redirect(f'/?error={quote_plus("Google sign-in failed. Please try again.")}')


@bp.route('/api/auth/logout', methods=['POST'])
def logout():
    resp = jsonify({'success': True})
    resp.delete_cookie('token')
    return resp


@bp.route('/api/auth/me')
@login_required
def me():
    from blueprints.settings import _load as _load_settings
    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute(
            '''SELECT id, name, email, avatar, bio, created_at, settings,
                      handle, website, social_links, banner, password_hash
               FROM users WHERE id=%s''',
            (request.user_id,)
        )
        user = cur.fetchone()
    finally:
        db.close()
    if user:
        if user.get('created_at'):
            user['created_at'] = user['created_at'].isoformat()
        user['settings'] = _load_settings(user.get('settings'))
        try:
            user['social_links'] = json.loads(user['social_links']) if user.get('social_links') else {}
        except Exception:
            user['social_links'] = {}
        user['has_password'] = bool(user.get('password_hash'))
        del user['password_hash']
    return jsonify(user)


@bp.route('/api/profile', methods=['PUT'])
@login_required
def update_profile():
    data    = request.json or {}
    name    = data.get('name', '').strip()[:100]
    bio     = data.get('bio', '').strip()[:300]
    handle  = (data.get('handle') or '').strip().lower()[:50]
    website = data.get('website', '').strip()[:300]
    socials = data.get('social_links', {})
    avatar  = data.get('avatar', '').strip()[:500]
    banner  = data.get('banner', '').strip()[:500]

    if not name:
        return jsonify({'error': 'Name cannot be empty'}), 400

    # Validate handle if provided
    if handle:
        if not _HANDLE_RE.match(handle):
            return jsonify({'error': 'Handle must be 2–30 lowercase letters, numbers, or hyphens and not start/end with a hyphen'}), 400
        if handle in _RESERVED:
            return jsonify({'error': 'That handle is reserved'}), 400

    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        # Check handle uniqueness
        if handle:
            cur.execute('SELECT id FROM users WHERE handle=%s AND id != %s', (handle, request.user_id))
            if cur.fetchone():
                return jsonify({'error': 'That handle is already taken'}), 409

        socials_json = json.dumps({k: str(v)[:100] for k, v in (socials or {}).items() if v})
        cur.execute(
            '''UPDATE users SET name=%s, bio=%s, handle=%s, website=%s,
                                social_links=%s, avatar=%s, banner=%s
               WHERE id=%s''',
            (name, bio,
             handle if handle else None,
             website or None,
             socials_json,
             avatar or None,
             banner or None,
             request.user_id)
        )
        db.commit()
    finally:
        db.close()
    return jsonify({'success': True})


@bp.route('/api/upload/avatar', methods=['POST'])
@login_required
def upload_avatar():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    f = request.files['file']
    if not f.filename or not _allowed_img(f.filename):
        return jsonify({'error': 'Invalid file type. Use JPG, PNG, GIF, or WebP'}), 400
    f.seek(0, 2); size = f.tell(); f.seek(0)
    if size > 8 * 1024 * 1024:
        return jsonify({'error': 'File too large (max 8 MB)'}), 400
    url = _save_upload(f, 'avatars')
    db  = get_db(); cur = db.cursor()
    try:
        cur.execute('SELECT avatar FROM users WHERE id=%s', (request.user_id,))
        row = cur.fetchone()
        old_url = row[0] if row else None
        cur.execute('UPDATE users SET avatar=%s WHERE id=%s', (url, request.user_id))
        db.commit()
        _delete_local_upload(old_url)
    finally:
        db.close()
    return jsonify({'url': url})


@bp.route('/api/upload/banner', methods=['POST'])
@login_required
def upload_banner():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    f = request.files['file']
    if not f.filename or not _allowed_img(f.filename):
        return jsonify({'error': 'Invalid file type. Use JPG, PNG, GIF, or WebP'}), 400
    f.seek(0, 2); size = f.tell(); f.seek(0)
    if size > 15 * 1024 * 1024:
        return jsonify({'error': 'File too large (max 15 MB)'}), 400
    url = _save_upload(f, 'banners')
    db  = get_db(); cur = db.cursor()
    try:
        cur.execute('SELECT banner FROM users WHERE id=%s', (request.user_id,))
        row = cur.fetchone()
        old_url = row[0] if row else None
        cur.execute('UPDATE users SET banner=%s WHERE id=%s', (url, request.user_id))
        db.commit()
        _delete_local_upload(old_url)
    finally:
        db.close()
    return jsonify({'url': url})


@bp.route('/api/auth/change-email', methods=['POST'])
@login_required
def change_email():
    data     = request.json or {}
    new_email = data.get('new_email', '').strip().lower()
    password  = data.get('password', '')
    if not new_email or '@' not in new_email:
        return jsonify({'error': 'Valid email required'}), 400
    db  = get_db(); cur = db.cursor(dictionary=True)
    try:
        cur.execute('SELECT email, password_hash FROM users WHERE id=%s', (request.user_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({'error': 'User not found'}), 404
        if row.get('password_hash'):
            if not password or not bcrypt.checkpw(password.encode(), row['password_hash'].encode()):
                return jsonify({'error': 'Current password is incorrect'}), 400
        cur.execute('SELECT id FROM users WHERE email=%s', (new_email,))
        if cur.fetchone():
            return jsonify({'error': 'That email is already in use'}), 409
        cur.execute('UPDATE users SET email=%s WHERE id=%s', (new_email, request.user_id))
        db.commit()
    finally:
        db.close()
    return jsonify({'success': True})


@bp.route('/api/auth/delete-account', methods=['DELETE'])
@login_required
def delete_account():
    data     = request.json or {}
    password = data.get('password', '')
    confirm  = data.get('confirm', '')
    db  = get_db(); cur = db.cursor(dictionary=True)
    try:
        cur.execute('SELECT name, password_hash FROM users WHERE id=%s', (request.user_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({'error': 'User not found'}), 404
        if confirm.strip().lower() != row['name'].strip().lower():
            return jsonify({'error': 'Username confirmation does not match'}), 400
        if row.get('password_hash'):
            if not password or not bcrypt.checkpw(password.encode(), row['password_hash'].encode()):
                return jsonify({'error': 'Password is incorrect'}), 400
        cur.execute('DELETE FROM users WHERE id=%s', (request.user_id,))
        db.commit()
    finally:
        db.close()
    resp = jsonify({'success': True})
    resp.delete_cookie('token')
    return resp


@bp.route('/api/auth/change-password', methods=['POST'])
@login_required
def change_password():
    data     = request.json or {}
    old_pw   = data.get('old_password', '')
    new_pw   = data.get('new_password', '')
    pw_error = _validate_password(new_pw)
    if pw_error:
        return jsonify({'error': pw_error}), 400
    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute('SELECT password_hash FROM users WHERE id=%s', (request.user_id,))
        row = cur.fetchone()
        if not row or not row.get('password_hash'):
            return jsonify({'error': 'Cannot change password for OAuth accounts'}), 400
        if not bcrypt.checkpw(old_pw.encode(), row['password_hash'].encode()):
            return jsonify({'error': 'Current password is incorrect'}), 400
        new_hash = bcrypt.hashpw(new_pw.encode(), bcrypt.gensalt()).decode()
        cur.execute('UPDATE users SET password_hash=%s WHERE id=%s', (new_hash, request.user_id))
        db.commit()
    finally:
        db.close()
    return jsonify({'success': True})


@bp.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    data  = request.json or {}
    email = data.get('email', '').strip().lower()
    if not email:
        return jsonify({'error': 'Email is required'}), 400

    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute('SELECT id FROM users WHERE email=%s', (email,))
        user = cur.fetchone()
        # Always return success to avoid email enumeration
        if user:
            token      = secrets.token_urlsafe(48)
            expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
            cur.execute(
                'INSERT INTO password_resets (user_id, token, expires_at) VALUES (%s,%s,%s)',
                (user['id'], token, expires_at)
            )
            db.commit()
            # Without email service configured, log the reset URL server-side
            # (integrate with your email provider to send this to the user)
            import logging
            logging.getLogger(__name__).info(
                'Password reset token for user %s: %s', user['id'], token
            )
    except Exception:
        pass  # silently fail — don't reveal DB errors
    finally:
        db.close()

    return jsonify({'success': True, 'message': 'If that email is registered, a reset link has been generated.'})


@bp.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    data     = request.json or {}
    token    = data.get('token', '').strip()
    password = data.get('password', '')

    if not token or not password:
        return jsonify({'error': 'Token and new password are required'}), 400

    pw_error = _validate_password(password)
    if pw_error:
        return jsonify({'error': pw_error}), 400

    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute('''
            SELECT pr.id, pr.user_id, pr.expires_at, pr.used
            FROM password_resets pr
            WHERE pr.token=%s
        ''', (token,))
        row = cur.fetchone()
        if not row:
            return jsonify({'error': 'Invalid or expired reset token'}), 400
        if row['used']:
            return jsonify({'error': 'This reset link has already been used'}), 400
        if row['expires_at'] < datetime.datetime.utcnow():
            return jsonify({'error': 'Reset link has expired'}), 400

        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        cur.execute('UPDATE users SET password_hash=%s WHERE id=%s', (hashed, row['user_id']))
        cur.execute('UPDATE password_resets SET used=1 WHERE id=%s', (row['id'],))
        db.commit()
        return jsonify({'success': True, 'message': 'Password updated. You can now sign in.'})
    except Exception:
        return jsonify({'error': 'Failed to reset password. Please try again.'}), 500
    finally:
        db.close()
