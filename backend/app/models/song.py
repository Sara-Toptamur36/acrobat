"""
Song model
"""
from datetime import datetime, UTC
from app import db

class Song(db.Model):
    __tablename__ = 'songs'
    
    song_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    album_id = db.Column(db.Integer, db.ForeignKey('albums.album_id', ondelete='CASCADE'), nullable=False)
    genre_id = db.Column(db.Integer, db.ForeignKey('genres.genre_id', ondelete='SET NULL'))
    title = db.Column(db.String(100), nullable=False)
    duration = db.Column(db.Integer, nullable=False)  # in seconds
    track_number = db.Column(db.Integer, nullable=False)
    file_path = db.Column(db.String(500), nullable=True) # store relative path or URL
    average_rating = db.Column(db.Numeric(3, 2), default=0.00, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    
    # Relationships
    playlist_songs = db.relationship('PlaylistSong', back_populates='song', lazy='dynamic', cascade='all, delete-orphan')
    reviews = db.relationship('Review', backref='song', lazy='dynamic', cascade='all, delete-orphan')
    favorites = db.relationship('Favorite', backref='song', lazy='dynamic', cascade='all, delete-orphan')
    
    # Unique constraint for track number within album
    __table_args__ = (
        db.UniqueConstraint('album_id', 'track_number', name='uk_songs_album_track'),
        db.CheckConstraint('duration > 0', name='chk_songs_duration'),
        db.CheckConstraint('track_number > 0', name='chk_songs_track_number'),
        db.CheckConstraint('average_rating >= 0.00 AND average_rating <= 10.00', name='chk_songs_average_rating')
    )
    
    def to_dict(self, include_album=True, include_genre=True, include_artist=True):
        """Convert to dictionary"""
        data = {
            'song_id': self.song_id,
            'album_id': self.album_id,
            'genre_id': self.genre_id,
            'title': self.title,
            'duration': self.duration,
            'track_number': self.track_number,
            'file_path': self.file_path,
            'average_rating': float(self.average_rating) if self.average_rating else 0.00,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_album and self.album:
            album_data = {
                'album_id': self.album.album_id,
                'title': self.album.title,
                'release_year': self.album.release_year
            }
            if include_artist and self.album.artist:
                album_data['artist'] = {
                    'artist_id': self.album.artist.artist_id,
                    'name': self.album.artist.name
                }
            data['album'] = album_data
        
        if include_genre and self.genre:
            data['genre'] = {
                'genre_id': self.genre.genre_id,
                'name': self.genre.name
            }
        
        return data
    
    def __repr__(self):
        return f'<Song {self.title}>'