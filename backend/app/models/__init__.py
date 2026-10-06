"""
SQLAlchemy models
"""
from app.models.user import User
from app.models.artist import Artist
from app.models.genre import Genre
from app.models.album import Album
from app.models.song import Song
from app.models.playlist import Playlist, PlaylistSong
from app.models.review import Review
from app.models.favorite import Favorite
from app.models.follow import Follow

__all__ = [
    'User',
    'Artist',
    'Genre',
    'Album',
    'Song',
    'Playlist',
    'PlaylistSong',
    'Review',
    'Favorite',
    'Follow'
]