from flask import Blueprint, request, jsonify, redirect, url_for
import bcrypt, secrets, datetime
from utils import get_db, create_token, verify_token, login_required
from extensions import oauth

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
    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute(
            'SELECT id, name, email, avatar, bio, created_at FROM users WHERE id=%s',
            (request.user_id,)
        )
        user = cur.fetchone()
    finally:
        db.close()
    if user and user.get('created_at'):
        user['created_at'] = user['created_at'].isoformat()
    return jsonify(user)


@bp.route('/api/profile', methods=['PUT'])
@login_required
def update_profile():
    data = request.json or {}
    name = data.get('name', '').strip()[:100]
    bio  = data.get('bio', '').strip()[:300]
    if not name:
        return jsonify({'error': 'Name cannot be empty'}), 400
    db  = get_db()
    cur = db.cursor()
    try:
        cur.execute('UPDATE users SET name=%s, bio=%s WHERE id=%s', (name, bio, request.user_id))
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
