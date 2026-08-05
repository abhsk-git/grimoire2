from flask import request, jsonify
import mysql.connector
from mysql.connector import pooling
import os
import jwt
import datetime
from functools import wraps
import time
import threading
import hashlib
import uuid
import re

_pool = pooling.MySQLConnectionPool(
    pool_name='grimoire',
    pool_size=10,
    host=os.environ.get('DB_HOST', 'localhost'),
    user=os.environ.get('DB_USER', 'linkvault'),
    password=os.environ.get('DB_PASS', ''),
    database=os.environ.get('DB_NAME', 'linkvault'),
    charset='utf8mb4',
)


def get_db():
    return _pool.get_connection()


def store_media(data: bytes, mime_type: str, owner_id=None) -> str:
    """Store user media in MariaDB so SQL dumps carry the bytes with the app data."""
    asset_id = uuid.uuid4().hex
    digest = hashlib.sha256(data).hexdigest()
    db = get_db()
    cur = db.cursor()
    try:
        cur.execute(
            '''INSERT INTO media_assets
               (asset_id, owner_id, mime_type, byte_size, sha256, data)
               VALUES (%s,%s,%s,%s,%s,%s)''',
            (asset_id, owner_id, mime_type[:100], len(data), digest, data),
        )
        db.commit()
    finally:
        db.close()
    return f'/api/media/{asset_id}'


def delete_media(url: str, owner_id=None):
    if not isinstance(url, str) or not url.startswith('/api/media/'):
        return
    asset_id = url.rsplit('/', 1)[-1]
    if not re.fullmatch(r'[a-f0-9]{32}', asset_id):
        return
    db = get_db()
    cur = db.cursor()
    try:
        if owner_id is None:
            cur.execute('DELETE FROM media_assets WHERE asset_id=%s', (asset_id,))
        else:
            cur.execute('DELETE FROM media_assets WHERE asset_id=%s AND owner_id=%s', (asset_id, owner_id))
        db.commit()
    finally:
        db.close()


# Simple in-process TTL cache for public read endpoints.
# Each worker keeps its own copy — good enough for reducing DB hits.
_cache: dict = {}
_cache_lock = threading.Lock()

def cache_get(key: str):
    with _cache_lock:
        entry = _cache.get(key)
        if entry and time.monotonic() < entry['exp']:
            return entry['val']
        return None

def cache_set(key: str, val, ttl: int = 30):
    with _cache_lock:
        _cache[key] = {'val': val, 'exp': time.monotonic() + ttl}

def cache_delete_prefix(prefix: str):
    with _cache_lock:
        for k in list(_cache.keys()):
            if k.startswith(prefix):
                del _cache[k]


def create_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
    }
    return jwt.encode(payload, os.environ.get('JWT_SECRET', ''), algorithm='HS256')


def verify_token(token):
    try:
        payload = jwt.decode(token, os.environ.get('JWT_SECRET', ''), algorithms=['HS256'])
        return payload['user_id']
    except Exception:
        return None


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.cookies.get('token') or request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_token(token)
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        request.user_id = user_id
        return f(*args, **kwargs)
    return decorated


def optional_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.cookies.get('token') or request.headers.get('Authorization', '').replace('Bearer ', '')
        request.user_id = verify_token(token)
        return f(*args, **kwargs)
    return decorated
