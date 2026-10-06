"""
Flask application factory
"""
import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate

from config import config

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()
cors = CORS()
migrate = Migrate()


def create_app(config_name=None):
    """Create and configure Flask application"""

    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "default")

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)

    # CORS setup
    cors_origins = app.config.get("CORS_ORIGINS", "*")
    CORS(app, resources={r"/api/*": {"origins": cors_origins}}, supports_credentials=True)

    migrate.init_app(app, db)

    # Register error handlers
    from app.utils.error_handlers import register_error_handlers
    register_error_handlers(app)

    # Register blueprints
    from app.routes.health import health_bp
    from app.routes.auth import auth_bp
    from app.routes.artists import artists_bp
    from app.routes.albums import albums_bp
    from app.routes.songs import songs_bp
    from app.routes.genres import genres_bp
    from app.routes.playlists import playlists_bp
    from app.routes.reports import reports_bp
    from app.routes.uploads import uploads_bp
    from app.routes.ratings import ratings_bp
    from app.routes.social import social_bp
    from app.routes.favorites import favorites_bp
    from app.routes.admin_users import admin_users_bp
    from app.routes.admin_dashboard import admin_dashboard_bp
    from app.routes.admin_auth import admin_auth_bp

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(artists_bp, url_prefix="/api/artists")
    app.register_blueprint(albums_bp, url_prefix="/api/albums")
    app.register_blueprint(songs_bp, url_prefix="/api/songs")
    app.register_blueprint(genres_bp, url_prefix="/api/genres")
    app.register_blueprint(playlists_bp, url_prefix="/api/playlists")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")
    app.register_blueprint(uploads_bp, url_prefix="/api")
    app.register_blueprint(ratings_bp, url_prefix="/api")
    app.register_blueprint(social_bp, url_prefix="/api/social")
    app.register_blueprint(favorites_bp, url_prefix="/api/favorites")
    app.register_blueprint(admin_users_bp, url_prefix="/api/admin/users")
    app.register_blueprint(admin_dashboard_bp, url_prefix="/api/admin/dashboard")
    app.register_blueprint(admin_auth_bp, url_prefix="/api/admin")

    # Optional: create default admin user (do NOT run in testing)
    # Além de DB operation olduğu için app_context içinde kalmalı.
    with app.app_context():
        db.create_all()  # Ensure all tables are created
        if config_name != "testing" and app.config.get("CREATE_ADMIN_USER"):
            from app.utils.admin_setup import create_default_admin
            create_default_admin()

    return app