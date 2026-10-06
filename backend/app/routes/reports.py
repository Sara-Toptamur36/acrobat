"""
Reports and analytics routes using database views
"""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.services.report_service import ReportService
from app.utils.error_handlers import create_error_response, create_success_response
from app.utils.validation import validate_pagination
from app.utils.decorators import get_current_user

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/genres', methods=['GET'])
@jwt_required()
def get_genres_report():
    """Get genre statistics using genres_with_song_count view"""
    user = get_current_user()
    
    if not user:
        return create_error_response(
            code='AUTH_REQUIRED',
            message='User not found',
            status=401
        )
    
    page = request.args.get('page', 1)
    limit = request.args.get('limit', 20)
    
    # Validate pagination
    page, limit, errors = validate_pagination(page, limit)
    if errors:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Invalid pagination parameters',
            status=400,
            details=errors
        )
    
    try:
        genres, pagination = ReportService.get_genres_with_song_count(page, limit)
        
        return create_success_response({
            'genres': genres,
            'pagination': pagination
        })
        
    except Exception as e:
        return create_error_response(
            code='INTERNAL_ERROR',
            message='Failed to retrieve genre statistics',
            status=500
        )

@reports_bp.route('/albums-by-year', methods=['GET'])
@jwt_required()
def get_albums_by_year_report():
    """Get album release statistics using album_release_statistics view"""
    user = get_current_user()
    
    if not user:
        return create_error_response(
            code='AUTH_REQUIRED',
            message='User not found',
            status=401
        )
    
    page = request.args.get('page', 1)
    limit = request.args.get('limit', 20)
    
    # Validate pagination
    page, limit, errors = validate_pagination(page, limit)
    if errors:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Invalid pagination parameters',
            status=400,
            details=errors
        )
    
    try:
        statistics, pagination = ReportService.get_album_release_statistics(page, limit)
        
        return create_success_response({
            'release_statistics': statistics,
            'pagination': pagination
        })
        
    except Exception as e:
        return create_error_response(
            code='INTERNAL_ERROR',
            message='Failed to retrieve album release statistics',
            status=500
        )

@reports_bp.route('/active-users', methods=['GET'])
@jwt_required()
def get_active_users_report():
    """Get user activity leaderboard using most_active_users view"""
    user = get_current_user()
    
    if not user:
        return create_error_response(
            code='AUTH_REQUIRED',
            message='User not found',
            status=401
        )
    
    page = request.args.get('page', 1)
    limit = request.args.get('limit', 20)
    
    # Validate pagination
    page, limit, errors = validate_pagination(page, limit)
    if errors:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Invalid pagination parameters',
            status=400,
            details=errors
        )
    
    try:
        users, pagination = ReportService.get_most_active_users(page, limit)
        
        return create_success_response({
            'users': users,
            'pagination': pagination
        })
        
    except Exception as e:
        return create_error_response(
            code='INTERNAL_ERROR',
            message='Failed to retrieve user activity data',
            status=500
        )

@reports_bp.route('/top-songs', methods=['GET'])
@jwt_required()
def get_top_songs_report():
    """Get top rated songs using top_rated_songs view"""
    user = get_current_user()
    
    if not user:
        return create_error_response(
            code='AUTH_REQUIRED',
            message='User not found',
            status=401
        )
    
    page = request.args.get('page', 1)
    limit = request.args.get('limit', 20)
    
    # Validate pagination
    page, limit, errors = validate_pagination(page, limit)
    if errors:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Invalid pagination parameters',
            status=400,
            details=errors
        )
    
    try:
        songs, pagination = ReportService.get_top_rated_songs(page, limit)
        
        return create_success_response({
            'songs': songs,
            'pagination': pagination
        })
        
    except Exception as e:
        return create_error_response(
            code='INTERNAL_ERROR',
            message='Failed to retrieve top rated songs',
            status=500
        )