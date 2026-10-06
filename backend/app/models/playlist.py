"""
Playlist and PlaylistSong models
"""
from datetime import datetime, UTC
from app import db

class Playlist(db.Model):
    __tablename__ = 'playlists'
    
    playlist_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    is_public = db.Column(db.Boolean, default=False, nullable=False)
    cover_image = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    
    # Relationships
    playlist_songs = db.relationship('PlaylistSong', back_populates='playlist', lazy='dynamic', 
                                   cascade='all, delete-orphan', order_by='PlaylistSong.position')
    
    def to_dict(self, include_songs=False, include_user=False):
        """Convert to dictionary"""
        data = {
            'playlist_id': self.playlist_id,
            'user_id': self.user_id,
            'name': self.name,
            'is_public': getattr(self, 'is_public', False),
            'cover_image': self.cover_image,
            'song_count': self.playlist_songs.count(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_user and self.user:
            data['user'] = {
                'user_id': self.user.user_id,
                'username': self.user.username
            }
        
        if include_songs:
            data['songs'] = [ps.to_dict() for ps in self.playlist_songs.order_by('position')]
        
        return data
    
    def __repr__(self):
        return f'<Playlist {self.name}>'

class PlaylistSong(db.Model):
    __tablename__ = 'playlist_songs'
    
    playlist_song_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    playlist_id = db.Column(db.Integer, db.ForeignKey('playlists.playlist_id', ondelete='CASCADE'), nullable=False)
    song_id = db.Column(db.Integer, db.ForeignKey('songs.song_id', ondelete='CASCADE'), nullable=False)
    position = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    
    # Relationships
    playlist = db.relationship('Playlist', back_populates='playlist_songs')
    song = db.relationship('Song', back_populates='playlist_songs')
    
    # Unique constraints
    __table_args__ = (
        db.UniqueConstraint('playlist_id', 'song_id', name='uk_playlist_songs_playlist_song'),
        db.UniqueConstraint('playlist_id', 'position', name='uk_playlist_songs_playlist_position'),
        db.CheckConstraint('position > 0', name='chk_playlist_songs_position')
    )
    
    def to_dict(self, include_song=True):
        """Convert to dictionary"""
        data = {
            'playlist_song_id': self.playlist_song_id,
            'playlist_id': self.playlist_id,
            'song_id': self.song_id,
            'position': self.position,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_song and self.song:
            data['song'] = self.song.to_dict()
        
        return data
    
    def __repr__(self):
        return f'<PlaylistSong playlist_id={self.playlist_id} song_id={self.song_id}>'