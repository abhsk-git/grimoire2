import json
from flask import Blueprint, request, jsonify
from utils import get_db, login_required

bp = Blueprint('settings', __name__)

DEFAULTS = {
    "editor": {
        "slashMenu": True,
        "autosave": True,
        "autosaveInterval": 4,
        "wordCount": True,
        "readingTime": True,
    },
    "appearance": {
        "theme": "dark",
        "readingMode": "spacious",
    },
    "publishing": {
        "defaultVisibility": "draft",
        "defaultTags": "",
        "rssEnabled": True,
        "aboutAuthor": "",
    },
    "privacy": {
        "hideFromExplore": False,
        "disableComments": False,
        "allowAnonymousVotes": True,
    },
    "notifications": {
        "onComment": True,
        "onReply": True,
        "weeklyDigest": False,
    },
}


def _merge(base: dict, override: dict) -> dict:
    """Deep-merge override into base (one level deep)."""
    result = {**base}
    for k, v in override.items():
        if isinstance(v, dict) and isinstance(result.get(k), dict):
            result[k] = {**result[k], **v}
        else:
            result[k] = v
    return result


def _load(raw) -> dict:
    if not raw:
        return DEFAULTS
    try:
        stored = json.loads(raw) if isinstance(raw, str) else raw
        # Fill in any missing keys from DEFAULTS
        result = {}
        for section, defaults in DEFAULTS.items():
            result[section] = {**defaults, **stored.get(section, {})}
        return result
    except Exception:
        return DEFAULTS


@bp.route('/api/settings', methods=['GET'])
@login_required
def get_settings():
    db  = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute('SELECT settings FROM users WHERE id=%s', (request.user_id,))
        row = cur.fetchone()
    finally:
        db.close()
    return jsonify(_load(row['settings'] if row else None))


@bp.route('/api/settings', methods=['PATCH'])
@login_required
def update_settings():
    patch = request.json or {}
    db    = get_db()
    cur   = db.cursor(dictionary=True)
    try:
        cur.execute('SELECT settings FROM users WHERE id=%s', (request.user_id,))
        row      = cur.fetchone()
        current  = _load(row['settings'] if row else None)
        updated  = _merge(current, patch)
        cur.execute(
            'UPDATE users SET settings=%s WHERE id=%s',
            (json.dumps(updated), request.user_id)
        )
        db.commit()
    finally:
        db.close()
    return jsonify(updated)
