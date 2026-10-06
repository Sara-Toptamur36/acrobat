"""
Genre model
"""
from datetime import datetime, UTC
from app import db

class Genre(db.Model):
    __tablename__ = 'genres'
    
    genre_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    
    # Relationships
    songs = db.relationship('Song', backref='genre', lazy='dynamic')
    
    def to_dict(self, include_song_count=False):
        """Convert to dictionary"""
        data = {
            'genre_id': self.genre_id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        if include_song_count:
            data['song_count'] = self.songs.count()
        return data
    
    def __repr__(self):
        return f'<Genre {self.name}>'