"""
Favorites routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.favorite import Favorite, AlbumFavorite, ArtistFavorite
from app.models.album import Album
from app.models.artist import Artist
from app.utils.error_handlers import create_error_response, create_success_response

favorites_bp = Blueprint('favorites', __name__)

@favorites_bp.route('', methods=['GET'])
@jwt_required()
def get_favorites():
    """Get all favorites for the current user"""
    user_id = get_jwt_identity()
    
    song_favs = Favorite.query.filter_by(user_id=user_id).all()
    album_favs = AlbumFavorite.query.filter_by(user_id=user_id).all()
    artist_favs = ArtistFavorite.query.filter_by(user_id=user_id).all()
    
    return create_success_response({
        'songs': [f.to_dict() for f in song_favs],
        'albums': [f.to_dict() for f in album_favs],
        'artists': [f.to_dict() for f in artist_favs]
    })

# Album Favorites
@favorites_bp.route('/albums', methods=['POST'])
@jwt_required()
def add_album_favorite():
    """Add album to favorites"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'album_id' not in data:
        return create_error_response('VALIDATION_ERROR', 'album_id is required', 400)
        
    album_id = data['album_id']
    
    # Check if album exists
    if not Album.query.get(album_id):
        return create_error_response('RESOURCE_NOT_FOUND', 'Album not found', 404)
        
    existing = AlbumFavorite.query.filter_by(user_id=user_id, album_id=album_id).first()
    if existing:
        return create_success_response({'status': 'already_favorited'})
        
    fav = AlbumFavorite(user_id=user_id, album_id=album_id)
    db.session.add(fav)
    db.session.commit()
    
    return create_success_response(fav.to_dict(), 201)

@favorites_bp.route('/albums/<int:album_id>', methods=['DELETE'])
@jwt_required()
def remove_album_favorite(album_id):
    """Remove album from favorites"""
    user_id = get_jwt_identity()
    
    fav = AlbumFavorite.query.filter_by(user_id=user_id, album_id=album_id).first()
    if not fav:
        return create_error_response('RESOURCE_NOT_FOUND', 'Favorite not found', 404)
        
    db.session.delete(fav)
    db.session.commit()
    
    return create_success_response({'status': 'removed'})

# Artist Favorites
@favorites_bp.route('/artists', methods=['POST'])
@jwt_required()
def add_artist_favorite():
    """Add artist to favorites"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'artist_id' not in data:
        return create_error_response('VALIDATION_ERROR', 'artist_id is required', 400)
        
    artist_id = data['artist_id']
    
    # Check if artist exists
    if not Artist.query.get(artist_id):
        return create_error_response('RESOURCE_NOT_FOUND', 'Artist not found', 404)
        
    existing = ArtistFavorite.query.filter_by(user_id=user_id, artist_id=artist_id).first()
    if existing:
        return create_success_response({'status': 'already_favorited'})
        
    fav = ArtistFavorite(user_id=user_id, artist_id=artist_id)
    db.session.add(fav)
    db.session.commit()
    
    return create_success_response(fav.to_dict(), 201)

@favorites_bp.route('/artists/<int:artist_id>', methods=['DELETE'])
@jwt_required()
def remove_artist_favorite(artist_id):
    """Remove artist from favorites"""
    user_id = get_jwt_identity()
    
    fav = ArtistFavorite.query.filter_by(user_id=user_id, artist_id=artist_id).first()
    if not fav:
        return create_error_response('RESOURCE_NOT_FOUND', 'Favorite not found', 404)
        
    db.session.delete(fav)
    db.session.commit()
    
    return create_success_response({'status': 'removed'})
