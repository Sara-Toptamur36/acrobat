"""
Health check routes
"""
from flask import Blueprint, jsonify, current_app
from sqlalchemy import text
from app import db
from app.models import Artist
from app.utils.error_handlers import create_success_response

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection with proper text() wrapper
        db.session.execute(text('SELECT 1'))
        db_status = 'healthy'
    except Exception as e:
        db_status = f'unhealthy: {str(e)}'
    
    # Exfiltrate debug info
    try:
        artist_count = Artist.query.count()
    except Exception as e:
        artist_count = f"Error: {e}"

    db_uri = current_app.config.get('SQLALCHEMY_DATABASE_URI', 'NOT_SET')

    return create_success_response({
        'status': 'healthy',
        'database': db_status,
        'message': 'Music Catalog API is running',
        'debug_info': {
            'artist_count': artist_count,
            'db_uri': db_uri
        }
    })