"""
Unit tests for ReportService - Business logic and caching
"""
import pytest
from datetime import datetime, timedelta
from app import db
from app.models import User, Artist, Album, Song, Genre, Playlist, PlaylistSong, RatingComment
from app.services.report_service import ReportService
from tests.conftest import create_test_user, create_test_artist, create_test_album, create_test_song, create_test_genre, create_test_playlist, create_test_rating

class TestReportService:
    """Test ReportService business logic"""
    
    def test_get_genres_with_song_count_success(self, app, db_session):
        """Test successful genre statistics retrieval"""
        # Clear cache first
        ReportService.clear_cache()
        
        # Create test data using helper functions
        genre = create_test_genre(db_session)
        artist = create_test_artist(db_session)
        album = create_test_album(db_session, artist_id=artist.artist_id)
        song = create_test_song(db_session, album_id=album.album_id, genre_id=genre.genre_id)
        
        # Test service method
        genres, pagination = ReportService.get_genres_with_song_count(page=1, limit=10)
        
        assert isinstance(genres, list)
        assert isinstance(pagination, dict)
        assert pagination['page'] == 1
        assert pagination['per_page'] == 10
        assert 'total' in pagination
        assert 'pages' in pagination
    
    def test_get_album_release_statistics_success(self, app, db_session):
        """Test successful album release statistics retrieval"""
        # Clear cache first
        ReportService.clear_cache()
        
        # Create test data using helper functions
        artist = create_test_artist(db_session)
        album = create_test_album(db_session, artist_id=artist.artist_id)
        
        # Test service method
        statistics, pagination = ReportService.get_album_release_statistics(page=1, limit=10)
        
        assert isinstance(statistics, list)
        assert isinstance(pagination, dict)
        assert pagination['page'] == 1
        assert pagination['per_page'] == 10
    
    def test_get_most_active_users_success(self, app, db_session):
        """Test successful active users retrieval"""
        # Clear cache first
        ReportService.clear_cache()
        
        # Create test data using helper functions
        user = create_test_user(db_session)
        playlist = create_test_playlist(db_session, user_id=user.user_id)
        
        # Test service method
        users, pagination = ReportService.get_most_active_users(page=1, limit=10)
        
        assert isinstance(users, list)
        assert isinstance(pagination, dict)
        assert pagination['page'] == 1
        assert pagination['per_page'] == 10
    
    def test_get_top_rated_songs_success(self, app, db_session):
        """Test successful top rated songs retrieval"""
        # Clear cache first
        ReportService.clear_cache()
        
        # Create test data using helper functions
        user = create_test_user(db_session)
        genre = create_test_genre(db_session)
        artist = create_test_artist(db_session)
        album = create_test_album(db_session, artist_id=artist.artist_id)
        song = create_test_song(db_session, album_id=album.album_id, genre_id=genre.genre_id)
        rating = create_test_rating(db_session, user_id=user.user_id, song_id=song.song_id, rating=9.0, comment='Great song!')
        
        # Test service method
        songs, pagination = ReportService.get_top_rated_songs(page=1, limit=10)
        
        assert isinstance(songs, list)
        assert isinstance(pagination, dict)
        assert pagination['page'] == 1
        assert pagination['per_page'] == 10
    
    def test_caching_functionality(self, app, db_session):
        """Test that caching works correctly"""
        # Clear cache first
        ReportService.clear_cache()
        
        # Create test data using helper functions
        genre = create_test_genre(db_session)
        
        # First call - should hit database and cache result
        genres1, pagination1 = ReportService.get_genres_with_song_count(page=1, limit=10)
        
        # Second call - should hit cache
        genres2, pagination2 = ReportService.get_genres_with_song_count(page=1, limit=10)
        
        # Results should be identical
        assert genres1 == genres2
        assert pagination1 == pagination2
    
    def test_cache_expiration(self, app, db_session):
        """Test that cache expires correctly"""
        # Clear cache first
        ReportService.clear_cache()
        
        # Temporarily set very short TTL for testing
        original_ttl = ReportService._cache_ttl
        ReportService._cache_ttl = 1  # 1 second
        
        try:
            # Create test data using helper functions
            genre = create_test_genre(db_session)
            
            # First call - should cache result
            genres1, _ = ReportService.get_genres_with_song_count(page=1, limit=10)
            
            # Check that cache entry exists
            cache_key = ReportService._get_cache_key('genres_with_song_count', 1, 10)
            assert cache_key in ReportService._cache
            
            # Wait for cache to expire (simulate with manual expiration)
            ReportService._cache[cache_key]['expires_at'] = datetime.now() - timedelta(seconds=1)
            
            # Second call - should hit database again due to expired cache
            genres2, _ = ReportService.get_genres_with_song_count(page=1, limit=10)
            
            # Cache should have a new entry (old expired one removed, new one added)
            assert cache_key in ReportService._cache
            # The new entry should have a fresh expiration time
            new_entry = ReportService._cache[cache_key]
            assert new_entry['expires_at'] > datetime.now()
            
        finally:
            # Restore original TTL
            ReportService._cache_ttl = original_ttl
    
    def test_cache_key_generation(self, app, db_session):
        """Test cache key generation"""
        key1 = ReportService._get_cache_key('test_view', 1, 10)
        key2 = ReportService._get_cache_key('test_view', 1, 10)
        key3 = ReportService._get_cache_key('test_view', 2, 10)
        
        # Same parameters should generate same key
        assert key1 == key2
        
        # Different parameters should generate different keys
        assert key1 != key3
    
    def test_cache_validity_check(self, app, db_session):
        """Test cache validity checking"""
        # Create a cache entry that's still valid
        valid_entry = {
            'data': {'test': 'data'},
            'expires_at': datetime.now() + timedelta(seconds=30)
        }
        
        # Create a cache entry that's expired
        expired_entry = {
            'data': {'test': 'data'},
            'expires_at': datetime.now() - timedelta(seconds=30)
        }
        
        assert ReportService._is_cache_valid(valid_entry) is True
        assert ReportService._is_cache_valid(expired_entry) is False
    
    def test_clear_cache(self, app, db_session):
        """Test cache clearing functionality"""
        # Clear cache first to ensure clean state
        ReportService.clear_cache()
        
        # Add some entries to cache
        ReportService._set_cache('test_key_1', {'data': 'test1'})
        ReportService._set_cache('test_key_2', {'data': 'test2'})
        
        # Verify cache has entries
        assert len(ReportService._cache) == 2
        
        # Clear cache
        ReportService.clear_cache()
        
        # Verify cache is empty
        assert len(ReportService._cache) == 0
    
    def test_pagination_parameters(self, app, db_session):
        """Test different pagination parameters"""
        # Clear cache first
        ReportService.clear_cache()
        
        # Create test data using helper functions
        genre = create_test_genre(db_session)
        
        # Test different page sizes
        genres_small, pagination_small = ReportService.get_genres_with_song_count(page=1, limit=5)
        genres_large, pagination_large = ReportService.get_genres_with_song_count(page=1, limit=20)
        
        assert pagination_small['per_page'] == 5
        assert pagination_large['per_page'] == 20
        
        # Test different pages
        genres_page1, pagination_page1 = ReportService.get_genres_with_song_count(page=1, limit=10)
        genres_page2, pagination_page2 = ReportService.get_genres_with_song_count(page=2, limit=10)
        
        assert pagination_page1['page'] == 1
        assert pagination_page2['page'] == 2