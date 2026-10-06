"""
Integration tests for report routes
"""
import pytest
from app import db
from app.models import User, Artist, Album, Song, Genre, Playlist, PlaylistSong, RatingComment
from app.services.report_service import ReportService

class TestReportRoutes:
    """Test report API endpoints"""
    
    def test_get_genres_report_success(self, client, auth_headers, sample_data):
        """Test successful genre statistics retrieval"""
        response = client.get('/api/reports/genres',
                            headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json
        assert 'genres' in data['data']
        assert 'pagination' in data['data']
        assert isinstance(data['data']['genres'], list)
    
    def test_get_genres_report_unauthorized(self, client):
        """Test genre statistics without authentication"""
        response = client.get('/api/reports/genres')
        
        assert response.status_code == 401
    
    def test_get_genres_report_pagination(self, client, auth_headers, sample_data):
        """Test genre statistics pagination"""
        response = client.get('/api/reports/genres?page=1&limit=5',
                            headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json
        assert data['data']['pagination']['page'] == 1
        assert data['data']['pagination']['per_page'] == 5
    
    def test_get_albums_by_year_success(self, client, auth_headers, sample_data):
        """Test successful album release statistics retrieval"""
        response = client.get('/api/reports/albums-by-year',
                            headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json
        assert 'release_statistics' in data['data']
        assert 'pagination' in data['data']
        assert isinstance(data['data']['release_statistics'], list)
    
    def test_get_albums_by_year_unauthorized(self, client):
        """Test album statistics without authentication"""
        response = client.get('/api/reports/albums-by-year')
        
        assert response.status_code == 401
    
    def test_get_albums_by_year_pagination(self, client, auth_headers, sample_data):
        """Test album statistics pagination"""
        response = client.get('/api/reports/albums-by-year?page=1&limit=10',
                            headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json
        assert data['data']['pagination']['page'] == 1
        assert data['data']['pagination']['per_page'] == 10
    
    def test_get_active_users_success(self, client, auth_headers, sample_data):
        """Test successful active users retrieval"""
        response = client.get('/api/reports/active-users',
                            headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json
        assert 'users' in data['data']
        assert 'pagination' in data['data']
        assert isinstance(data['data']['users'], list)
    
    def test_get_active_users_unauthorized(self, client):
        """Test active users without authentication"""
        response = client.get('/api/reports/active-users')
        
        assert response.status_code == 401
    
    def test_get_active_users_pagination(self, client, auth_headers, sample_data):
        """Test active users pagination"""
        response = client.get('/api/reports/active-users?page=1&limit=15',
                            headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json
        assert data['data']['pagination']['page'] == 1
        assert data['data']['pagination']['per_page'] == 15
    
    def test_get_top_songs_success(self, client, auth_headers, sample_data):
        """Test successful top songs retrieval"""
        # Create a rating for the sample song
        user = User.query.filter_by(email='test@example.com').first()
        rating = RatingComment(
            user_id=user.user_id,
            song_id=sample_data['song_id'],
            rating=9.5,
            comment='Amazing song!'
        )
        db.session.add(rating)
        db.session.commit()
        
        response = client.get('/api/reports/top-songs',
                            headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json
        assert 'songs' in data['data']
        assert 'pagination' in data['data']
        assert isinstance(data['data']['songs'], list)
    
    def test_get_top_songs_unauthorized(self, client):
        """Test top songs without authentication"""
        response = client.get('/api/reports/top-songs')
        
        assert response.status_code == 401
    
    def test_get_top_songs_pagination(self, client, auth_headers, sample_data):
        """Test top songs pagination"""
        # Create a rating for the sample song
        user = User.query.filter_by(email='test@example.com').first()
        rating = RatingComment(
            user_id=user.user_id,
            song_id=sample_data['song_id'],
            rating=8.5,
            comment='Great song!'
        )
        db.session.add(rating)
        db.session.commit()
        
        response = client.get('/api/reports/top-songs?page=1&limit=10',
                            headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json
        assert data['data']['pagination']['page'] == 1
        assert data['data']['pagination']['per_page'] == 10
    
    def test_invalid_pagination_parameters(self, client, auth_headers):
        """Test reports with invalid pagination parameters"""
        # Test invalid page
        response = client.get('/api/reports/genres?page=0',
                            headers=auth_headers)
        assert response.status_code == 400
        
        # Test invalid limit
        response = client.get('/api/reports/genres?limit=0',
                            headers=auth_headers)
        assert response.status_code == 400
        
        # Test limit too large
        response = client.get('/api/reports/genres?limit=1000',
                            headers=auth_headers)
        assert response.status_code == 400
    
    def test_report_caching(self, client, auth_headers, sample_data):
        """Test that report caching works correctly"""
        # Clear cache first
        ReportService.clear_cache()
        
        # First request - should hit database
        response1 = client.get('/api/reports/genres?page=1&limit=10',
                             headers=auth_headers)
        assert response1.status_code == 200
        
        # Second request - should hit cache
        response2 = client.get('/api/reports/genres?page=1&limit=10',
                             headers=auth_headers)
        assert response2.status_code == 200
        
        # Results should be identical
        assert response1.json['data'] == response2.json['data']
    
    def test_genre_report_data_structure(self, client, auth_headers, sample_data):
        """Test genre report data structure"""
        response = client.get('/api/reports/genres',
                            headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json
        
        if len(data['data']['genres']) > 0:
            genre = data['data']['genres'][0]
            assert 'genre_id' in genre
            assert 'genre_name' in genre
            assert 'song_count' in genre
            assert 'avg_genre_rating' in genre
    
    def test_album_report_data_structure(self, client, auth_headers, sample_data):
        """Test album report data structure"""
        response = client.get('/api/reports/albums-by-year',
                            headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json
        
        if len(data['data']['release_statistics']) > 0:
            stat = data['data']['release_statistics'][0]
            assert 'release_year' in stat
            assert 'album_count' in stat
            assert 'unique_artists' in stat
            assert 'avg_songs_per_album' in stat
            assert 'avg_album_duration' in stat
    
    def test_active_users_report_data_structure(self, client, auth_headers, sample_data):
        """Test active users report data structure"""
        response = client.get('/api/reports/active-users',
                            headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json
        
        if len(data['data']['users']) > 0:
            user = data['data']['users'][0]
            assert 'user_id' in user
            assert 'username' in user
            assert 'playlist_count' in user
            assert 'rating_comment_count' in user
            assert 'unique_songs_in_playlists' in user
            assert 'activity_score' in user
    
    def test_top_songs_report_data_structure(self, client, auth_headers, sample_data):
        """Test top songs report data structure"""
        # Create a rating for the sample song
        user = User.query.filter_by(email='test@example.com').first()
        rating = RatingComment(
            user_id=user.user_id,
            song_id=sample_data['song_id'],
            rating=9.0,
            comment='Excellent!'
        )
        db.session.add(rating)
        db.session.commit()
        
        response = client.get('/api/reports/top-songs',
                            headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json
        
        if len(data['data']['songs']) > 0:
            song = data['data']['songs'][0]
            assert 'song_id' in song
            assert 'song_title' in song
            assert 'album_title' in song
            assert 'artist_name' in song
            assert 'genre_name' in song
            assert 'average_rating' in song
            assert 'rating_count' in song
            assert 'duration' in song