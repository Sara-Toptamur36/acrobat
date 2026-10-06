"""
Song Service - Business logic for song operations
"""
from typing import List, Dict, Optional, Tuple, Any
from sqlalchemy import or_, func, case
from app import db
from app.models import Song, Album, Artist, Review

class SongService:
    """Service class for song business logic"""
    
    @staticmethod
    def get_songs(
        page: int = 1, 
        limit: int = 100, 
        search: str = '',
        genre_id: Optional[int] = None,
        artist_id: Optional[int] = None,
        album_id: Optional[int] = None,
        min_rating: Optional[float] = None,
        max_rating: Optional[float] = None,
        sort_by_rating: bool = False
    ) -> Dict[str, Any]:
        """Get songs with detailed filtering and pagination"""
        
        # Build query - Use outerjoin to ensure songs show up even if their relations are being updated
        query = Song.query.outerjoin(Album).outerjoin(Artist)
        
        # Apply filters
        if search:
            query = query.filter(
                or_(
                    Song.title.ilike(f'%{search}%'),
                    Artist.name.ilike(f'%{search}%'),
                    Album.title.ilike(f'%{search}%')
                )
            )
        
        if genre_id:
            query = query.filter(Song.genre_id == genre_id)
            
        if artist_id:
            query = query.filter(Artist.artist_id == artist_id)

        if album_id:
            query = query.filter(Song.album_id == album_id)
        
        if min_rating is not None:
            query = query.filter(Song.average_rating >= min_rating)
        
        if max_rating is not None:
            query = query.filter(Song.average_rating <= max_rating)
        
        # Calculate total count from filtered query (without ordering)
        total_items = query.count()
        print(f"DEBUG: SongService.get_songs - Total items found in DB: {total_items}")
        
        # Apply ordering - relevance-based if search term provided
        if search:
            # Order by relevance: exact matches first, then prefix matches, then contains matches
            relevance_score = case(
                (func.lower(Song.title) == func.lower(search), 0),  # Exact match
                (func.lower(Song.title).like(func.lower(search) + '%'), 1),  # Prefix match
                (func.lower(Song.title).like('%' + func.lower(search) + '%'), 2),  # Contains match
                else_=3  # Other matches (artist/album)
            )
            
            # Order by relevance score, then title length, then song_id for stable sorting
            query = query.order_by(
                relevance_score, 
                func.length(Song.title).asc(), 
                Song.song_id.asc()
            )
        else:
            # Default ordering when no search
            if sort_by_rating:
                # Sort by average rating (descending)
                # average_rating is non-nullable (defaults to 0.00), so nullslast is not needed/supported by all dialects
                query = query.order_by(Song.average_rating.desc())
            else:
                # Default to rating sort as per user request ("karışık bir düzene göre değil")
                query = query.order_by(Song.average_rating.desc(), Artist.name, Album.title)
        
        # Apply pagination manually
        offset = (page - 1) * limit
        items = query.offset(offset).limit(limit).all()
        
        # Calculate pagination metadata
        total_pages = (total_items + limit - 1) // limit if total_items > 0 else 0
        has_next = page < total_pages
        has_prev = page > 1
        next_page = page + 1 if has_next else None
        prev_page = page - 1 if has_prev else None
        
        # Return flat structure
        return {
            'data': [song.to_dict() for song in items],
            'pagination': {
                'page': page,
                'per_page': limit,
                'total_items': total_items,
                'total_pages': total_pages,
                'has_next': has_next,
                'has_prev': has_prev,
                'next_page': next_page,
                'prev_page': prev_page
            }
        }
    @staticmethod
    def create_song(data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new song"""
        song = Song(
            album_id=data['album_id'],
            genre_id=data.get('genre_id'),
            title=data['title'],
            duration=data.get('duration', 0),
            track_number=data['track_number'],
            file_path=data.get('file_path')
        )
        db.session.add(song)
        db.session.commit()
        return song.to_dict()

    @staticmethod
    def update_song(song_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update existing song"""
        song = Song.query.get_or_404(song_id)
        
        if 'title' in data:
            song.title = data['title']
        if 'album_id' in data:
            song.album_id = data['album_id']
        if 'genre_id' in data:
            song.genre_id = data['genre_id']
        if 'duration' in data:
            song.duration = data['duration']
        if 'track_number' in data:
            song.track_number = data['track_number']
        if 'file_path' in data:
            song.file_path = data['file_path']
            
        db.session.commit()
        return song.to_dict()

    @staticmethod
    def delete_song(song_id: int) -> None:
        """Delete song and its file if exists"""
        song = Song.query.get_or_404(song_id)
        
        # File deletion is handled in upload route usually, but for consistency:
        if song.file_path:
             from flask import current_app
             import os
             upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
             filename = os.path.basename(song.file_path)
             file_path = os.path.join(upload_folder, filename)
             if os.path.exists(file_path):
                 try:
                     os.remove(file_path)
                 except:
                     pass
                     
        db.session.delete(song)
        db.session.commit()
