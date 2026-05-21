from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

_here = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(_here, 'config', '.env'))

from extensions import oauth


def create_app():
    app = Flask(__name__, static_folder='static')
    app.secret_key = os.environ.get('SECRET_KEY', '')
    CORS(app, supports_credentials=True, origins=[
        os.environ.get('APP_URL', 'http://localhost:3001'),
        'http://localhost:3001',
    ])

    oauth.init_app(app)
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
