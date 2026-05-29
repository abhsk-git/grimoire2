"""Internal maintenance endpoints — protected by X-Internal-Key header."""
import os, json, logging
from flask import Blueprint, request, jsonify
from utils import get_db
from mailer import send_weekly_digest

bp      = Blueprint('maintenance', __name__)
logger  = logging.getLogger(__name__)


def _auth():
    key = os.environ.get('INTERNAL_KEY', '')
    if not key or request.headers.get('X-Internal-Key') != key:
        return jsonify({'error': 'Forbidden'}), 403
    return None


@bp.route('/api/internal/cleanup', methods=['POST'])
def cleanup_expired_tokens():
    err = _auth()
    if err:
        return err
    db  = get_db()
    cur = db.cursor()
    try:
        cur.execute('DELETE FROM password_resets WHERE expires_at < NOW()')
        deleted = cur.rowcount
        db.commit()
        logger.info('cleanup: removed %d expired password_reset rows', deleted)
    finally:
        db.close()
    return jsonify({'deleted': deleted})


@bp.route('/api/internal/weekly-digest', methods=['POST'])
def weekly_digest():
    err = _auth()
    if err:
        return err

    from blueprints.settings import _load as _load_settings

    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        # Top 10 posts from the last 7 days
        cur.execute('''
            SELECT p.title, p.slug, p.views, u.name AS author_name
            FROM blog_posts p JOIN users u ON p.user_id = u.id
            WHERE p.status = 'published'
              AND p.published_at >= NOW() - INTERVAL 7 DAY
            ORDER BY p.views DESC
            LIMIT 10
        ''')
        posts = cur.fetchall()

        if not posts:
            return jsonify({'sent': 0, 'reason': 'no posts this week'})

        # Find users with weeklyDigest enabled
        cur.execute('SELECT id, name, email, settings FROM users')
        users = cur.fetchall()
    finally:
        db.close()

    sent = 0
    for user in users:
        settings = _load_settings(user.get('settings'))
        if not settings.get('notifications', {}).get('weeklyDigest', False):
            continue
        try:
            if send_weekly_digest(user['email'], user['name'], posts):
                sent += 1
        except Exception:
            logger.exception('weekly digest failed for user %d', user['id'])

    logger.info('weekly-digest: sent to %d users', sent)
    return jsonify({'sent': sent, 'post_count': len(posts)})
