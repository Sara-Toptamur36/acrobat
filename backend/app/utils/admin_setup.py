"""
Admin user setup utility
"""
from flask import current_app
from app import db
from app.models.user import User

def create_default_admin():
    """Create default admin user if it doesn't exist"""
    try:
        admin_email = current_app.config['ADMIN_EMAIL']
        admin_username = current_app.config['ADMIN_USERNAME']
        admin_password = current_app.config['ADMIN_PASSWORD']
        
        # Check if admin user already exists
        existing_admin = User.query.filter(
            (User.email == admin_email) | (User.username == admin_username)
        ).first()
        
        if existing_admin:
            current_app.logger.info(f'Admin user already exists: {existing_admin.username}')
            return
        
        # Create admin user
        admin_user = User(
            username=admin_username,
            email=admin_email,
            role='admin'
        )
        admin_user.set_password(admin_password)
        
        db.session.add(admin_user)
        db.session.commit()
        
        current_app.logger.info(f'Created admin user: {admin_username} ({admin_email})')
        
    except Exception as e:
        current_app.logger.error(f'Failed to create admin user: {str(e)}')
        db.session.rollback()