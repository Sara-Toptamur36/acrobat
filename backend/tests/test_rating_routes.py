"""
Integration tests for rating routes - Critical edge cases
"""
import pytest
from app import db
from app.models import User, Song, Album, Artist, RatingComment

class TestRatingRoutes:
    """Test rating API endpoints"""
    
    def test_create_rating_success(self, client, auth_headers, sample_data):
        """Test successful rating creation"""
        # Debug: Print sample_data and auth_headers
        print(f"Sample data: {sample_data}")
        print(f"Auth headers: {auth_headers}")
        
        response = client.post(f'/api/songs/{sample_data["song_id"]}/rating',
                             headers=auth_headers,
                             json={'rating': 8.5, 'comment': 'Great song!'})
        
        # Debug: Print response details
        print(f"Response status: {response.status_code}")
        print(f"Response data: {response.get_json()}")
        print(f"Response headers: {dict(response.headers)}")
        
        assert response.status_code == 201
        data = response.json
        assert data['success'] is True
        assert data['data']['rating'] == 8.5
        assert data['data']['comment'] == 'Great song!'
        assert data['data']['song_id'] == sample_data['song_id']
        assert data['data']['song_id'] == sample_data['song_id']
    
    def test_create_rating_only_rating(self, client, auth_headers, sample_data):
        """Test creating rating without comment"""
        response = client.post(f'/api/songs/{sample_data["song_id"]}/rating',
                             headers=auth_headers,
                             json={'rating': 7.0})
        
        assert response.status_code == 201
        data = response.json
        assert data['data']['rating'] == 7.0
        assert data['data']['comment'] is None
    
    def test_create_rating_only_comment(self, client, auth_headers, sample_data):
        """Test creating comment without rating"""
        response = client.post(f'/api/songs/{sample_data["song_id"]}/rating',
                             headers=auth_headers,
                             json={'comment': 'Nice melody!'})
        
        assert response.status_code == 201
        data = response.json
        assert data['data']['rating'] is None
        assert data['data']['comment'] == 'Nice melody!'
    
    def test_create_rating_validation_errors(self, client, auth_headers, sample_data):
        """Test rating creation validation"""
        # Test no rating and no comment
        response = client.post(f'/api/songs/{sample_data["song_id"]}/rating',
                             headers=auth_headers,
                             json={})
        
        assert response.status_code == 400
        assert response.json['error']['code'] == 'VALIDATION_ERROR'
        assert 'Either rating or comment must be provided' in response.json['error']['message']
        
        # Test rating out of range - too low
        response = client.post(f'/api/songs/{sample_data["song_id"]}/rating',
                             headers=auth_headers,
                             json={'rating': -1.0})
        
        assert response.status_code == 400
        assert 'Rating must be between 0.0 and 10.0' in response.json['error']['message']
        
        # Test rating out of range - too high
        response = client.post(f'/api/songs/{sample_data["song_id"]}/rating',
                             headers=auth_headers,
                             json={'rating': 11.0})
        
        assert response.status_code == 400
        assert 'Rating must be between 0.0 and 10.0' in response.json['error']['message']
    
    def test_create_rating_nonexistent_song(self, client, auth_headers):
        """Test rating creation with nonexistent song"""
        response = client.post('/api/songs/999/rating',
                             headers=auth_headers,
                             json={'rating': 8.0})
        
        assert response.status_code == 404
        assert 'Song not found' in response.json['error']['message']
    
    def test_create_rating_duplicate_prevention(self, client, auth_headers, sample_data):
        """Test prevention of duplicate ratings by same user for same song"""
        # Create first rating
        response1 = client.post(f'/api/songs/{sample_data["song_id"]}/rating',
                              headers=auth_headers,
                              json={'rating': 8.0})
        assert response1.status_code == 201
        
        # Try to create second rating for same song
        response2 = client.post(f'/api/songs/{sample_data["song_id"]}/rating',
                              headers=auth_headers,
                              json={'rating': 9.0})
        
        assert response2.status_code == 409
        assert response2.json['error']['code'] == 'DUPLICATE_VALUE'
        assert 'already rated' in response2.json['error']['message']
    
    def test_create_rating_unauthorized(self, client, sample_data):
        """Test rating creation without authentication"""
        response = client.post(f'/api/songs/{sample_data["song_id"]}/rating',
                             json={'rating': 8.0})
        
        assert response.status_code == 401
    
    def test_update_rating_success(self, client, auth_headers, sample_data):
        """Test successful rating update"""
        # Create initial rating
        client.post(f'/api/songs/{sample_data["song_id"]}/rating',
                   headers=auth_headers,
                   json={'rating': 7.0, 'comment': 'Good song'})
        
        # Update rating
        response = client.put(f'/api/songs/{sample_data["song_id"]}/rating',
                            headers=auth_headers,
                            json={'rating': 9.0, 'comment': 'Actually, great song!'})
        
        assert response.status_code == 200
        data = response.json
        assert data['data']['rating'] == 9.0
        assert data['data']['comment'] == 'Actually, great song!'
    
    def test_update_rating_nonexistent(self, client, auth_headers, sample_data):
        """Test updating nonexistent rating"""
        response = client.put(f'/api/songs/{sample_data["song_id"]}/rating',
                            headers=auth_headers,
                            json={'rating': 8.0})
        
        assert response.status_code == 404
        assert 'Rating not found' in response.json['error']['message']
    
    def test_update_rating_clear_rating(self, client, auth_headers, sample_data):
        """Test clearing rating while keeping comment"""
        # Create initial rating with both rating and comment
        client.post(f'/api/songs/{sample_data["song_id"]}/rating',
                   headers=auth_headers,
                   json={'rating': 7.0, 'comment': 'Good song'})
        
        # Update to clear rating but keep comment
        response = client.put(f'/api/songs/{sample_data["song_id"]}/rating',
                            headers=auth_headers,
                            json={'comment': 'Just a comment now'})
        
        assert response.status_code == 200
        data = response.json
        assert data['data']['rating'] is None
        assert data['data']['comment'] == 'Just a comment now'
    
    def test_delete_rating_success(self, client, auth_headers, sample_data):
        """Test successful rating deletion"""
        # Create rating
        client.post(f'/api/songs/{sample_data["song_id"]}/rating',
                   headers=auth_headers,
                   json={'rating': 8.0})
        
        # Delete rating
        response = client.delete(f'/api/songs/{sample_data["song_id"]}/rating',
                               headers=auth_headers)
        
        assert response.status_code == 200
        assert 'deleted successfully' in response.json['data']['message']
    
    def test_delete_rating_nonexistent(self, client, auth_headers, sample_data):
        """Test deleting nonexistent rating"""
        response = client.delete(f'/api/songs/{sample_data["song_id"]}/rating',
                               headers=auth_headers)
        
        assert response.status_code == 404
        assert 'Rating not found' in response.json['error']['message']
    
    def test_get_song_ratings_success(self, client, sample_data):
        """Test getting all ratings for a song (public endpoint)"""
        response = client.get(f'/api/songs/{sample_data["song_id"]}/ratings')
        
        assert response.status_code == 200
        data = response.json
        assert 'song' in data['data']
        assert 'ratings' in data['data']
        assert 'pagination' in data['data']
        assert data['data']['song']['song_id'] == sample_data['song_id']
    
    def test_get_song_ratings_nonexistent_song(self, client):
        """Test getting ratings for nonexistent song"""
        response = client.get('/api/songs/999/ratings')
        
        assert response.status_code == 404
        assert 'Song not found' in response.json['error']['message']
    
    def test_get_song_ratings_pagination(self, client, auth_headers, sample_data):
        """Test rating pagination"""
        # Create multiple ratings from different users
        for i in range(5):
            user = User(username=f'user{i}', email=f'user{i}@example.com')
            user.password_hash = "test-hash"  # Set required password_hash field
            db.session.add(user)
            db.session.commit()
            
            rating = RatingComment(
                user_id=user.user_id,
                song_id=sample_data['song_id'],
                rating=8.0 + i * 0.2,
                comment=f'Comment {i}'
            )
            db.session.add(rating)
        
        db.session.commit()
        
        # Test pagination
        response = client.get(f'/api/songs/{sample_data["song_id"]}/ratings?page=1&limit=3')
        
        assert response.status_code == 200
        data = response.json
        assert len(data['data']['ratings']) <= 3
        assert data['data']['pagination']['page'] == 1
        assert data['data']['pagination']['per_page'] == 3
    
    def test_rating_precision_handling(self, client, auth_headers, sample_data):
        """Test rating decimal precision handling"""
        response = client.post(f'/api/songs/{sample_data["song_id"]}/rating',
                             headers=auth_headers,
                             json={'rating': 8.75})
        
        assert response.status_code == 201
        data = response.json
        assert data['data']['rating'] == 8.75
    
    def test_rating_invalid_format(self, client, auth_headers, sample_data):
        """Test rating with invalid format"""
        response = client.post(f'/api/songs/{sample_data["song_id"]}/rating',
                             headers=auth_headers,
                             json={'rating': 'invalid'})
        
        assert response.status_code == 400
        assert 'Rating must be a valid number' in response.json['error']['message']