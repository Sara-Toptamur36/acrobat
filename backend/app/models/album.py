"""
Album model
"""
from datetime import datetime, UTC
from app import db

class Album(db.Model):
    __tablename__ = 'albums'
    
    album_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    artist_id = db.Column(db.Integer, db.ForeignKey('artists.artist_id', ondelete='RESTRICT'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    release_year = db.Column(db.Integer)
    song_count = db.Column(db.Integer, default=0, nullable=False)
    total_duration = db.Column(db.Integer, default=0, nullable=False)  # in seconds
    cover_image = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    
    # Relationships
    songs = db.relationship('Song', backref='album', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self, include_artist=True, include_songs=False):
        """Convert to dictionary"""
        data = {
            'album_id': self.album_id,
            'artist_id': self.artist_id,
            'title': self.title,
            'release_year': self.release_year,
            'song_count': self.song_count,
            'total_duration': self.total_duration,
            'cover_image': self.cover_image,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        if include_artist and self.artist:
            data['artist'] = {
                'artist_id': self.artist.artist_id,
                'name': self.artist.name
            }
        if include_songs:
            data['songs'] = [song.to_dict(include_album=False) for song in self.songs.order_by('track_number')]
        return data
    
    def __repr__(self):
        return f'<Album {self.title}>'