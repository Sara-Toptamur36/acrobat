"""
Artist model
"""
from datetime import datetime, UTC
from app import db

class Artist(db.Model):
    __tablename__ = 'artists'
    
    artist_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    bio = db.Column(db.Text)
    album_count = db.Column(db.Integer, default=0, nullable=False)
    image_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    
    # Relationships
    albums = db.relationship('Album', backref='artist', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self, include_albums=False):
        """Convert to dictionary"""
        data = {
            'artist_id': self.artist_id,
            'name': self.name,
            'bio': self.bio,
            'bio': self.bio,
            'album_count': self.album_count,
            'image_url': self.image_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        if include_albums:
            data['albums'] = [album.to_dict() for album in self.albums]
        return data
    
    def __repr__(self):
        return f'<Artist {self.name}>'