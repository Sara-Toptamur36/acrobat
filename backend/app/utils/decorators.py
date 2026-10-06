"""
Custom decorators for authentication and authorization
"""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.utils.error_handlers import create_error_response

def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        
        # Convert string identity back to integer
        try:
            user_id = int(current_user_id)
            user = db.session.get(User, user_id)
        except (ValueError, TypeError):
            return create_error_response(
                code='AUTH_REQUIRED',
                message='Invalid user identity',
                status=401
            )
        
        if not user:
            return create_error_response(
                code='AUTH_REQUIRED',
                message='User not found',
                status=401
            )
        
        if not user.is_admin:
            return create_error_response(
                code='INSUFFICIENT_PERMISSIONS',
                message='Admin privileges required',
                status=403
            )
        
        return f(*args, **kwargs)
    
    return decorated_function

def get_current_user():
    """Get current authenticated user"""
    current_user_id = get_jwt_identity()
    if current_user_id:
        # Convert string identity back to integer
        try:
            user_id = int(current_user_id)
            return db.session.get(User, user_id)
        except (ValueError, TypeError):
            return None
    return None