"""
Album Service - Business logic for album operations
"""
from typing import List, Dict, Optional, Tuple
import json
import sys
import traceback
from flask import current_app
from sqlalchemy import or_
from app import db
from app.models import Album

class AlbumService:
    """Service class for album business logic"""
    
    @staticmethod
    def get_albums(page: int = 1, limit: int = 20, artist_id: Optional[int] = None, search: str = '') -> Tuple[List[Dict], Dict]:
        """Get albums with pagination and filtering"""
        from app.models import Artist
        query = Album.query.join(Artist)
        
        if artist_id:
            query = query.filter(Album.artist_id == artist_id)
            
        if search:
            query = query.filter(
                or_(
                    Album.title.ilike(f'%{search}%'),
                    Artist.name.ilike(f'%{search}%')
                )
            )
        
        try:
            # DEBUG LOGGING
            print("DEBUG: Starting get_albums", flush=True)
            if current_app:
                db_uri = current_app.config.get('SQLALCHEMY_DATABASE_URI', 'NOT_SET')
                 # Simple mask
                if '://' in db_uri and '@' in db_uri:
                    try:
                        part1 = db_uri.split('@')[0]
                        part2 = db_uri.split('@')[1]
                        if ':' in part1:
                            driver_user = part1.split(':')[0] + ':' + part1.split(':')[1]
                            encrypted_uri = f"{driver_user}:****@{part2}"
                            print(f"DEBUG: DB URI: {encrypted_uri}", flush=True)
                    except:
                         pass

            count = Album.query.count()
            print(f"DEBUG: Album.query.count(): {count}", flush=True)
             
            if count > 0:
                sample = Album.query.limit(5).all()
                print(f"DEBUG: First 5 albums: {[{'id': a.album_id, 'title': a.title} for a in sample]}", flush=True)

            # Execute paginated query
            paginated = query.order_by(Album.title).paginate(
                page=page, per_page=limit, error_out=False
            )
            
            albums = [album.to_dict() for album in paginated.items]
            pagination = {
                'page': page,
                'per_page': limit,
                'total': paginated.total,
                'pages': paginated.pages
            }
            
            return albums, pagination
        except Exception as e:
            # Handle DB connection errors gracefully
            print(f"ERROR in get_albums: {e}", file=sys.stderr, flush=True)
            traceback.print_exc()
            print(f"DB Error in get_albums: {e}")
            return [], {
                'page': page,
                'per_page': limit,
                'total': 0,
                'pages': 0
            }

    @staticmethod
    def get_album_by_id(album_id: int) -> Optional[Album]:
        """Get album by ID"""
        return Album.query.get(album_id)

    @staticmethod
    def create_album(data: Dict) -> Dict:
        """Create new album"""
        try:
            album = Album(
                artist_id=data['artist_id'],
                title=data['title'].strip(),
                release_year=data.get('release_year')
            )
            
            db.session.add(album)
            db.session.commit()
            
            return album.to_dict()
        except Exception as e:
            db.session.rollback()
            raise

    @staticmethod
    def create_album_with_songs_proc(data: Dict) -> Dict:
        """Create album with songs using Stored Procedure (Smart DB)"""
        try:
            # Call stored procedure
            # Note: We are using direct SQL execution for the Stored Procedure as per Smart DB architecture
            result = db.session.execute(
                db.text('CALL AddNewAlbumWithSongs(:artist_id, :album_title, :release_year, :songs)'),
                {
                    'artist_id': data['artist_id'],
                    'album_title': data['album_title'],
                    'release_year': data.get('release_year'),
                    # JSON dump is required for JSON parameter in MySQL
                    'songs': json.dumps(data['songs'])
                }
            )
            
            # The procedure returns the new album ID
            row = result.fetchone()
            if row:
                album_id = row[0]
            else:
                # Fallback if no result returned (should not happen with this SP)
                # But committing to be safe if SP did work but didn't return
                db.session.commit()
                # We need to find the latest album for this artist presumably? 
                # Ideally SP returns ID. Let's assume it worked.
                # Actually, if row is None, something might be wrong or SP didn't select.
                # The SP definition shows: SELECT v_album_id AS album_id; So it should return.
                raise ValueError("Stored procedure did not return album ID")

            db.session.commit()
            
            # Fetch the created album to return full object
            album = Album.query.get(album_id)
            if not album:
                 raise ValueError(f"Album created with ID {album_id} but not found")

            # Return with songs included since we just added them
            return album.to_dict(include_songs=True)
            
        except Exception as e:
            db.session.rollback()
            raise

    @staticmethod
    def update_album(album_id: int, data: Dict) -> Dict:
        """Update album"""
        album = Album.query.get_or_404(album_id)
        
        try:
            if 'title' in data and data['title']:
                album.title = data['title'].strip()
            
            if 'release_year' in data:
                # Handle nullable release_year
                album.release_year = data['release_year']
            
            db.session.commit()
            return album.to_dict()
        except Exception as e:
            db.session.rollback()
            raise

    @staticmethod
    def delete_album(album_id: int) -> bool:
        """Delete album"""
        album = Album.query.get_or_404(album_id)
        
        try:
            db.session.delete(album)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise
