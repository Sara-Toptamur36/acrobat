"""
Flask application configuration
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration class"""

    # Flask
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")

    # Database - Base class'ta fallback yok, child class'lar kendi URI'lerini belirler
    SQLALCHEMY_DATABASE_URI = None

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }

    # JWT
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-secret-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        seconds=int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES", 3600))
    )
    JWT_ALGORITHM = "HS256"

    # CORS
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")
    if isinstance(CORS_ORIGINS, str) and CORS_ORIGINS != "*":
        CORS_ORIGINS = CORS_ORIGINS.split(",")

    # Pagination
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100

    # Admin User Creation
    CREATE_ADMIN_USER = os.environ.get("CREATE_ADMIN_USER", "false").lower() == "true"
    ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@local")
    ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Admin123!")
    ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")

    # File Upload Configuration
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5MB max file size


class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    if SQLALCHEMY_DATABASE_URI and SQLALCHEMY_DATABASE_URI.startswith('mysql://'):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace('mysql://', 'mysql+pymysql://')


class TestingConfig(Config):
    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('TEST_DATABASE_URL')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)
    CREATE_ADMIN_USER = False
    WTF_CSRF_ENABLED = False


class ProductionConfig(Config):
    DEBUG = False
    TESTING = False


config = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}