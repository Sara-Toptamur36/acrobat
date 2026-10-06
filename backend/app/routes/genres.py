"""
Genre routes
"""
from flask import Blueprint, request
from app.services.genre_service import GenreService
from app.utils.error_handlers import create_error_response, create_success_response
from app.utils.validation import validate_pagination, validate_required_fields
from app.utils.decorators import admin_required

genres_bp = Blueprint('genres', __name__)

@genres_bp.route('', methods=['GET'])
def get_genres():
    """Get genres with pagination and search"""
    page = request.args.get('page', 1)
    limit = request.args.get('limit', 20)
    search = request.args.get('search', '').strip()
    
    # Validate pagination
    page, limit, errors = validate_pagination(page, limit)
    if errors:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Invalid pagination parameters',
            status=400,
            details=errors
        )
    
    genres, pagination = GenreService.get_genres(page, limit, search)
    
    return create_success_response({
        'genres': genres,
        'pagination': pagination
    })

@genres_bp.route('', methods=['POST'])
@admin_required
def create_genre():
    """Create new genre (admin only)"""
    data = request.get_json()
    
    if not data:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Request body is required',
            status=400
        )
    
    # Validate required fields
    field_errors = validate_required_fields(data, ['name'])
    
    if field_errors:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Invalid input data provided',
            status=400,
            details=field_errors
        )
    
    try:
        genre = GenreService.create_genre(data)
        return create_success_response(genre, status=201)
        
    except Exception as e:
        raise

@genres_bp.route('/<int:genre_id>', methods=['DELETE'])
@admin_required
def delete_genre(genre_id):
    """Delete genre (admin only)"""
    try:
        GenreService.delete_genre(genre_id)
        return create_success_response({'message': 'Genre deleted successfully'})
    except ValueError as e:
        return create_error_response(
            code='FOREIGN_KEY_CONSTRAINT',
            message=str(e),
            status=409
        )
    except Exception as e:
        raise
