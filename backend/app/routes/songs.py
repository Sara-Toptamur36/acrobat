"""
Song routes
"""
from flask import Blueprint, request
from app.services.song_service import SongService
from app.utils.error_handlers import create_error_response, create_success_response
from app.utils.validation import validate_pagination, validate_positive_integer, validate_required_fields
from app.utils.decorators import admin_required

songs_bp = Blueprint('songs', __name__)


# Rating routes are now registered as a separate blueprint in __init__.py

@songs_bp.route('', methods=['GET'])
def get_songs():
    # ... existing get_songs code ...
    page = request.args.get('page', 1)
    limit = request.args.get('limit', 100)
    search = request.args.get('search', '').strip()
    genre_id = request.args.get('genre_id')
    artist_id = request.args.get('artist_id')
    album_id = request.args.get('album_id')
    min_rating = request.args.get('min_rating')
    max_rating = request.args.get('max_rating')
    sort_by_rating = request.args.get('sort_by_rating', 'true').lower() == 'true' # Default to true as per user request
    
    # Validate pagination
    page, limit, errors = validate_pagination(page, limit)
    if errors:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Invalid pagination parameters',
            status=400,
            details=errors
        )
    
    # Validate filter params
        genre_id = val
        
    if artist_id:
        val, artist_errors = validate_positive_integer(artist_id, 'artist_id')
        if artist_errors:
             return create_error_response(
                code='VALIDATION_ERROR',
                message='Invalid artist_id parameter',
                status=400,
                details=artist_errors
            )
        artist_id = val

    min_r = None
    if min_rating:
        try:
            min_r = float(min_rating)
        except ValueError:
            return create_error_response(
                code='VALIDATION_ERROR',
                message='Invalid min_rating parameter',
                status=400
            )
            
    max_r = None
    if max_rating:
        try:
            max_r = float(max_rating)
        except ValueError:
             return create_error_response(
                code='VALIDATION_ERROR',
                message='Invalid max_rating parameter',
                status=400
            )

    result = SongService.get_songs(
        page=page, 
        limit=limit, 
        search=search, 
        genre_id=genre_id,
        artist_id=artist_id,
        album_id=album_id,
        min_rating=min_r, 
        max_rating=max_r,
        sort_by_rating=sort_by_rating
    )
    
    return create_success_response({
        'songs': result['data'],
        'pagination': result['pagination']
    })

@songs_bp.route('/<int:song_id>', methods=['GET'])
def get_song(song_id):
    """Get song details"""
    from app.models import Song
    song = Song.query.get_or_404(song_id)
    return create_success_response(song.to_dict())

@songs_bp.route('', methods=['POST'])
@admin_required
def create_song():
    """Create new song (admin only)"""
    data = request.get_json()
    if not data:
        return create_error_response('VALIDATION_ERROR', 'No data provided', status=400)
    
    # Validate required fields
    required = ['title', 'album_id', 'track_number']
    errors = validate_required_fields(data, required)
    if errors:
        return create_error_response('VALIDATION_ERROR', 'Missing required fields', status=400, details=errors)
    
    try:
        song = SongService.create_song(data)
        return create_success_response(song, status=201)
    except Exception as e:
        raise

@songs_bp.route('/<int:song_id>', methods=['PUT'])
@admin_required
def update_song(song_id):
    """Update song (admin only)"""
    data = request.get_json()
    if not data:
        return create_error_response('VALIDATION_ERROR', 'No data provided', status=400)
    
    try:
        song = SongService.update_song(song_id, data)
        return create_success_response(song)
    except Exception as e:
        raise

@songs_bp.route('/<int:song_id>', methods=['DELETE'])
@admin_required
def delete_song(song_id):
    """Delete song (admin only)"""
    try:
        SongService.delete_song(song_id)
        return create_success_response({'message': 'Song deleted successfully'})
    except Exception as e:
        raise
