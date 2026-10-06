"""
Artist Service - Business logic for artist operations
"""
from typing import List, Dict, Optional, Tuple
import sys
import traceback
from flask import current_app
from sqlalchemy import or_
from app import db
from app.models import Artist

class ArtistService:
    """Service class for artist business logic"""
    
    @staticmethod
    def get_all_artists(page: int = 1, limit: int = 20, search: str = '') -> Tuple[List[Dict], Dict]:
        """Get artists with pagination and search"""
        query = Artist.query
        
        if search:
            query = query.filter(
                or_(
                    Artist.name.ilike(f'%{search}%'),
                    Artist.bio.ilike(f'%{search}%')
                )
            )
        
        try:
            # DEBUG LOGGING
            print("DEBUG: Starting get_all_artists", flush=True)
            if current_app:
                db_uri = current_app.config.get('SQLALCHEMY_DATABASE_URI', 'NOT_SET')
                # Simple mask for password
                if '://' in db_uri and '@' in db_uri:
                    try:
                        part1 = db_uri.split('@')[0]
                        part2 = db_uri.split('@')[1]
                        # part1 is driver://user:pass
                        if ':' in part1:
                            driver_user = part1.split(':')[0] + ':' + part1.split(':')[1]
                            encrypted_uri = f"{driver_user}:****@{part2}"
                            print(f"DEBUG: DB URI: {encrypted_uri}", flush=True)
                    except:
                        print(f"DEBUG: DB URI (parse failed): {db_uri}", flush=True)
                
            count = Artist.query.count()
            print(f"DEBUG: Artist.query.count(): {count}", flush=True)
            
            if count > 0:
                sample = Artist.query.limit(5).all()
                print(f"DEBUG: First 5 artists: {[{'id': a.artist_id, 'name': a.name} for a in sample]}", flush=True)

            # Execute paginated query
            paginated = query.order_by(Artist.name).paginate(
                page=page, per_page=limit, error_out=False
            )
            
            artists = [artist.to_dict() for artist in paginated.items]
            pagination = {
                'page': page,
                'per_page': limit,
                'total': paginated.total,
                'pages': paginated.pages
            }
            
            return artists, pagination
        except Exception as e:
            # Handle DB connection errors gracefully as requested
            print(f"ERROR in get_all_artists: {e}", file=sys.stderr, flush=True)
            traceback.print_exc()
            print(f"DB Error in get_all_artists: {e}")
            # Return empty structure
            return [], {
                'page': page,
                'per_page': limit,
                'total': 0,
                'pages': 0
            }

    @staticmethod
    def get_artist_by_id(artist_id: int) -> Optional[Artist]:
        """Get artist by ID"""
        return Artist.query.get(artist_id)

    @staticmethod
    def create_artist(data: Dict) -> Dict:
        """Create new artist"""
        try:
            artist = Artist(
                name=data['name'].strip(),
                bio=data.get('bio', '').strip() if data.get('bio') else None
            )
            
            db.session.add(artist)
            db.session.commit()
            
            return artist.to_dict()
        except Exception as e:
            db.session.rollback()
            raise

    @staticmethod
    def update_artist(artist_id: int, data: Dict) -> Dict:
        """Update artist"""
        artist = Artist.query.get_or_404(artist_id)
        
        try:
            if 'name' in data and data['name']:
                artist.name = data['name'].strip()
            
            if 'bio' in data:
                artist.bio = data['bio'].strip() if data['bio'] else None
            
            db.session.commit()
            return artist.to_dict()
        except Exception as e:
            db.session.rollback()
            raise

    @staticmethod
    def delete_artist(artist_id: int) -> bool:
        """Delete artist"""
        artist = Artist.query.get_or_404(artist_id)
        
        # Check if artist has albums
        if artist.albums.count() > 0:
            raise ValueError("Cannot delete artist with existing albums")
        
        try:
            db.session.delete(artist)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise
