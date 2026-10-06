"""
Unit tests for RatingService - Critical edge cases
"""
import pytest
from decimal import Decimal
from app import db
from app.models import User, Song, Album, Artist, RatingComment
from app.services.rating_service import RatingService
from tests.conftest import create_test_user, create_test_artist, create_test_album, create_test_song

class TestRatingService:
    """Test RatingService business logic"""
    
    def test_create_rating_success(self, app, db_session):
        """Test successful rating creation"""
        # Create test data using helper functions
        user = create_test_user(db_session)
        artist = create_test_artist(db_session)
        album = create_test_album(db_session, artist_id=artist.artist_id)
        song = create_test_song(db_session, album_id=album.album_id)
        
        # Create rating with both rating and comment
        result = RatingService.create_rating(
            user.user_id, song.song_id, 8.5, 'Great song!'
        )
        
        assert result['rating'] == 8.5
        assert result['comment'] == 'Great song!'
        assert result['user_id'] == user.user_id
        assert result['song_id'] == song.song_id
    
    def test_create_rating_only_rating(self, app, db_session):
        """Test creating rating without comment"""
        # Create test data using helper functions
        user = create_test_user(db_session)
        artist = create_test_artist(db_session)
        album = create_test_album(db_session, artist_id=artist.artist_id)
        song = create_test_song(db_session, album_id=album.album_id)
        
        # Create rating only
        result = RatingService.create_rating(user.user_id, song.song_id, 7.0)
        
        assert result['rating'] == 7.0
        assert result['comment'] is None
    
    def test_create_rating_only_comment(self, app, db_session):
        """Test creating comment without rating"""
        # Create test data using helper functions
        user = create_test_user(db_session)
        artist = create_test_artist(db_session)
        album = create_test_album(db_session, artist_id=artist.artist_id)
        song = create_test_song(db_session, album_id=album.album_id)
        
        # Create comment only
        result = RatingService.create_rating(
            user.user_id, song.song_id, None, 'Nice melody!'
        )
        
        assert result['rating'] is None
        assert result['comment'] == 'Nice melody!'
    
    def test_create_rating_validation_errors(self, app, db_session):
        """Test rating creation validation"""
        # Create test data using helper functions
        user = create_test_user(db_session)
        artist = create_test_artist(db_session)
        album = create_test_album(db_session, artist_id=artist.artist_id)
        song = create_test_song(db_session, album_id=album.album_id)
        
        # Test no rating and no comment
        with pytest.raises(ValueError, match="Either rating or comment must be provided"):
            RatingService.create_rating(user.user_id, song.song_id)
        
        # Test no rating and empty comment
        with pytest.raises(ValueError, match="Either rating or comment must be provided"):
            RatingService.create_rating(user.user_id, song.song_id, None, '   ')
        
        # Test rating out of range - too low
        with pytest.raises(ValueError, match="Rating must be between 0.0 and 10.0"):
            RatingService.create_rating(user.user_id, song.song_id, -1.0)
        
        # Test rating out of range - too high
        with pytest.raises(ValueError, match="Rating must be between 0.0 and 10.0"):
            RatingService.create_rating(user.user_id, song.song_id, 11.0)
    
    def test_create_rating_nonexistent_user(self, app, db_session):
        """Test rating creation with nonexistent user"""
        # Create test data using helper functions
        artist = create_test_artist(db_session)
        album = create_test_album(db_session, artist_id=artist.artist_id)
        song = create_test_song(db_session, album_id=album.album_id)
        
        with pytest.raises(ValueError, match="User not found"):
            RatingService.create_rating(999, song.song_id, 8.0)
    
    def test_create_rating_nonexistent_song(self, app, db_session):
        """Test rating creation with nonexistent song"""
        # Create test data using helper functions
        user = create_test_user(db_session)
        
        with pytest.raises(ValueError, match="Song not found"):
            RatingService.create_rating(user.user_id, 999, 8.0)
    
    def test_create_rating_duplicate_prevention(self, app, db_session):
        """Test prevention of duplicate ratings by same user for same song"""
        # Create test data using helper functions
        user = create_test_user(db_session)
        artist = create_test_artist(db_session)
        album = create_test_album(db_session, artist_id=artist.artist_id)
        song = create_test_song(db_session, album_id=album.album_id)
        
        # Create first rating - should succeed
        result1 = RatingService.create_rating(user.user_id, song.song_id, 8.0)
        assert result1['rating'] == 8.0
        
        # Try to create second rating for same song - should fail
        with pytest.raises(ValueError, match="User has already rated this song"):
            RatingService.create_rating(user.user_id, song.song_id, 9.0)
    
    def test_update_rating_success(self, app, db_session):
        """Test successful rating update"""
        # Create test data using helper functions
        user = create_test_user(db_session)
        artist = create_test_artist(db_session)
        album = create_test_album(db_session, artist_id=artist.artist_id)
        song = create_test_song(db_session, album_id=album.album_id)
        
        # Create initial rating
        RatingService.create_rating(user.user_id, song.song_id, 7.0, 'Good song')
        
        # Update rating
        result = RatingService.update_rating(
            user.user_id, song.song_id, 9.0, 'Actually, great song!'
        )
        
        assert result['rating'] == 9.0
        assert result['comment'] == 'Actually, great song!'
    
    def test_update_rating_nonexistent(self, app, db_session):
        """Test updating nonexistent rating"""
        # Create test data using helper functions
        user = create_test_user(db_session)
        artist = create_test_artist(db_session)
        album = create_test_album(db_session, artist_id=artist.artist_id)
        song = create_test_song(db_session, album_id=album.album_id)
        
        # Try to update rating that doesn't exist
        with pytest.raises(ValueError, match="Rating not found"):
            RatingService.update_rating(user.user_id, song.song_id, 8.0)
    
    def test_update_rating_clear_rating(self, app, db_session):
        """Test clearing rating while keeping comment"""
        # Create test data using helper functions
        user = create_test_user(db_session)
        artist = create_test_artist(db_session)
        album = create_test_album(db_session, artist_id=artist.artist_id)
        song = create_test_song(db_session, album_id=album.album_id)
        
        # Create initial rating with both rating and comment
        RatingService.create_rating(user.user_id, song.song_id, 7.0, 'Good song')
        
        # Update to clear rating but keep comment
        result = RatingService.update_rating(
            user.user_id, song.song_id, None, 'Just a comment now'
        )
        
        assert result['rating'] is None
        assert result['comment'] == 'Just a comment now'
    
    def test_delete_rating_success(self, app, db_session):
        """Test successful rating deletion"""
        # Create test data using helper functions
        user = create_test_user(db_session)
        artist = create_test_artist(db_session)
        album = create_test_album(db_session, artist_id=artist.artist_id)
        song = create_test_song(db_session, album_id=album.album_id)
        
        # Create rating
        RatingService.create_rating(user.user_id, song.song_id, 8.0)
        
        # Delete rating
        result = RatingService.delete_rating(user.user_id, song.song_id)
        assert result is True
        
        # Verify rating is deleted
        deleted_rating = RatingComment.query.filter_by(
            user_id=user.user_id, song_id=song.song_id
        ).first()
        assert deleted_rating is None
    
    def test_delete_rating_nonexistent(self, app, db_session):
        """Test deleting nonexistent rating"""
        # Create test data using helper functions
        user = create_test_user(db_session)
        artist = create_test_artist(db_session)
        album = create_test_album(db_session, artist_id=artist.artist_id)
        song = create_test_song(db_session, album_id=album.album_id)
        
        # Try to delete rating that doesn't exist
        with pytest.raises(ValueError, match="Rating not found"):
            RatingService.delete_rating(user.user_id, song.song_id)
    
    def test_get_song_ratings_nonexistent_song(self, app, db_session):
        """Test getting ratings for nonexistent song"""
        with pytest.raises(ValueError, match="Song not found"):
            RatingService.get_song_ratings(999)
    
    def test_rating_precision(self, app, db_session):
        """Test rating decimal precision handling"""
        # Create test data using helper functions
        user = create_test_user(db_session)
        artist = create_test_artist(db_session)
        album = create_test_album(db_session, artist_id=artist.artist_id)
        song = create_test_song(db_session, album_id=album.album_id)
        
        # Test precise decimal rating
        result = RatingService.create_rating(user.user_id, song.song_id, 8.75)
        assert result['rating'] == 8.75
        
        # Verify in database
        rating_record = RatingComment.query.filter_by(
            user_id=user.user_id, song_id=song.song_id
        ).first()
        assert float(rating_record.rating) == 8.75