from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

_here = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(_here, 'config', '.env'))

from extensions import oauth, limiter


def create_app():
    app = Flask(__name__, static_folder='static')
    app.secret_key = os.environ.get('SECRET_KEY', '')

    # Abort on startup if critical secrets are missing or insecure defaults used
    _jwt = os.environ.get('JWT_SECRET', '')
    _sk  = os.environ.get('SECRET_KEY', '')
    if not _jwt or not _sk:
        raise RuntimeError('JWT_SECRET and SECRET_KEY must be set in the environment')

    CORS(app, supports_credentials=True, origins=[
        os.environ.get('APP_URL', 'http://localhost:3001'),
        'http://localhost:3001',
    ])

    limiter.init_app(app)
    oauth.init_app(app)

    @app.after_request
    def set_security_headers(response):
        response.headers['X-Content-Type-Options']  = 'nosniff'
        response.headers['X-Frame-Options']         = 'DENY'
        response.headers['Referrer-Policy']         = 'strict-origin-when-cross-origin'
        response.headers['Permissions-Policy']      = 'camera=(), microphone=(), geolocation=()'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response.headers['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: blob: https:; "
            "frame-src https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com "
            "https://player.vimeo.com https://twitter.com https://www.instagram.com; "
            "connect-src 'self'"
        )
        return response

    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({'error': 'Too many requests. Please slow down and try again later.'}), 429
    oauth.register(
        name='google',
        client_id=os.environ.get('GOOGLE_CLIENT_ID'),
        client_secret=os.environ.get('GOOGLE_CLIENT_SECRET'),
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'},
    )

    from blueprints.auth import bp as auth_bp
    from blueprints.links import bp as links_bp
    from blueprints.explore import bp as explore_bp
    from blueprints.blog import bp as blog_bp
    from blueprints.settings import bp as settings_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(links_bp)
    app.register_blueprint(explore_bp)
    app.register_blueprint(blog_bp)
    app.register_blueprint(settings_bp)

    return app


app = create_app()

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5051, debug=False)
