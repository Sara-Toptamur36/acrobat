"""
Album routes
"""
from flask import Blueprint, request
from app.services.album_service import AlbumService
from app.utils.error_handlers import create_error_response, create_success_response
from app.utils.validation import validate_pagination, validate_required_fields, validate_positive_integer
from app.utils.decorators import admin_required

albums_bp = Blueprint('albums', __name__)

@albums_bp.route('', methods=['GET'])
def get_albums():
    """Get albums with pagination and filtering"""
    page = request.args.get('page', 1)
    limit = request.args.get('limit', 20)
    artist_id_arg = request.args.get('artist_id')
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
    
    artist_id = None
    if artist_id_arg:
        val, artist_errors = validate_positive_integer(artist_id_arg, 'artist_id')
        if artist_errors:
            return create_error_response(
                code='VALIDATION_ERROR',
                message='Invalid artist_id parameter',
                status=400,
                details=artist_errors
            )
        artist_id = val
    
    albums, pagination = AlbumService.get_albums(page, limit, artist_id, search)
    
    return create_success_response({
        'albums': albums,
        'pagination': pagination
    })

from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.favorite import AlbumFavorite

@albums_bp.route('/<int:album_id>', methods=['GET'])
@jwt_required(optional=True)
def get_album(album_id):
    """Get album details"""
    album = AlbumService.get_album_by_id(album_id)
    if not album:
        return create_error_response(
            code='RESOURCE_NOT_FOUND',
            message='Album not found',
            status=404
        )
    
    response_data = album.to_dict(include_songs=True)
    
    # Check if favorited by current user
    user_id = get_jwt_identity()
    if user_id:
        fav = AlbumFavorite.query.filter_by(user_id=user_id, album_id=album_id).first()
        response_data['is_favorite'] = bool(fav)
    else:
        response_data['is_favorite'] = False
        
    return create_success_response(response_data)

@albums_bp.route('', methods=['POST'])
@admin_required
def create_album():
    """Create new album (admin only)"""
    data = request.get_json()
    
    if not data:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Request body is required',
            status=400
        )
    
    # Validate required fields
    field_errors = validate_required_fields(data, ['artist_id', 'title'])
    
    # Validate artist_id
    if 'artist_id' in data:
        _, artist_errors = validate_positive_integer(data['artist_id'], 'artist_id')
        field_errors.extend(artist_errors)
    
    # Validate release_year if provided
    if 'release_year' in data and data['release_year']:
        _, year_errors = validate_positive_integer(data['release_year'], 'release_year')
        field_errors.extend(year_errors)
    
    if field_errors:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Invalid input data provided',
            status=400,
            details=field_errors
        )
    
    try:
        album = AlbumService.create_album(data)
        return create_success_response(album, status=201)
        
    except Exception as e:
        raise

@albums_bp.route('/bulk', methods=['POST'])
@admin_required
def create_album_with_songs():
    """Create album with songs using stored procedure (admin only)"""
    data = request.get_json()
    
    if not data:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Request body is required',
            status=400
        )
    
    # Validate required fields for the stored procedure
    # Note: SP expects 'album_title' but our standard create expects 'title'. 
    # The frontend usually sends what API expects. catalog.py required 'album_title' for bulk.
    # We should keep existing contract: 'artist_id', 'album_title', 'songs'
    field_errors = validate_required_fields(data, ['artist_id', 'album_title', 'songs'])
    
    # Validate artist_id
    if 'artist_id' in data:
        _, artist_errors = validate_positive_integer(data['artist_id'], 'artist_id')
        field_errors.extend(artist_errors)
    
    # Validate songs array
    if 'songs' in data:
        if not isinstance(data['songs'], list) or len(data['songs']) == 0:
            field_errors.append({'field': 'songs', 'message': 'Songs must be a non-empty array'})
    
    if field_errors:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Invalid input data provided',
            status=400,
            details=field_errors
        )
    
    try:
        # Delegate to service which handles the Stored Procedure
        album = AlbumService.create_album_with_songs_proc(data)
        return create_success_response(album, status=201)
        
    except Exception as e:
        raise

@albums_bp.route('/<int:album_id>', methods=['PUT'])
@admin_required
def update_album(album_id):
    """Update album (admin only)"""
    data = request.get_json()
    
    if not data:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Request body is required',
            status=400
        )
    
    # Basic validation for update fields
    if 'release_year' in data and data['release_year']:
         # Just minimal check, service might handle more
         pass

    try:
        album = AlbumService.update_album(album_id, data)
        return create_success_response(album)
    except Exception as e:
        raise

@albums_bp.route('/<int:album_id>', methods=['DELETE'])
@admin_required
def delete_album(album_id):
    """Delete album (admin only) - cascades to songs"""
    try:
        AlbumService.delete_album(album_id)
        return create_success_response({'message': 'Album deleted successfully'})
    except Exception as e:
        raise
