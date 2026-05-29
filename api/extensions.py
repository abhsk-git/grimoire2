from authlib.integrations.flask_client import OAuth
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os

oauth = OAuth()

_redis_url = os.environ.get('REDIS_URL', '')
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],
    storage_uri=_redis_url if _redis_url else 'memory://',
)
