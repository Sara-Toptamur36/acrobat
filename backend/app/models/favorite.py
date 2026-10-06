"""
Favorite model
"""
from datetime import datetime, UTC
from app import db

class Favorite(db.Model):
    __tablename__ = 'favorites'
    
    favorite_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    song_id = db.Column(db.Integer, db.ForeignKey('songs.song_id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    
    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('user_id', 'song_id', name='uk_favorites_user_song'),
    )
    
    def to_dict(self, include_song=True):
        """Convert to dictionary"""
        data = {
            'favorite_id': self.favorite_id,
            'user_id': self.user_id,
            'song_id': self.song_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_song and self.song:
            data['song'] = self.song.to_dict()
        return data
    
    def __repr__(self):
        return f'<Favorite user_id={self.user_id} song_id={self.song_id}>'

class AlbumFavorite(db.Model):
    __tablename__ = 'album_favorites'
    
    favorite_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    album_id = db.Column(db.Integer, db.ForeignKey('albums.album_id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    
    # Relationship
    album = db.relationship('Album')

    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('user_id', 'album_id', name='uk_album_favorites_user_album'),
    )
    
    def to_dict(self):
        data = {
            'favorite_id': self.favorite_id,
            'user_id': self.user_id,
            'album_id': self.album_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if self.album:
            data['album'] = self.album.to_dict()
        return data

class ArtistFavorite(db.Model):
    __tablename__ = 'artist_favorites'
    
    favorite_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    artist_id = db.Column(db.Integer, db.ForeignKey('artists.artist_id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    
    # Relationship
    artist = db.relationship('Artist')

    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('user_id', 'artist_id', name='uk_artist_favorites_user_artist'),
    )
    
    def to_dict(self):
        data = {
            'favorite_id': self.favorite_id,
            'user_id': self.user_id,
            'artist_id': self.artist_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if self.artist:
            data['artist'] = self.artist.to_dict()
        return data
