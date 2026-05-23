from flask import Blueprint, request, jsonify, redirect, url_for
import bcrypt, secrets, datetime, json, os, time, re, smtplib, logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from extensions import limiter

logger = logging.getLogger(__name__)

_SECURE_COOKIE = os.environ.get('APP_URL', '').startswith('https')


def _send_reset_email(to_email: str, reset_url: str, name: str = '') -> bool:
    host  = os.environ.get('SMTP_HOST', 'localhost')
    port  = int(os.environ.get('SMTP_PORT', 587))
    user  = os.environ.get('SMTP_USER', '')
    pw    = os.environ.get('SMTP_PASS', '')
    from_ = os.environ.get('SMTP_FROM', f'Grimoire <{user}>')
    app_url = os.environ.get('APP_URL', 'https://grimoire.sysnode.in')

    if not user or not pw:
        logger.warning('SMTP not configured — password reset email could not be sent to %s', to_email)
        return False

    greeting = f'Hi {name},' if name else 'Hi there,'
    year     = datetime.datetime.utcnow().year

    text = f"""{greeting}

We received a request to reset the password for your Grimoire account ({to_email}).

Reset your password here (expires in 1 hour):
{reset_url}

If you didn't request this, your account is safe — simply ignore this email and your password will remain unchanged. No action is needed.

Security tips:
- Never share this link with anyone, including Grimoire support.
- This link can only be used once.
- It expires in 1 hour.

— The Grimoire Team
{app_url}
"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reset your Grimoire password</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

      <!-- Header -->
      <tr><td align="center" style="padding-bottom:24px;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background:#6366f1;width:36px;height:36px;border-radius:10px;text-align:center;vertical-align:middle;">
              <span style="color:#fff;font-size:18px;font-weight:800;line-height:36px;display:block;">G</span>
            </td>
            <td style="padding-left:10px;font-size:20px;font-weight:700;color:#1a1a1a;letter-spacing:-0.5px;">Grimoire</td>
          </tr>
        </table>
      </td></tr>

      <!-- Card -->
      <tr><td style="background:#ffffff;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;">

        <!-- Purple top bar -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="background:#6366f1;height:4px;font-size:0;">&nbsp;</td></tr>
        </table>

        <!-- Body -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="padding:40px 48px 32px;">

            <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#6366f1;text-transform:uppercase;letter-spacing:0.8px;">Password Reset</p>
            <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#0f0f0f;letter-spacing:-0.5px;line-height:1.2;">Reset your password</h1>
            <p style="margin:0 0 8px;font-size:15px;color:#444;line-height:1.6;">{greeting}</p>
            <p style="margin:0 0 28px;font-size:15px;color:#444;line-height:1.6;">
              We received a request to reset the password for the Grimoire account associated with <strong>{to_email}</strong>.
              Click the button below to set a new password. This link is valid for <strong>1 hour</strong>.
            </p>

            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#6366f1;border-radius:10px;">
                  <a href="{reset_url}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:-0.2px;">
                    Reset my password &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <!-- Expiry row -->
            <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;background:#f8f8ff;border:1px solid #e0e0ff;border-radius:8px;width:100%;">
              <tr>
                <td style="padding:12px 16px;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="width:20px;vertical-align:top;padding-right:10px;font-size:16px;">⏱</td>
                      <td style="font-size:13px;color:#555;line-height:1.5;">
                        <strong style="color:#0f0f0f;">Link expires in 1 hour.</strong>
                        If it expires, go back to the sign-in page and request a new reset link.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Fallback URL -->
            <p style="margin:0 0 6px;font-size:12px;color:#888;">Button not working? Copy and paste this link into your browser:</p>
            <p style="margin:0 0 32px;font-size:11px;color:#6366f1;word-break:break-all;">{reset_url}</p>

            <!-- Divider -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
              <tr><td style="border-top:1px solid #ebebeb;height:1px;font-size:0;">&nbsp;</td></tr>
            </table>

            <!-- Security notice -->
            <table cellpadding="0" cellspacing="0" border="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;width:100%;margin-bottom:16px;">
              <tr>
                <td style="padding:14px 16px;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="width:20px;vertical-align:top;padding-right:10px;font-size:16px;">⚠️</td>
                      <td>
                        <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#92400e;">Didn't request this?</p>
                        <p style="margin:0;font-size:13px;color:#78350f;line-height:1.5;">
                          Your account is safe. Simply ignore this email — your password will not change.
                          If you're concerned someone else requested this, consider changing your password after signing in.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Security tips -->
            <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
              <tr><td style="padding:4px 0;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.6px;">Security reminders</p>
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr><td style="font-size:13px;color:#666;line-height:1.7;">
                    &bull;&nbsp; Never share this link with anyone, including Grimoire support.<br>
                    &bull;&nbsp; This link works only once and expires in 1 hour.<br>
                    &bull;&nbsp; Grimoire will never ask for your password via email.
                  </td></tr>
                </table>
              </td></tr>
            </table>

          </td></tr>
        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:24px 0 8px;" align="center">
        <p style="margin:0 0 6px;font-size:12px;color:#999;">This is an automated email — please do not reply.</p>
        <p style="margin:0 0 6px;font-size:12px;color:#bbb;">
          &copy; {year} Grimoire &nbsp;&middot;&nbsp;
          <a href="{app_url}" style="color:#6366f1;text-decoration:none;">{app_url.replace('https://','')}</a>
        </p>
        <p style="margin:0;font-size:11px;color:#ccc;">You're receiving this because a reset was requested for {to_email}.</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>"""

    msg = MIMEMultipart('alternative')
    msg['Subject'] = 'Reset your Grimoire password'
    msg['From']    = from_
    msg['To']      = to_email

    msg.attach(MIMEText(text, 'plain'))
    msg.attach(MIMEText(html, 'html'))

    try:
        with smtplib.SMTP(host, port, timeout=10) as s:
            s.ehlo()
            s.starttls()
            s.login(user, pw)
            s.sendmail(from_, to_email, msg.as_string())
        return True
    except Exception:
        logger.exception('Failed to send reset email to %s', to_email)
        return False
from werkzeug.utils import secure_filename
from utils import get_db, create_token, verify_token, login_required
from extensions import oauth

_here = os.path.dirname(os.path.abspath(__file__))
_UPLOAD_BASE = os.path.join(_here, '..', 'static', 'uploads')
_ALLOWED_IMG = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
_HANDLE_RE   = re.compile(r'^[a-z0-9][a-z0-9\-]{0,28}[a-z0-9]$')
_RESERVED    = {'api', 'admin', 'static', 'login', 'register', 'explore',
                'dashboard', 'settings', 'write', 'blog', 'user', 'feed'}

_IMG_MAGIC = {
    b'\xff\xd8\xff': 'jpg',
    b'\x89PNG':      'png',
    b'GIF8':         'gif',
    b'RIFF':         'webp',
}

def _allowed_img(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in _ALLOWED_IMG

def _check_img_magic(data: bytes, ext: str) -> bool:
    """Return True if file magic bytes match the declared extension."""
    for sig, sig_ext in _IMG_MAGIC.items():
        if data[:len(sig)] == sig:
            return ext in (sig_ext, 'jpg', 'jpeg') if sig_ext == 'jpg' else ext == sig_ext
    return False

def _save_upload(f, subfolder):
    import uuid as _uuid
    ext = f.filename.rsplit('.', 1)[1].lower()
    fname = f"{_uuid.uuid4().hex}.{ext}"
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
    if len(pw) > 128:
        return 'Password must not exceed 128 characters'
    has_upper   = any(c.isupper() for c in pw)
    has_lower   = any(c.islower() for c in pw)
    has_digit   = any(c.isdigit() for c in pw)
    if not (has_upper and has_lower and has_digit):
        return 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    return None


@bp.route('/api/auth/register', methods=['POST'])
@limiter.limit('10 per hour; 3 per minute')
def register():
    data     = request.json or {}
    name     = data.get('name', '').strip()
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not name or not email or not password:
        return jsonify({'error': 'All fields required'}), 400

    if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email):
        return jsonify({'error': 'Invalid email address'}), 400

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
        resp.set_cookie('token', token, httponly=True, samesite='Lax',
                        max_age=30*24*3600, secure=_SECURE_COOKIE)
        return resp
    except Exception:
        return jsonify({'error': 'Registration failed. Please try again.'}), 500
    finally:
        db.close()


@bp.route('/api/auth/login', methods=['POST'])
@limiter.limit('20 per hour; 5 per minute')
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
        resp.set_cookie('token', token, httponly=True, samesite='Lax',
                        max_age=30*24*3600, secure=_SECURE_COOKIE)
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
        resp = redirect('/')
        resp.set_cookie('token', jwt_token, httponly=True, samesite='Lax',
                        max_age=30*24*3600, secure=_SECURE_COOKIE)
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
    ext = f.filename.rsplit('.', 1)[1].lower()
    data = f.read(8 * 1024 * 1024 + 1)
    if len(data) > 8 * 1024 * 1024:
        return jsonify({'error': 'File too large (max 8 MB)'}), 400
    if ext not in ('webp', 'gif') and not _check_img_magic(data, ext):
        return jsonify({'error': 'File content does not match declared image type'}), 400
    import io
    f.stream = io.BytesIO(data)
    f.seek(0)
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
    ext = f.filename.rsplit('.', 1)[1].lower()
    data = f.read(15 * 1024 * 1024 + 1)
    if len(data) > 15 * 1024 * 1024:
        return jsonify({'error': 'File too large (max 15 MB)'}), 400
    if ext not in ('webp', 'gif') and not _check_img_magic(data, ext):
        return jsonify({'error': 'File content does not match declared image type'}), 400
    import io
    f.stream = io.BytesIO(data)
    f.seek(0)
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
@limiter.limit('5 per hour; 2 per minute')
def forgot_password():
    data  = request.json or {}
    email = data.get('email', '').strip().lower()
    if not email:
        return jsonify({'error': 'Email is required'}), 400

    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute('SELECT id, name FROM users WHERE email=%s', (email,))
        user = cur.fetchone()
        # Always return success to avoid email enumeration
        if user:
            # Invalidate all previous unused reset tokens for this user
            cur.execute(
                'UPDATE password_resets SET used=1 WHERE user_id=%s AND used=0',
                (user['id'],)
            )
            token      = secrets.token_urlsafe(48)
            expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
            cur.execute(
                'INSERT INTO password_resets (user_id, token, expires_at) VALUES (%s,%s,%s)',
                (user['id'], token, expires_at)
            )
            db.commit()
            app_url   = os.environ.get('APP_URL', 'http://localhost:3001')
            reset_url = f"{app_url}/reset-password?token={token}"
            _send_reset_email(email, reset_url, name=user.get('name', ''))
    except Exception:
        pass  # silently fail — don't reveal DB errors
    finally:
        db.close()

    return jsonify({'success': True, 'message': 'If that email is registered, a reset link has been generated.'})


@bp.route('/api/auth/reset-password', methods=['POST'])
@limiter.limit('10 per hour; 3 per minute')
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
        # Invalidate ALL reset tokens for this user (not just the one used)
        cur.execute('UPDATE password_resets SET used=1 WHERE user_id=%s', (row['user_id'],))
        db.commit()
        return jsonify({'success': True, 'message': 'Password updated. You can now sign in.'})
    except Exception:
        return jsonify({'error': 'Failed to reset password. Please try again.'}), 500
    finally:
        db.close()
