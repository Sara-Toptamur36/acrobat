"""
Artist routes
"""
from flask import Blueprint, request
from app.services.artist_service import ArtistService
from app.utils.error_handlers import create_error_response, create_success_response
from app.utils.validation import validate_pagination, validate_required_fields
from app.utils.decorators import admin_required

artists_bp = Blueprint('artists', __name__)

from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.favorite import ArtistFavorite

@artists_bp.route('', methods=['GET'])
@jwt_required(optional=True)
def get_artists():
    """Get artists with pagination and search"""
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
    
    artists, pagination = ArtistService.get_all_artists(page, limit, search)
    
    # Check favorites if user is logged in
    user_id = get_jwt_identity()
    if user_id:
        # Get all favorite artist IDs for this user
        fav_query = ArtistFavorite.query.filter_by(user_id=user_id).with_entities(ArtistFavorite.artist_id).all()
        fav_ids = {f[0] for f in fav_query}
        
        for artist in artists:
            artist['is_favorite'] = artist['artist_id'] in fav_ids
    else:
        for artist in artists:
            artist['is_favorite'] = False
    
    return create_success_response({
        'artists': artists,
        'pagination': pagination
    })

@artists_bp.route('/<int:artist_id>', methods=['GET'])
@jwt_required(optional=True)
def get_artist(artist_id):
    """Get artist details"""
    artist_obj = ArtistService.get_artist_by_id(artist_id)
    if not artist_obj:
        return create_error_response(
            code='RESOURCE_NOT_FOUND',
            message='Artist not found',
            status=404
        )
    
    data = artist_obj.to_dict()
    
    # Check if favorited
    user_id = get_jwt_identity()
    if user_id:
        from app.models.favorite import ArtistFavorite
        fav = ArtistFavorite.query.filter_by(user_id=user_id, artist_id=artist_id).first()
        data['is_favorite'] = bool(fav)
    else:
        data['is_favorite'] = False
        
    return create_success_response(data)

@artists_bp.route('', methods=['POST'])
@admin_required
def create_artist():
    """Create new artist (admin only)"""
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
        artist = ArtistService.create_artist(data)
        return create_success_response(artist, status=201)
        
    except Exception as e:
        # Unexpected error (Service layer should ideally catch known errors and re-raise or handle)
        # But for now, letting global handler or simple catch work.
        # Since we don't have global handler fully visible here, let's re-raise to let Flask handle 500
        # Or better, return 500.
        # In catalog.py it was using `raise` inside `except`, allowing global error handler to catch it.
        # We will do the same.
        raise

@artists_bp.route('/<int:artist_id>', methods=['PUT'])
@admin_required
def update_artist(artist_id):
    """Update artist (admin only)"""
    data = request.get_json()
    
    if not data:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Request body is required',
            status=400
        )
    
    try:
        artist = ArtistService.update_artist(artist_id, data)
        return create_success_response(artist)
    except Exception as e:
        raise

@artists_bp.route('/<int:artist_id>', methods=['DELETE'])
@admin_required
def delete_artist(artist_id):
    """Delete artist (admin only)"""
    try:
        ArtistService.delete_artist(artist_id)
        return create_success_response({'message': 'Artist deleted successfully'})
    except ValueError as e:
         return create_error_response(
            code='FOREIGN_KEY_CONSTRAINT',
            message=str(e),
            status=409
        )
    except Exception as e:
        raise
