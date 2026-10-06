"""
Playlist service - Business logic for playlist operations
"""
from typing import List, Dict, Optional, Tuple
from sqlalchemy.exc import IntegrityError
from app import db
from app.models import Playlist, PlaylistSong, Song, User

class PlaylistService:
    """Service class for playlist business logic"""
    
    @staticmethod
    def get_user_playlists(user_id: int, page: int = 1, limit: int = 20) -> Tuple[List[Dict], Dict]:
        """Get user's playlists with pagination"""
        user = db.session.get(User, user_id)
        if not user:
            raise ValueError("User not found")
        
        paginated = user.playlists.order_by(Playlist.name).paginate(
            page=page, per_page=limit, error_out=False
        )
        
        playlists = [playlist.to_dict() for playlist in paginated.items]
        pagination = {
            'page': page,
            'per_page': limit,
            'total': paginated.total,
            'pages': paginated.pages
        }
        
        return playlists, pagination
    
    @staticmethod
    def create_playlist(user_id: int, name: str, is_public: bool = False) -> Dict:
        """Create new playlist for user"""
        if not name or not name.strip():
            raise ValueError("Playlist name is required")
        
        user = db.session.get(User, user_id)
        if not user:
            raise ValueError("User not found")
        
        playlist = Playlist(
            user_id=user_id,
            name=name.strip(),
            is_public=is_public
        )
        
        db.session.add(playlist)
        db.session.commit()
        
        return playlist.to_dict()
    
    @staticmethod
    def get_playlist(playlist_id: int, user_id: int, include_songs: bool = False) -> Dict:
        """Get playlist by ID (if owner OR public)"""
        playlist = Playlist.query.get(playlist_id)
        
        if not playlist:
            raise ValueError("Playlist not found")
            
        # Check access: Owner OR Public
        # We need to handle the case where is_public might be missing on model attribute access if not refreshed,
        # but SQLAlchemy usually handles this. Safest is getattr.
        is_public = getattr(playlist, 'is_public', False)
        
        if playlist.user_id != user_id and not is_public:
            raise ValueError("Access denied")
        
        return playlist.to_dict(include_songs=include_songs, include_user=True)
    
    @staticmethod
    def update_playlist(playlist_id: int, user_id: int, name: Optional[str] = None, is_public: Optional[bool] = None) -> Dict:
        """Update playlist (only if user owns it)"""
        playlist = Playlist.query.filter_by(
            playlist_id=playlist_id,
            user_id=user_id
        ).first()
        
        if not playlist:
            raise ValueError("Playlist not found or access denied")
        
        if name is not None:
            if not name.strip():
                raise ValueError("Playlist name is required")
            playlist.name = name.strip()
            
        if is_public is not None:
            playlist.is_public = is_public
            
        db.session.commit()
        
        return playlist.to_dict()
    
    @staticmethod
    def delete_playlist(playlist_id: int, user_id: int) -> bool:
        """Delete playlist (only if user owns it)"""
        playlist = Playlist.query.filter_by(
            playlist_id=playlist_id,
            user_id=user_id
        ).first()
        
        if not playlist:
            raise ValueError("Playlist not found or access denied")
        
        db.session.delete(playlist)
        db.session.commit()
        
        return True
    
    @staticmethod
    def add_song_to_playlist(playlist_id: int, user_id: int, song_id: int) -> Dict:
        """Add song to playlist (only if user owns playlist)"""
        # Check playlist ownership
        playlist = Playlist.query.filter_by(
            playlist_id=playlist_id,
            user_id=user_id
        ).first()
        
        if not playlist:
            raise ValueError("Playlist not found or access denied")
        
        # Check if song exists
        song = db.session.get(Song, song_id)
        if not song:
            raise ValueError("Song not found")
        
        # Check if song already in playlist
        existing = PlaylistSong.query.filter_by(
            playlist_id=playlist_id,
            song_id=song_id
        ).first()
        
        if existing:
            raise IntegrityError("Song already in playlist", None, None)
        
        # Get next position
        max_position = db.session.query(db.func.max(PlaylistSong.position)).filter_by(
            playlist_id=playlist_id
        ).scalar() or 0
        
        playlist_song = PlaylistSong(
            playlist_id=playlist_id,
            song_id=song_id,
            position=max_position + 1
        )
        
        db.session.add(playlist_song)
        db.session.commit()
        
        return playlist_song.to_dict()
    
    @staticmethod
    def remove_song_from_playlist(playlist_id: int, user_id: int, song_id: int) -> bool:
        """Remove song from playlist (only if user owns playlist)"""
        # Check playlist ownership
        playlist = Playlist.query.filter_by(
            playlist_id=playlist_id,
            user_id=user_id
        ).first()
        
        if not playlist:
            raise ValueError("Playlist not found or access denied")
        
        # Find playlist song
        playlist_song = PlaylistSong.query.filter_by(
            playlist_id=playlist_id,
            song_id=song_id
        ).first()
        
        if not playlist_song:
            raise ValueError("Song not found in playlist")
        
        db.session.delete(playlist_song)
        db.session.commit()
        
        return True
    
    @staticmethod
    def reorder_playlist(playlist_id: int, user_id: int, items: List[Dict]) -> bool:
        """Reorder songs in playlist"""
        # Check playlist ownership
        playlist = Playlist.query.filter_by(
            playlist_id=playlist_id,
            user_id=user_id
        ).first()
        
        if not playlist:
            raise ValueError("Playlist not found or access denied")
        
        if not items:
            raise ValueError("Items list is required")
        
        # Validate items format
        for item in items:
            if 'song_id' not in item or 'position' not in item:
                raise ValueError("Each item must have song_id and position")
            
            if not isinstance(item['position'], int) or item['position'] <= 0:
                raise ValueError("Position must be a positive integer")
        
        # Start transaction
        try:
            # Update positions for each song
            for item in items:
                playlist_song = PlaylistSong.query.filter_by(
                    playlist_id=playlist_id,
                    song_id=item['song_id']
                ).first()
                
                if not playlist_song:
                    raise ValueError(f"Song {item['song_id']} not found in playlist")
                
                playlist_song.position = item['position']
            
            db.session.commit()
            return True
            
        except Exception as e:
            db.session.rollback()
            raise

    @staticmethod
    def toggle_song_like(user_id: int, song_id: int) -> Dict:
        """Toggle song like using Favorite model and sync with 'Beğenilenler' playlist"""
        from app.models.favorite import Favorite
        
        # Check if already liked
        existing = Favorite.query.filter_by(user_id=user_id, song_id=song_id).first()
        
        # Find or create "Beğenilenler" playlist
        liked_playlist = Playlist.query.filter_by(user_id=user_id, name="Beğenilenler").first()
        if not liked_playlist:
            try:
                liked_playlist = Playlist(user_id=user_id, name="Beğenilenler")
                db.session.add(liked_playlist)
                db.session.flush() # Get ID
            except IntegrityError:
                db.session.rollback()
                # Retry fetch if race condition occurred
                liked_playlist = Playlist.query.filter_by(user_id=user_id, name="Beğenilenler").first()
                if not liked_playlist:
                    raise Exception("Could not create or find 'Beğenilenler' playlist")
        
        if existing:
            # Remove from favorites
            db.session.delete(existing)
            status = 'unliked'
            
            # Remove from playlist if exists
            ps = PlaylistSong.query.filter_by(playlist_id=liked_playlist.playlist_id, song_id=song_id).first()
            if ps:
                db.session.delete(ps)
        else:
            # Add to favorites
            fv = Favorite(user_id=user_id, song_id=song_id)
            db.session.add(fv)
            status = 'liked'
            
            # Add to playlist if not already there
            existing_ps = PlaylistSong.query.filter_by(playlist_id=liked_playlist.playlist_id, song_id=song_id).first()
            if not existing_ps:
                # Get next position
                max_pos = db.session.query(db.func.max(PlaylistSong.position)).filter_by(
                    playlist_id=liked_playlist.playlist_id
                ).scalar() or 0
                
                ps = PlaylistSong(
                    playlist_id=liked_playlist.playlist_id,
                    song_id=song_id,
                    position=max_pos + 1
                )
                db.session.add(ps)
            
        db.session.commit()
        return {'status': status}