from flask import request, jsonify
import mysql.connector
from mysql.connector import pooling
import os
import jwt
import datetime
from functools import wraps
import time
import threading

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
