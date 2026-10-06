"""
Unit tests for PlaylistService - Critical edge cases
"""
import pytest
from sqlalchemy.exc import IntegrityError
from app import db
from app.models import User, Playlist, PlaylistSong, Song, Album, Artist
from app.services.playlist_service import PlaylistService
from tests.conftest import create_test_user, create_test_artist, create_test_album, create_test_song, create_test_playlist

class TestPlaylistService:
    """Test PlaylistService business logic"""
    
    def test_create_playlist_success(self, app, db_session):
        """Test successful playlist creation"""
        # Create user using helper function for unique names
        user = create_test_user(db_session)
        
        # Create playlist
        result = PlaylistService.create_playlist(user.user_id, 'My Playlist')
        
        assert result['name'] == 'My Playlist'
        assert result['user_id'] == user.user_id
        assert 'playlist_id' in result
    
    def test_create_playlist_empty_name(self, app, db_session):
        """Test playlist creation with empty name"""
        # Create user using helper function for unique names
        user = create_test_user(db_session)
        
        # Test empty name
        with pytest.raises(ValueError, match="Playlist name is required"):
            PlaylistService.create_playlist(user.user_id, '')
        
        # Test whitespace only
        with pytest.raises(ValueError, match="Playlist name is required"):
            PlaylistService.create_playlist(user.user_id, '   ')
    
    def test_create_playlist_nonexistent_user(self, app, db_session):
        """Test playlist creation with nonexistent user"""
        with pytest.raises(ValueError, match="User not found"):
            PlaylistService.create_playlist(999, 'My Playlist')
    
    def test_get_playlist_access_control(self, app, db_session):
        """Test playlist access control - users can only access their own playlists"""
        # Create two users using helper functions for unique names
        user1 = create_test_user(db_session)
        user2 = create_test_user(db_session)
        
        # User1 creates playlist
        playlist = create_test_playlist(db_session, user_id=user1.user_id, name='User1 Playlist')
        
        # User1 can access their playlist
        result = PlaylistService.get_playlist(playlist.playlist_id, user1.user_id)
        assert result['name'] == 'User1 Playlist'
        
        # User2 cannot access user1's playlist
        with pytest.raises(ValueError, match="Playlist not found or access denied"):
            PlaylistService.get_playlist(playlist.playlist_id, user2.user_id)
    
    def test_add_song_duplicate_prevention(self, app, db_session):
        """Test prevention of duplicate songs in playlist"""
        # Create test data using helper functions
        user = create_test_user(db_session)
        artist = create_test_artist(db_session)
        album = create_test_album(db_session, artist_id=artist.artist_id)
        song = create_test_song(db_session, album_id=album.album_id)
        playlist = create_test_playlist(db_session, user_id=user.user_id)
        
        # Add song first time - should succeed
        result = PlaylistService.add_song_to_playlist(
            playlist.playlist_id, user.user_id, song.song_id
        )
        assert result['song_id'] == song.song_id
        assert result['position'] == 1
        
        # Try to add same song again - should raise IntegrityError
        with pytest.raises(IntegrityError):
            PlaylistService.add_song_to_playlist(
                playlist.playlist_id, user.user_id, song.song_id
            )
    
    def test_add_song_nonexistent_song(self, app, db_session):
        """Test adding nonexistent song to playlist"""
        user = create_test_user(db_session)
        playlist = create_test_playlist(db_session, user_id=user.user_id)
        
        with pytest.raises(ValueError, match="Song not found"):
            PlaylistService.add_song_to_playlist(
                playlist.playlist_id, user.user_id, 999
            )
    
    def test_add_song_access_control(self, app, db_session):
        """Test adding song to playlist - access control"""
        # Create two users and test data using helper functions
        user1 = create_test_user(db_session)
        user2 = create_test_user(db_session)
        artist = create_test_artist(db_session)
        album = create_test_album(db_session, artist_id=artist.artist_id)
        song = create_test_song(db_session, album_id=album.album_id)
        playlist = create_test_playlist(db_session, user_id=user1.user_id)  # Belongs to user1
        
        # User2 tries to add song to user1's playlist - should fail
        with pytest.raises(ValueError, match="Playlist not found or access denied"):
            PlaylistService.add_song_to_playlist(
                playlist.playlist_id, user2.user_id, song.song_id
            )
    
    def test_reorder_playlist_validation(self, app, db_session):
        """Test playlist reordering validation"""
        user = create_test_user(db_session)
        playlist = create_test_playlist(db_session, user_id=user.user_id)
        
        # Test empty items list
        with pytest.raises(ValueError, match="Items list is required"):
            PlaylistService.reorder_playlist(playlist.playlist_id, user.user_id, [])
        
        # Test invalid item format - missing song_id
        with pytest.raises(ValueError, match="Each item must have song_id and position"):
            PlaylistService.reorder_playlist(
                playlist.playlist_id, user.user_id, 
                [{'position': 1}]
            )
        
        # Test invalid item format - missing position
        with pytest.raises(ValueError, match="Each item must have song_id and position"):
            PlaylistService.reorder_playlist(
                playlist.playlist_id, user.user_id, 
                [{'song_id': 1}]
            )
        
        # Test invalid position value
        with pytest.raises(ValueError, match="Position must be a positive integer"):
            PlaylistService.reorder_playlist(
                playlist.playlist_id, user.user_id, 
                [{'song_id': 1, 'position': 0}]
            )
    
    def test_reorder_playlist_nonexistent_song(self, app, db_session):
        """Test reordering with nonexistent song in playlist"""
        user = create_test_user(db_session)
        playlist = create_test_playlist(db_session, user_id=user.user_id)
        
        # Try to reorder with song not in playlist
        with pytest.raises(ValueError, match="Song 999 not found in playlist"):
            PlaylistService.reorder_playlist(
                playlist.playlist_id, user.user_id, 
                [{'song_id': 999, 'position': 1}]
            )
    
    def test_delete_playlist_access_control(self, app, db_session):
        """Test playlist deletion access control"""
        # Create two users using helper functions
        user1 = create_test_user(db_session)
        user2 = create_test_user(db_session)
        playlist = create_test_playlist(db_session, user_id=user1.user_id)
        
        # User2 tries to delete user1's playlist - should fail
        with pytest.raises(ValueError, match="Playlist not found or access denied"):
            PlaylistService.delete_playlist(playlist.playlist_id, user2.user_id)
        
        # User1 can delete their own playlist - should succeed
        result = PlaylistService.delete_playlist(playlist.playlist_id, user1.user_id)
        assert result is True
        
        # Verify playlist is deleted
        deleted_playlist = db.session.get(Playlist, playlist.playlist_id)
        assert deleted_playlist is None