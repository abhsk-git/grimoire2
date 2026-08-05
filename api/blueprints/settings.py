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
        "theme": "light",
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
            saved_section = stored.get(section, {}) if isinstance(stored.get(section, {}), dict) else {}
            result[section] = {
                key: saved_section.get(key, default)
                for key, default in defaults.items()
            }
        if result['appearance']['theme'] not in ('light', 'dark'):
            result['appearance']['theme'] = 'light'
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
    patch = request.get_json(silent=True) or {}
    if not isinstance(patch, dict):
        return jsonify({'error': 'Invalid settings payload'}), 400
    allowed_sections = set(DEFAULTS)
    if any(key not in allowed_sections or not isinstance(value, dict) for key, value in patch.items()):
        return jsonify({'error': 'Unknown or invalid settings section'}), 400
    for section, values in patch.items():
        if any(key not in DEFAULTS[section] for key in values):
            return jsonify({'error': f'Unknown {section} setting'}), 400
    theme = patch.get('appearance', {}).get('theme')
    if theme is not None and theme not in ('light', 'dark'):
        return jsonify({'error': 'Theme must be light or dark'}), 400
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
