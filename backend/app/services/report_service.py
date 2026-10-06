"""
Report service - Business logic for reports and analytics
"""
from typing import List, Dict, Tuple
from datetime import datetime, timedelta
from sqlalchemy import text
from app import db

class ReportService:
    """Service class for report business logic with optional caching"""
    
    # Simple in-memory cache with TTL
    _cache = {}
    _cache_ttl = 60  # 60 seconds TTL
    
    @classmethod
    def _get_cache_key(cls, view_name: str, page: int, limit: int) -> str:
        """Generate cache key for view query"""
        return f"{view_name}:{page}:{limit}"
    
    @classmethod
    def _cleanup_cache(cls, now: datetime = None) -> None:
        """Remove expired entries from cache"""
        if now is None:
            now = datetime.now()
        
        # Get list of expired keys
        expired_keys = []
        for key, entry in cls._cache.items():
            if entry['expires_at'] <= now:
                expired_keys.append(key)
        
        # Remove expired keys
        for key in expired_keys:
            cls._cache.pop(key, None)
    
    @classmethod
    def _is_cache_valid(cls, cache_entry: Dict) -> bool:
        """Check if cache entry is still valid"""
        return datetime.now() < cache_entry['expires_at']
    
    @classmethod
    def _get_from_cache(cls, cache_key: str) -> Dict:
        """Get data from cache if valid"""
        # Clean up expired entries first
        cls._cleanup_cache()
        
        if cache_key in cls._cache:
            entry = cls._cache[cache_key]
            if cls._is_cache_valid(entry):
                return entry['data']
            else:
                # Remove expired entry
                cls._cache.pop(cache_key, None)
        return None
    
    @classmethod
    def _set_cache(cls, cache_key: str, data: Dict) -> None:
        """Set data in cache with TTL"""
        cls._cache[cache_key] = {
            'data': data,
            'expires_at': datetime.now() + timedelta(seconds=cls._cache_ttl)
        }
    
    @staticmethod
    def get_genres_with_song_count(page: int = 1, limit: int = 20) -> Tuple[List[Dict], Dict]:
        """Get genre statistics from genres_with_song_count view"""
        cache_key = ReportService._get_cache_key('genres_with_song_count', page, limit)
        
        # Try cache first
        cached_data = ReportService._get_from_cache(cache_key)
        if cached_data:
            return cached_data['genres'], cached_data['pagination']
        
        try:
            # Query the view with pagination
            offset = (page - 1) * limit
            
            result = db.session.execute(
                text('SELECT * FROM genres_with_song_count LIMIT :limit OFFSET :offset'),
                {'limit': limit, 'offset': offset}
            )
            
            # Get total count
            total_result = db.session.execute(text('SELECT COUNT(*) FROM genres_with_song_count'))
            total = total_result.scalar()
            
            genres = []
            for row in result:
                genres.append({
                    'genre_id': row[0],
                    'genre_name': row[1],
                    'song_count': row[2],
                    'avg_genre_rating': float(row[3]) if row[3] else 0.00
                })
            
            pagination = {
                'page': page,
                'per_page': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
            
            # Cache the result
            data = {'genres': genres, 'pagination': pagination}
            ReportService._set_cache(cache_key, data)
            
            return genres, pagination
            
        except Exception as e:
            raise
    
    @staticmethod
    def get_album_release_statistics(page: int = 1, limit: int = 20) -> Tuple[List[Dict], Dict]:
        """Get album release statistics from album_release_statistics view"""
        cache_key = ReportService._get_cache_key('album_release_statistics', page, limit)
        
        # Try cache first
        cached_data = ReportService._get_from_cache(cache_key)
        if cached_data:
            return cached_data['statistics'], cached_data['pagination']
        
        try:
            # Query the view with pagination
            offset = (page - 1) * limit
            
            result = db.session.execute(
                text('SELECT * FROM album_release_statistics LIMIT :limit OFFSET :offset'),
                {'limit': limit, 'offset': offset}
            )
            
            # Get total count
            total_result = db.session.execute(text('SELECT COUNT(*) FROM album_release_statistics'))
            total = total_result.scalar()
            
            statistics = []
            for row in result:
                statistics.append({
                    'release_year': row[0],
                    'album_count': row[1],
                    'unique_artists': row[2],
                    'avg_songs_per_album': float(row[3]) if row[3] else 0.00,
                    'avg_album_duration': float(row[4]) if row[4] else 0.00
                })
            
            pagination = {
                'page': page,
                'per_page': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
            
            # Cache the result
            data = {'statistics': statistics, 'pagination': pagination}
            ReportService._set_cache(cache_key, data)
            
            return statistics, pagination
            
        except Exception as e:
            raise
    
    @staticmethod
    def get_most_active_users(page: int = 1, limit: int = 20) -> Tuple[List[Dict], Dict]:
        """Get most active users from most_active_users view"""
        cache_key = ReportService._get_cache_key('most_active_users', page, limit)
        
        # Try cache first
        cached_data = ReportService._get_from_cache(cache_key)
        if cached_data:
            return cached_data['users'], cached_data['pagination']
        
        try:
            # Query the view with pagination
            offset = (page - 1) * limit
            
            result = db.session.execute(
                text('SELECT * FROM most_active_users LIMIT :limit OFFSET :offset'),
                {'limit': limit, 'offset': offset}
            )
            
            # Get total count
            total_result = db.session.execute(text('SELECT COUNT(*) FROM most_active_users'))
            total = total_result.scalar()
            
            users = []
            for row in result:
                users.append({
                    'user_id': row[0],
                    'username': row[1],
                    'created_at': row[2].isoformat() if row[2] else None,
                    'total_playlists': row[3],
                    'total_ratings': row[4],
                    'total_comments': row[5],
                    'avg_rating': float(row[6]) if row[6] else 0.0,
                    'unique_songs_in_playlists': row[7],
                    'activity_score': row[8]
                })
            
            pagination = {
                'page': page,
                'per_page': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
            
            # Cache the result
            data = {'users': users, 'pagination': pagination}
            ReportService._set_cache(cache_key, data)
            
            return users, pagination
            
        except Exception as e:
            raise
    
    @staticmethod
    def get_top_rated_songs(page: int = 1, limit: int = 20) -> Tuple[List[Dict], Dict]:
        """Get top rated songs from top_rated_songs view"""
        cache_key = ReportService._get_cache_key('top_rated_songs', page, limit)
        
        # Try cache first
        cached_data = ReportService._get_from_cache(cache_key)
        if cached_data:
            return cached_data['songs'], cached_data['pagination']
        
        try:
            # Query the view with pagination
            offset = (page - 1) * limit
            
            result = db.session.execute(
                text('SELECT * FROM top_rated_songs LIMIT :limit OFFSET :offset'),
                {'limit': limit, 'offset': offset}
            )
            
            # Get total count
            total_result = db.session.execute(text('SELECT COUNT(*) FROM top_rated_songs'))
            total = total_result.scalar()
            
            songs = []
            for row in result:
                songs.append({
                    'song_id': row[0],
                    'song_title': row[1],
                    'album_title': row[2],
                    'artist_name': row[3],
                    'genre_name': row[4],
                    'average_rating': float(row[5]) if row[5] else 0.00,
                    'rating_count': row[6],
                    'duration': row[7]
                })
            
            pagination = {
                'page': page,
                'per_page': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
            
            # Cache the result
            data = {'songs': songs, 'pagination': pagination}
            ReportService._set_cache(cache_key, data)
            
            return songs, pagination
            
        except Exception as e:
            raise
    
    @classmethod
    def clear_cache(cls) -> None:
        """Clear all cached data (useful for testing or manual cache invalidation)"""
        cls._cache.clear()