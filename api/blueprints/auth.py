from flask import Blueprint, request, jsonify, redirect, url_for
import bcrypt, secrets, datetime, json, os, time, re, smtplib, logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from extensions import limiter

logger = logging.getLogger(__name__)


def _log_security_event(event: str, user_id=None, detail: str = ''):
    """Write a security event row to the DB. Best-effort — never raises."""
    try:
        from utils import get_db
        ip = request.headers.get('X-Forwarded-For', request.remote_addr or '')[:45]
        ua = (request.headers.get('User-Agent') or '')[:300]
        db  = get_db()
        cur = db.cursor()
        try:
            cur.execute(
                'INSERT INTO security_log (event, user_id, ip, user_agent, detail) VALUES (%s,%s,%s,%s,%s)',
                (event, user_id, ip, ua, detail[:500])
            )
            db.commit()
        finally:
            db.close()
    except Exception:
        logger.exception('Failed to write security log event: %s', event)

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


def _send_verify_email(to_email: str, verify_url: str, name: str = '') -> bool:
    host  = os.environ.get('SMTP_HOST', 'localhost')
    port  = int(os.environ.get('SMTP_PORT', 587))
    user  = os.environ.get('SMTP_USER', '')
    pw    = os.environ.get('SMTP_PASS', '')
    from_ = os.environ.get('SMTP_FROM', f'Grimoire <{user}>')
    app_url = os.environ.get('APP_URL', 'https://grimoire.sysnode.in')

    if not user or not pw:
        logger.warning('SMTP not configured — verification email could not be sent to %s', to_email)
        return False

    greeting = f'Hi {name},' if name else 'Hi there,'
    year     = datetime.datetime.utcnow().year

    text = f"""{greeting}

Welcome to Grimoire! Please verify your email address to activate your account.

Verify your email here (expires in 24 hours):
{verify_url}

If you didn't create a Grimoire account, simply ignore this email.

— The Grimoire Team
{app_url}
"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Verify your Grimoire email</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;padding:40px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
        <span style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Grimoire</span>
      </td></tr>
      <tr><td style="padding:40px;">
        <p style="margin:0 0 16px;font-size:16px;color:#374151;">{greeting}</p>
        <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
          Welcome to Grimoire! One last step — verify your email address to activate your account.
        </p>
        <div style="text-align:center;margin:32px 0;">
          <a href="{verify_url}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;background:linear-gradient(135deg,#6366f1,#8b5cf6);text-decoration:none;border-radius:8px;letter-spacing:-0.2px;">
            Verify Email Address
          </a>
        </div>
        <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.6;">
          This link expires in 24 hours. If you didn't create a Grimoire account, simply ignore this email.
        </p>
        <p style="margin:12px 0 0;font-size:11px;color:#6366f1;word-break:break-all;">{verify_url}</p>
      </td></tr>
      <tr><td style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">© {year} Grimoire · <a href="{app_url}" style="color:#6366f1;text-decoration:none;">{app_url}</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>"""

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'Verify your Grimoire email address'
        msg['From']    = from_
        msg['To']      = to_email
        msg.attach(MIMEText(text, 'plain'))
        msg.attach(MIMEText(html, 'html'))
        with smtplib.SMTP(host, port) as s:
            s.ehlo(); s.starttls(); s.login(user, pw)
            s.sendmail(from_, to_email, msg.as_string())
        return True
    except Exception:
        logger.exception('Failed to send verification email to %s', to_email)
        return False


def _send_otp_email(to_email: str, code: str, name: str = '') -> bool:
    host    = os.environ.get('SMTP_HOST', 'localhost')
    port    = int(os.environ.get('SMTP_PORT', 587))
    user    = os.environ.get('SMTP_USER', '')
    pw      = os.environ.get('SMTP_PASS', '')
    from_   = os.environ.get('SMTP_FROM', f'Grimoire <{user}>')
    app_url = os.environ.get('APP_URL', 'https://grimoire.sysnode.in')

    if not user or not pw:
        logger.warning('SMTP not configured — OTP email could not be sent to %s', to_email)
        return False

    greeting = f'Hi {name},' if name else 'Hi there,'
    year     = datetime.datetime.utcnow().year

    text = f"""{greeting}

Your Grimoire verification code is:

  {code}

It expires in 10 minutes and can only be used once.

If you didn't try to sign in, your account is safe — ignore this email.

— The Grimoire Team
{app_url}
"""

    # Split code into individual digit spans for the big display
    digit_cells = ''.join(
        f'<td style="width:48px;height:60px;text-align:center;vertical-align:middle;'
        f'font-size:32px;font-weight:800;color:#0f0f0f;letter-spacing:0;'
        f'background:#f8f8ff;border:1.5px solid #e0e0ff;border-radius:10px;">{d}</td>'
        for d in code
    )

    html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your Grimoire sign-in code</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;padding:40px 0;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;">

      <!-- Logo -->
      <tr><td align="center" style="padding-bottom:24px;">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="background:#6366f1;width:36px;height:36px;border-radius:10px;text-align:center;vertical-align:middle;">
            <span style="color:#fff;font-size:18px;font-weight:800;line-height:36px;display:block;">G</span>
          </td>
          <td style="padding-left:10px;font-size:20px;font-weight:700;color:#1a1a1a;letter-spacing:-0.5px;">Grimoire</td>
        </tr></table>
      </td></tr>

      <!-- Card -->
      <tr><td style="background:#ffffff;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="background:#6366f1;height:4px;font-size:0;">&nbsp;</td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="padding:40px 48px 36px;">

            <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#6366f1;text-transform:uppercase;letter-spacing:0.8px;">Verification code</p>
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f0f0f;letter-spacing:-0.5px;line-height:1.2;">Your sign-in code</h1>
            <p style="margin:0 0 28px;font-size:15px;color:#444;line-height:1.6;">{greeting} Enter this code to complete sign-in.</p>

            <!-- Code display -->
            <table cellpadding="0" cellspacing="6" border="0" style="margin:0 auto 28px;">
              <tr>{digit_cells}</tr>
            </table>

            <!-- Expiry note -->
            <table cellpadding="0" cellspacing="0" border="0" style="background:#f8f8ff;border:1px solid #e0e0ff;border-radius:8px;width:100%;margin-bottom:24px;">
              <tr><td style="padding:12px 16px;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
                  <td style="width:20px;vertical-align:top;padding-right:10px;font-size:16px;">⏱</td>
                  <td style="font-size:13px;color:#555;line-height:1.5;">
                    <strong style="color:#0f0f0f;">Expires in 10 minutes.</strong>
                    This code can only be used once. Do not share it with anyone.
                  </td>
                </tr></table>
              </td></tr>
            </table>

            <!-- Not you -->
            <table cellpadding="0" cellspacing="0" border="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;width:100%;">
              <tr><td style="padding:14px 16px;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
                  <td style="width:20px;vertical-align:top;padding-right:10px;font-size:16px;">⚠️</td>
                  <td>
                    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#92400e;">Didn't try to sign in?</p>
                    <p style="margin:0;font-size:13px;color:#78350f;line-height:1.5;">
                      Ignore this email — your account is safe and no one can sign in without the code.
                      Consider changing your password if you're concerned.
                    </p>
                  </td>
                </tr></table>
              </td></tr>
            </table>

          </td></tr>
        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:24px 0 8px;" align="center">
        <p style="margin:0 0 6px;font-size:12px;color:#999;">This is an automated email — please do not reply.</p>
        <p style="margin:0;font-size:12px;color:#bbb;">
          &copy; {year} Grimoire &nbsp;&middot;&nbsp;
          <a href="{app_url}" style="color:#6366f1;text-decoration:none;">{app_url.replace('https://','')}</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>"""

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'{code} is your Grimoire sign-in code'
    msg['From']    = from_
    msg['To']      = to_email
    msg.attach(MIMEText(text, 'plain'))
    msg.attach(MIMEText(html, 'html'))

    try:
        with smtplib.SMTP(host, port, timeout=10) as s:
            s.ehlo(); s.starttls(); s.login(user, pw)
            s.sendmail(from_, to_email, msg.as_string())
        return True
    except Exception:
        logger.exception('Failed to send OTP email to %s', to_email)
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
        verify_token_str = secrets.token_urlsafe(32)
        expires = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        cur.execute(
            'INSERT INTO users (name, email, password_hash, avatar, email_verified, email_verify_token, email_verify_expires) VALUES (%s,%s,%s,%s,0,%s,%s)',
            (name, email, hashed, avatar_url, verify_token_str, expires)
        )
        db.commit()
        user_id = cur.lastrowid
        app_url = os.environ.get('APP_URL', 'https://grimoire.sysnode.in')
        verify_url = f"{app_url}/api/auth/verify-email?token={verify_token_str}"
        _send_verify_email(email, verify_url, name=name)
        return jsonify({'success': True, 'verify': True})
    except Exception:
        return jsonify({'error': 'Registration failed. Please try again.'}), 500
    finally:
        db.close()


@bp.route('/api/auth/login', methods=['POST'])
@limiter.limit('20 per hour; 5 per minute')
def login():
    data          = request.json or {}
    email         = data.get('email', '').strip().lower()
    password      = data.get('password', '')
    keep_signed_in = bool(data.get('keep_signed_in', False))

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute('SELECT * FROM users WHERE email=%s', (email,))
        user = cur.fetchone()
        if not user or not user.get('password_hash'):
            _log_security_event('login_fail', detail=f'email={email} reason=no_account')
            return jsonify({'error': 'Invalid credentials'}), 401
        if not bcrypt.checkpw(password.encode(), user['password_hash'].encode()):
            _log_security_event('login_fail', user_id=user['id'], detail='reason=bad_password')
            return jsonify({'error': 'Invalid credentials'}), 401
        if not user.get('email_verified'):
            return jsonify({'error': 'Please verify your email before signing in. Check your inbox for a verification link.', 'unverified': True}), 403

        # 2FA: if enabled, issue a pending token and send OTP instead of creating session
        if user.get('two_factor_enabled'):
            import random
            code          = f'{random.randint(100000, 999999)}'
            code_hash     = bcrypt.hashpw(code.encode(), bcrypt.gensalt()).decode()
            pending_token = secrets.token_urlsafe(48)
            expires_at    = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
            # Clean up expired OTP rows for this user opportunistically
            cur.execute('DELETE FROM email_otp WHERE user_id=%s AND expires_at < NOW()', (user['id'],))
            cur.execute(
                'INSERT INTO email_otp (user_id, pending_token, code_hash, expires_at, keep_signed_in) VALUES (%s,%s,%s,%s,%s)',
                (user['id'], pending_token, code_hash, expires_at, int(keep_signed_in))
            )
            db.commit()
            _send_otp_email(user['email'], code, name=user.get('name', ''))
            return jsonify({'two_factor_required': True, 'pending_token': pending_token})

        token = create_token(user['id'])
        _log_security_event('login_success', user_id=user['id'])
        resp  = jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'avatar': user['avatar'],
            }
        })
        max_age = 30 * 24 * 3600 if keep_signed_in else None
        resp.set_cookie('token', token, httponly=True, samesite='Lax',
                        max_age=max_age, secure=_SECURE_COOKIE)
        return resp
    finally:
        db.close()


@bp.route('/api/auth/verify-2fa', methods=['POST'])
@limiter.limit('10 per 15 minutes')
def verify_2fa():
    data          = request.json or {}
    pending_token = data.get('pending_token', '').strip()
    code          = data.get('code', '').strip()

    if not pending_token or not code:
        return jsonify({'error': 'Code required'}), 400

    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute(
            'SELECT * FROM email_otp WHERE pending_token=%s',
            (pending_token,)
        )
        row = cur.fetchone()
        if not row:
            return jsonify({'error': 'Invalid or expired session. Please sign in again.'}), 400
        if row['used']:
            return jsonify({'error': 'Code already used. Please sign in again.'}), 400
        if row['expires_at'] < datetime.datetime.utcnow():
            return jsonify({'error': 'Code has expired. Please sign in again.'}), 400
        if row['attempts'] >= 5:
            cur.execute('UPDATE email_otp SET used=1 WHERE id=%s', (row['id'],))
            db.commit()
            return jsonify({'error': 'Too many attempts. Please sign in again.'}), 429

        if not bcrypt.checkpw(code.encode(), row['code_hash'].encode()):
            cur.execute('UPDATE email_otp SET attempts=attempts+1 WHERE id=%s', (row['id'],))
            db.commit()
            remaining = 4 - row['attempts']
            if remaining <= 0:
                cur.execute('UPDATE email_otp SET used=1 WHERE id=%s', (row['id'],))
                db.commit()
                return jsonify({'error': 'Too many attempts. Please sign in again.'}), 429
            return jsonify({'error': f'Incorrect code. {remaining} attempt{"s" if remaining != 1 else ""} left.'}), 400

        # Code correct — mark used and issue session
        cur.execute('UPDATE email_otp SET used=1 WHERE id=%s', (row['id'],))
        db.commit()

        cur.execute('SELECT id, name, email, avatar FROM users WHERE id=%s', (row['user_id'],))
        user = cur.fetchone()
        if not user:
            return jsonify({'error': 'Account not found'}), 400

        token   = create_token(user['id'])
        max_age = 30 * 24 * 3600 if row['keep_signed_in'] else None
        _log_security_event('login_success', user_id=user['id'], detail='2fa=email')
        resp = jsonify({'success': True, 'user': {'id': user['id'], 'name': user['name'], 'email': user['email'], 'avatar': user['avatar']}})
        resp.set_cookie('token', token, httponly=True, samesite='Lax', max_age=max_age, secure=_SECURE_COOKIE)
        return resp
    finally:
        db.close()


@bp.route('/api/auth/resend-otp', methods=['POST'])
@limiter.limit('3 per 15 minutes')
def resend_otp():
    """Resend a fresh OTP for an existing pending 2FA session."""
    data          = request.json or {}
    pending_token = data.get('pending_token', '').strip()
    if not pending_token:
        return jsonify({'error': 'Missing session token'}), 400

    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute('SELECT * FROM email_otp WHERE pending_token=%s', (pending_token,))
        row = cur.fetchone()
        if not row or row['used'] or row['expires_at'] < datetime.datetime.utcnow():
            return jsonify({'error': 'Session expired. Please sign in again.'}), 400

        cur.execute('SELECT email, name FROM users WHERE id=%s', (row['user_id'],))
        user = cur.fetchone()
        if not user:
            return jsonify({'error': 'Account not found'}), 400

        import random
        code       = f'{random.randint(100000, 999999)}'
        code_hash  = bcrypt.hashpw(code.encode(), bcrypt.gensalt()).decode()
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
        cur.execute(
            'UPDATE email_otp SET code_hash=%s, expires_at=%s, attempts=0 WHERE id=%s',
            (code_hash, expires_at, row['id'])
        )
        db.commit()
        _send_otp_email(user['email'], code, name=user.get('name', ''))
        return jsonify({'success': True})
    finally:
        db.close()


@bp.route('/api/auth/2fa/enable', methods=['POST'])
@login_required
def enable_2fa():
    data     = request.json or {}
    password = data.get('password', '')
    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute('SELECT password_hash, two_factor_enabled FROM users WHERE id=%s', (request.user_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({'error': 'User not found'}), 404
        if row.get('password_hash'):
            if not password or not bcrypt.checkpw(password.encode(), row['password_hash'].encode()):
                return jsonify({'error': 'Password is incorrect'}), 400
        if row.get('two_factor_enabled'):
            return jsonify({'success': True})  # already on
        cur.execute('UPDATE users SET two_factor_enabled=1 WHERE id=%s', (request.user_id,))
        db.commit()
        _log_security_event('2fa_enabled', user_id=request.user_id)
    finally:
        db.close()
    return jsonify({'success': True})


@bp.route('/api/auth/2fa/disable', methods=['POST'])
@login_required
def disable_2fa():
    data     = request.json or {}
    password = data.get('password', '')
    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute('SELECT password_hash, two_factor_enabled FROM users WHERE id=%s', (request.user_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({'error': 'User not found'}), 404
        if row.get('password_hash'):
            if not password or not bcrypt.checkpw(password.encode(), row['password_hash'].encode()):
                return jsonify({'error': 'Password is incorrect'}), 400
        if not row.get('two_factor_enabled'):
            return jsonify({'success': True})  # already off
        cur.execute('UPDATE users SET two_factor_enabled=0 WHERE id=%s', (request.user_id,))
        db.commit()
        _log_security_event('2fa_disabled', user_id=request.user_id)
    finally:
        db.close()
    return jsonify({'success': True})


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
        two_factor_enabled = False
        pending_token      = None
        otp_code           = None
        try:
            cur.execute('SELECT * FROM users WHERE google_id=%s OR email=%s', (google_id, email))
            user = cur.fetchone()
            if not user:
                avatar_url = avatar or f"https://ui-avatars.com/api/?name={quote_plus(name)}&background=6366f1&color=fff"
                cur.execute(
                    'INSERT INTO users (name, email, avatar, google_id, email_verified) VALUES (%s,%s,%s,%s,1)',
                    (name, email, avatar_url, google_id)
                )
                db.commit()
                user_id = cur.lastrowid
            else:
                user_id = user['id']
                two_factor_enabled = bool(user.get('two_factor_enabled'))
                if not user.get('google_id'):
                    cur.execute(
                        'UPDATE users SET google_id=%s, avatar=%s WHERE id=%s',
                        (google_id, avatar or user['avatar'], user_id)
                    )
                    db.commit()

            if two_factor_enabled:
                import random
                otp_code      = f'{random.randint(100000, 999999)}'
                code_hash     = bcrypt.hashpw(otp_code.encode(), bcrypt.gensalt()).decode()
                pending_token = secrets.token_urlsafe(48)
                expires_at    = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
                cur.execute('DELETE FROM email_otp WHERE user_id=%s AND expires_at < NOW()', (user_id,))
                cur.execute(
                    'INSERT INTO email_otp (user_id, pending_token, code_hash, expires_at, keep_signed_in) VALUES (%s,%s,%s,%s,0)',
                    (user_id, pending_token, code_hash, expires_at)
                )
                db.commit()
        finally:
            db.close()

        if two_factor_enabled:
            _send_otp_email(email, otp_code, name=name)
            return redirect(f'/login?pending_2fa={quote_plus(pending_token)}')

        jwt_token = create_token(user_id)
        resp = redirect('/')
        resp.set_cookie('token', jwt_token, httponly=True, samesite='Lax',
                        max_age=None, secure=_SECURE_COOKIE)
        return resp
    except Exception as e:
        from urllib.parse import quote_plus
        return redirect(f'/?error={quote_plus("Google sign-in failed. Please try again.")}')


@bp.route('/api/auth/verify-email', methods=['GET'])
def verify_email():
    from urllib.parse import quote_plus
    token = request.args.get('token', '')
    if not token:
        return redirect(f'/login?error={quote_plus("Invalid verification link.")}')
    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute(
            'SELECT id, email_verified, email_verify_expires FROM users WHERE email_verify_token=%s',
            (token,)
        )
        user = cur.fetchone()
        if not user:
            return redirect(f'/login?error={quote_plus("Invalid or already used verification link.")}')
        if user['email_verified']:
            return redirect('/login?verified=1')
        if user['email_verify_expires'] and datetime.datetime.utcnow() > user['email_verify_expires']:
            return redirect(f'/login?error={quote_plus("Verification link has expired. Please request a new one.")}')
        cur.execute(
            'UPDATE users SET email_verified=1, email_verify_token=NULL, email_verify_expires=NULL WHERE id=%s',
            (user['id'],)
        )
        db.commit()
    finally:
        db.close()
    return redirect('/login?verified=1')


@bp.route('/api/auth/resend-verification', methods=['POST'])
@limiter.limit('5 per hour')
def resend_verification():
    data  = request.json or {}
    email = data.get('email', '').strip().lower()
    if not email:
        return jsonify({'error': 'Email required'}), 400
    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute('SELECT id, name, email_verified FROM users WHERE email=%s', (email,))
        user = cur.fetchone()
        if not user or user['email_verified']:
            return jsonify({'success': True})  # silent — don't reveal account existence
        verify_token_str = secrets.token_urlsafe(32)
        expires = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        cur.execute(
            'UPDATE users SET email_verify_token=%s, email_verify_expires=%s WHERE id=%s',
            (verify_token_str, expires, user['id'])
        )
        db.commit()
        app_url = os.environ.get('APP_URL', 'https://grimoire.sysnode.in')
        verify_url = f"{app_url}/api/auth/verify-email?token={verify_token_str}"
        _send_verify_email(email, verify_url, name=user.get('name', ''))
    finally:
        db.close()
    return jsonify({'success': True})


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
                      handle, website, social_links, banner, password_hash,
                      two_factor_enabled
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
        _log_security_event('password_changed', user_id=request.user_id)
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
        # Opportunistically purge globally expired tokens (eventual cleanup)
        cur.execute('DELETE FROM password_resets WHERE expires_at < NOW()')
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
        _log_security_event('password_reset', user_id=row['user_id'])
        return jsonify({'success': True, 'message': 'Password updated. You can now sign in.'})
    except Exception:
        return jsonify({'error': 'Failed to reset password. Please try again.'}), 500
    finally:
        db.close()
