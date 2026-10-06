"""
Genre Service - Business logic for genre operations
"""
from typing import List, Dict, Tuple
from app import db
from app.models import Genre

class GenreService:
    """Service class for genre business logic"""
    
    @staticmethod
    def get_genres(page: int = 1, limit: int = 20, search: str = '') -> Tuple[List[Dict], Dict]:
        """Get genres with pagination and search"""
        query = Genre.query
        
        if search:
            query = query.filter(Genre.name.ilike(f'%{search}%'))
        
        # Execute paginated query
        paginated = query.order_by(Genre.name).paginate(
            page=page, per_page=limit, error_out=False
        )
        
        genres = [genre.to_dict(include_song_count=True) for genre in paginated.items]
        pagination = {
            'page': page,
            'per_page': limit,
            'total': paginated.total,
            'pages': paginated.pages
        }
        
        return genres, pagination

    @staticmethod
    def create_genre(data: Dict) -> Dict:
        """Create new genre"""
        try:
            genre = Genre(
                name=data['name'].strip(),
                description=data.get('description', '').strip() if data.get('description') else None
            )
            
            db.session.add(genre)
            db.session.commit()
            
            return genre.to_dict()
        except Exception as e:
            db.session.rollback()
            raise

    @staticmethod
    def delete_genre(genre_id: int) -> bool:
        """Delete genre"""
        genre = Genre.query.get_or_404(genre_id)
        
        # Check if genre has songs
        if genre.songs.count() > 0:
            raise ValueError("Cannot delete genre with existing songs")
        
        try:
            db.session.delete(genre)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise
