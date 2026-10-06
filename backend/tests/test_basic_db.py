"""
Basic database connectivity test
"""
import pytest
from app import create_app, db
from app.models import User

def test_basic_db_connection():
    """Test basic database connection without Hypothesis"""
    app = create_app('testing')
    
    with app.app_context():
        # Create tables
        db.create_all()
        
        # Simple database operation
        user = User(username='testuser123', email='test123@example.com', role='user')
        user.set_password('password123')
        
        db.session.add(user)
        db.session.commit()
        
        # Verify user was created
        found_user = db.session.query(User).filter_by(username='testuser123').first()
        assert found_user is not None
        assert found_user.email == 'test123@example.com'
        
        # Cleanup
        db.session.delete(found_user)
        db.session.commit()
        db.drop_all()