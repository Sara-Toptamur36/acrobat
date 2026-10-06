"""
Integration tests for playlist routes - Critical edge cases
"""
import pytest
import json
from app import db
from app.models import User, Playlist, PlaylistSong, Song, Album, Artist

class TestPlaylistRoutes:
    """Test playlist API endpoints"""
    
    def test_create_playlist_success(self, client, auth_headers):
        """Test successful playlist creation"""
        response = client.post('/api/playlists', 
                             headers=auth_headers,
                             json={'name': 'My Test Playlist'})
        
        assert response.status_code == 201
        data = response.json
        assert data['success'] is True
        assert data['data']['name'] == 'My Test Playlist'
        assert 'playlist_id' in data['data']
    
    def test_create_playlist_empty_name(self, client, auth_headers):
        """Test playlist creation with empty name"""
        response = client.post('/api/playlists',
                             headers=auth_headers,
                             json={'name': ''})
        
        assert response.status_code == 400
        data = response.json
        assert data['error']['code'] == 'VALIDATION_ERROR'
        assert 'name' in str(data['error']['details'])
    
    def test_create_playlist_missing_name(self, client, auth_headers):
        """Test playlist creation without name field"""
        response = client.post('/api/playlists',
                             headers=auth_headers,
                             json={})
        
        assert response.status_code == 400
        data = response.json
        assert data['error']['code'] == 'VALIDATION_ERROR'
    
    def test_create_playlist_unauthorized(self, client):
        """Test playlist creation without authentication"""
        response = client.post('/api/playlists',
                             json={'name': 'Test Playlist'})
        
        assert response.status_code == 401
    
    def test_update_playlist_success(self, client, auth_headers, sample_data):
        """Test successful playlist update"""
        # Create playlist first
        create_response = client.post('/api/playlists',
                                    headers=auth_headers,
                                    json={'name': 'Original Name'})
        playlist_id = create_response.json['data']['playlist_id']
        
        # Update playlist
        response = client.put(f'/api/playlists/{playlist_id}',
                            headers=auth_headers,
                            json={'name': 'Updated Name'})
        
        assert response.status_code == 200
        data = response.json
        assert data['data']['name'] == 'Updated Name'
    
    def test_update_playlist_not_owner(self, client, auth_headers):
        """Test updating playlist that user doesn't own"""
        # Create another user's playlist directly in DB
        other_user = User(username='otheruser', email='other@example.com')
        other_user.password_hash = "test-hash"  # Add required password_hash
        db.session.add(other_user)
        db.session.commit()
        
        playlist = Playlist(user_id=other_user.user_id, name='Other User Playlist')
        db.session.add(playlist)
        db.session.commit()
        
        # Try to update other user's playlist
        response = client.put(f'/api/playlists/{playlist.playlist_id}',
                            headers=auth_headers,
                            json={'name': 'Hacked Name'})
        
        assert response.status_code == 404
        assert 'not found or access denied' in response.json['error']['message']
    
    def test_delete_playlist_success(self, client, auth_headers):
        """Test successful playlist deletion"""
        # Create playlist first
        create_response = client.post('/api/playlists',
                                    headers=auth_headers,
                                    json={'name': 'To Be Deleted'})
        playlist_id = create_response.json['data']['playlist_id']
        
        # Delete playlist
        response = client.delete(f'/api/playlists/{playlist_id}',
                               headers=auth_headers)
        
        assert response.status_code == 200
        assert 'deleted successfully' in response.json['data']['message']
    
    def test_add_song_to_playlist_success(self, client, auth_headers, sample_data):
        """Test successfully adding song to playlist"""
        # Create playlist
        create_response = client.post('/api/playlists',
                                    headers=auth_headers,
                                    json={'name': 'Test Playlist'})
        playlist_id = create_response.json['data']['playlist_id']
        
        # Add song to playlist
        response = client.post(f'/api/playlists/{playlist_id}/songs',
                             headers=auth_headers,
                             json={'song_id': sample_data['song_id']})
        
        assert response.status_code == 201
        data = response.json
        assert data['data']['song_id'] == sample_data['song_id']
        assert data['data']['position'] == 1
    
    def test_add_song_duplicate_prevention(self, client, auth_headers, sample_data):
        """Test prevention of duplicate songs in playlist"""
        # Create playlist
        create_response = client.post('/api/playlists',
                                    headers=auth_headers,
                                    json={'name': 'Test Playlist'})
        playlist_id = create_response.json['data']['playlist_id']
        
        # Add song first time
        response1 = client.post(f'/api/playlists/{playlist_id}/songs',
                              headers=auth_headers,
                              json={'song_id': sample_data['song_id']})
        assert response1.status_code == 201
        
        # Try to add same song again
        response2 = client.post(f'/api/playlists/{playlist_id}/songs',
                              headers=auth_headers,
                              json={'song_id': sample_data['song_id']})
        
        assert response2.status_code == 409
        assert response2.json['error']['code'] == 'DUPLICATE_VALUE'
    
    def test_add_song_nonexistent_song(self, client, auth_headers):
        """Test adding nonexistent song to playlist"""
        # Create playlist
        create_response = client.post('/api/playlists',
                                    headers=auth_headers,
                                    json={'name': 'Test Playlist'})
        playlist_id = create_response.json['data']['playlist_id']
        
        # Try to add nonexistent song
        response = client.post(f'/api/playlists/{playlist_id}/songs',
                             headers=auth_headers,
                             json={'song_id': 999})
        
        assert response.status_code == 404
        assert 'Song not found' in response.json['error']['message']
    
    def test_reorder_playlist_success(self, client, auth_headers, sample_data):
        """Test successful playlist reordering"""
        # Create playlist and add multiple songs
        create_response = client.post('/api/playlists',
                                    headers=auth_headers,
                                    json={'name': 'Test Playlist'})
        playlist_id = create_response.json['data']['playlist_id']
        
        # Add song to playlist
        client.post(f'/api/playlists/{playlist_id}/songs',
                   headers=auth_headers,
                   json={'song_id': sample_data['song_id']})
        
        # Reorder playlist
        response = client.put(f'/api/playlists/{playlist_id}/reorder',
                            headers=auth_headers,
                            json={'items': [{'song_id': sample_data['song_id'], 'position': 1}]})
        
        assert response.status_code == 200
        assert 'reordered successfully' in response.json['data']['message']
    
    def test_reorder_playlist_invalid_format(self, client, auth_headers):
        """Test playlist reordering with invalid item format"""
        # Create playlist
        create_response = client.post('/api/playlists',
                                    headers=auth_headers,
                                    json={'name': 'Test Playlist'})
        playlist_id = create_response.json['data']['playlist_id']
        
        # Try to reorder with invalid format
        response = client.put(f'/api/playlists/{playlist_id}/reorder',
                            headers=auth_headers,
                            json={'items': [{'song_id': 1}]})  # Missing position
        
        assert response.status_code == 400
        assert 'song_id and position' in response.json['error']['message']
    
    def test_remove_song_from_playlist_success(self, client, auth_headers, sample_data):
        """Test successfully removing song from playlist"""
        # Create playlist and add song
        create_response = client.post('/api/playlists',
                                    headers=auth_headers,
                                    json={'name': 'Test Playlist'})
        playlist_id = create_response.json['data']['playlist_id']
        
        client.post(f'/api/playlists/{playlist_id}/songs',
                   headers=auth_headers,
                   json={'song_id': sample_data['song_id']})
        
        # Remove song from playlist
        response = client.delete(f'/api/playlists/{playlist_id}/songs/{sample_data["song_id"]}',
                               headers=auth_headers)
        
        assert response.status_code == 200
        assert 'removed from playlist' in response.json['data']['message']
    
    def test_remove_song_not_in_playlist(self, client, auth_headers, sample_data):
        """Test removing song that's not in playlist"""
        # Create empty playlist
        create_response = client.post('/api/playlists',
                                    headers=auth_headers,
                                    json={'name': 'Empty Playlist'})
        playlist_id = create_response.json['data']['playlist_id']
        
        # Try to remove song that's not in playlist
        response = client.delete(f'/api/playlists/{playlist_id}/songs/{sample_data["song_id"]}',
                               headers=auth_headers)
        
        assert response.status_code == 404
        assert 'not found in playlist' in response.json['error']['message']