"""
Playlist routes
"""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from sqlalchemy.exc import IntegrityError
from app import db
from app.models import Playlist, PlaylistSong, Song
from app.services.playlist_service import PlaylistService
from app.utils.error_handlers import create_error_response, create_success_response
from app.utils.validation import validate_pagination, validate_required_fields, validate_positive_integer
from app.utils.decorators import get_current_user

playlists_bp = Blueprint('playlists', __name__)

@playlists_bp.route('', methods=['GET'])
@jwt_required()
def get_user_playlists():
    """Get current user's playlists"""
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
        playlists, pagination = PlaylistService.get_user_playlists(user.user_id, page, limit)
        
        return create_success_response({
            'playlists': playlists,
            'pagination': pagination
        })
        
    except ValueError as e:
        return create_error_response(
            code='VALIDATION_ERROR',
            message=str(e),
            status=400
        )

@playlists_bp.route('', methods=['POST'])
@jwt_required()
def create_playlist():
    """Create new playlist"""
    user = get_current_user()
    
    if not user:
        return create_error_response(
            code='AUTH_REQUIRED',
            message='User not found',
            status=401
        )
    
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
        is_pub = data.get('is_public', False)
        playlist = PlaylistService.create_playlist(user.user_id, data['name'], is_public=is_pub)
        return create_success_response(playlist, status=201)
        
    except ValueError as e:
        return create_error_response(
            code='VALIDATION_ERROR',
            message=str(e),
            status=400
        )

@playlists_bp.route('/from-genre', methods=['POST'])
@jwt_required()
def create_playlist_from_genre():
    """Create playlist from genre using stored procedure"""
    user = get_current_user()
    
    if not user:
        return create_error_response(
            code='AUTH_REQUIRED',
            message='User not found',
            status=401
        )
    
    data = request.get_json()
    
    if not data:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Request body is required',
            status=400
        )
    
    # Validate required fields
    field_errors = validate_required_fields(data, ['genre_id', 'song_limit', 'playlist_name'])
    
    # Validate genre_id
    if 'genre_id' in data:
        genre_id, genre_errors = validate_positive_integer(data['genre_id'], 'genre_id')
        field_errors.extend(genre_errors)
    
    # Validate song_limit
    if 'song_limit' in data:
        song_limit, limit_errors = validate_positive_integer(data['song_limit'], 'song_limit')
        field_errors.extend(limit_errors)
    
    if field_errors:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Invalid input data provided',
            status=400,
            details=field_errors
        )
    
    try:
        # Call stored procedure
        result = db.session.execute(
            'CALL CreatePlaylistFromGenre(:user_id, :genre_id, :song_limit, :playlist_name)',
            {
                'user_id': user.user_id,
                'genre_id': data['genre_id'],
                'song_limit': data['song_limit'],
                'playlist_name': data['playlist_name']
            }
        )
        
        result_data = result.fetchone()
        playlist_id = result_data[0]
        available_songs = result_data[1]
        
        db.session.commit()
        
        # Fetch the created playlist
        playlist = PlaylistService.get_playlist(playlist_id, user.user_id, include_songs=True)
        
        return create_success_response({
            'playlist': playlist,
            'available_songs': available_songs
        }, status=201)
        
    except Exception as e:
        db.session.rollback()
        raise

@playlists_bp.route('/<int:playlist_id>', methods=['GET'])
@jwt_required()
def get_playlist(playlist_id):
    """Get playlist details"""
    user = get_current_user()
    
    if not user:
        return create_error_response(
            code='AUTH_REQUIRED',
            message='User not found',
            status=401
        )
    
    try:
        playlist = PlaylistService.get_playlist(playlist_id, user.user_id, include_songs=True)
        return create_success_response(playlist)
        
    except ValueError as e:
        return create_error_response(
            code='RESOURCE_NOT_FOUND',
            message=str(e),
            status=404
        )

@playlists_bp.route('/<int:playlist_id>', methods=['PUT'])
@jwt_required()
def update_playlist(playlist_id):
    """Update playlist name (only owner)"""
    user = get_current_user()
    
    if not user:
        return create_error_response(
            code='AUTH_REQUIRED',
            message='User not found',
            status=401
        )
    
    data = request.get_json()
    
    if not data:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Request body is required',
            status=400
        )
    
    
    try:
        playlist = PlaylistService.update_playlist(
            playlist_id, 
            user.user_id, 
            name=data.get('name'),
            is_public=data.get('is_public')
        )
        return create_success_response(playlist)
        
    except ValueError as e:
        return create_error_response(
            code='RESOURCE_NOT_FOUND',
            message=str(e),
            status=404
        )

@playlists_bp.route('/<int:playlist_id>', methods=['DELETE'])
@jwt_required()
def delete_playlist(playlist_id):
    """Delete playlist (only owner)"""
    user = get_current_user()
    
    if not user:
        return create_error_response(
            code='AUTH_REQUIRED',
            message='User not found',
            status=401
        )
    
    try:
        PlaylistService.delete_playlist(playlist_id, user.user_id)
        return create_success_response({'message': 'Playlist deleted successfully'})
        
    except ValueError as e:
        return create_error_response(
            code='RESOURCE_NOT_FOUND',
            message=str(e),
            status=404
        )

@playlists_bp.route('/<int:playlist_id>/songs', methods=['POST'])
@jwt_required()
def add_song_to_playlist(playlist_id):
    """Add song to playlist (only owner)"""
    user = get_current_user()
    
    if not user:
        return create_error_response(
            code='AUTH_REQUIRED',
            message='User not found',
            status=401
        )
    
    data = request.get_json()
    
    if not data:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Request body is required',
            status=400
        )
    
    # Validate required fields
    field_errors = validate_required_fields(data, ['song_id'])
    
    # Validate song_id
    if 'song_id' in data:
        song_id, song_errors = validate_positive_integer(data['song_id'], 'song_id')
        field_errors.extend(song_errors)
    
    if field_errors:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Invalid input data provided',
            status=400,
            details=field_errors
        )
    
    try:
        playlist_song = PlaylistService.add_song_to_playlist(playlist_id, user.user_id, data['song_id'])
        return create_success_response(playlist_song, status=201)
        
    except ValueError as e:
        return create_error_response(
            code='RESOURCE_NOT_FOUND',
            message=str(e),
            status=404
        )
    except IntegrityError as e:
        return create_error_response(
            code='DUPLICATE_VALUE',
            message='Song already in playlist',
            status=409
        )

@playlists_bp.route('/<int:playlist_id>/songs/<int:song_id>', methods=['DELETE'])
@jwt_required()
def remove_song_from_playlist(playlist_id, song_id):
    """Remove song from playlist (only owner)"""
    user = get_current_user()
    
    if not user:
        return create_error_response(
            code='AUTH_REQUIRED',
            message='User not found',
            status=401
        )
    
    try:
        PlaylistService.remove_song_from_playlist(playlist_id, user.user_id, song_id)
        return create_success_response({'message': 'Song removed from playlist'})
        
    except ValueError as e:
        return create_error_response(
            code='RESOURCE_NOT_FOUND',
            message=str(e),
            status=404
        )

@playlists_bp.route('/<int:playlist_id>/reorder', methods=['PUT'])
@jwt_required()
def reorder_playlist(playlist_id):
    """Reorder songs in playlist (only owner)"""
    user = get_current_user()
    
    if not user:
        return create_error_response(
            code='AUTH_REQUIRED',
            message='User not found',
            status=401
        )
    
    data = request.get_json()
    
    if not data:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Request body is required',
            status=400
        )
    
    # Validate required fields
    field_errors = validate_required_fields(data, ['items'])
    
    if 'items' in data and not isinstance(data['items'], list):
        field_errors.append({'field': 'items', 'message': 'Items must be an array'})
    
    if field_errors:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Invalid input data provided',
            status=400,
            details=field_errors
        )
    
    try:
        PlaylistService.reorder_playlist(playlist_id, user.user_id, data['items'])
        return create_success_response({'message': 'Playlist reordered successfully'})
        
    except ValueError as e:
        return create_error_response(
            code='VALIDATION_ERROR',
            message=str(e),
            status=400
        )

@playlists_bp.route('/like', methods=['POST'])
@jwt_required()
def toggle_song_like():
    """Like/Unlike a song"""
    user = get_current_user()
    if not user:
        return create_error_response('AUTH_REQUIRED', 'User not found', 401)
    
    data = request.get_json()
    if not data or 'song_id' not in data:
        return create_error_response('VALIDATION_ERROR', 'song_id is required', 400)
    
    try:
        result = PlaylistService.toggle_song_like(user.user_id, data['song_id'])
        return create_success_response(result)
    except Exception as e:
        return create_error_response('INTERNAL_SERVER_ERROR', str(e), 500)
