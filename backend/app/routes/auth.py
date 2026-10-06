"""
Authentication routes
"""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, create_access_token, get_jwt_identity
from app import db
from app.models.user import User
from app.utils.error_handlers import create_error_response, create_success_response
from app.utils.validation import validate_email, validate_required_fields
from app.utils.decorators import get_current_user

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register new user"""
    data = request.get_json()
    
    if not data:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Request body is required',
            status=400
        )
    
    # Validate required fields
    required_fields = ['username', 'email', 'password']
    field_errors = validate_required_fields(data, required_fields)
    
    # Validate email format
    if 'email' in data and data['email'] and not validate_email(data['email']):
        field_errors.append({'field': 'email', 'message': 'Invalid email format'})
    
    # Validate password length
    if 'password' in data and data['password'] and len(data['password']) < 6:
        field_errors.append({'field': 'password', 'message': 'Password must be at least 6 characters'})
    
    if field_errors:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Invalid input data provided',
            status=400,
            details=field_errors
        )
    
    try:
        # Create new user
        user = User(
            username=data['username'].strip(),
            email=data['email'].strip().lower()
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=str(user.user_id))
        
        return create_success_response({
            'access_token': access_token,
            'user': user.to_dict(include_email=True)
        }, status=201)
        
    except Exception as e:
        db.session.rollback()
        # Let the error handler deal with integrity errors
        raise

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login"""
    data = request.get_json()
    
    if not data:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Request body is required',
            status=400
        )
    
    # Validate required fields
    required_fields = ['email', 'password']
    field_errors = validate_required_fields(data, required_fields)
    
    if field_errors:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Invalid input data provided',
            status=400,
            details=field_errors
        )
    
    # Find user by email
    user = User.query.filter_by(email=data['email'].strip().lower()).first()
    
    if not user or not user.check_password(data['password']):
        return create_error_response(
            code='INVALID_CREDENTIALS',
            message='Invalid email or password',
            status=401
        )
    
    # Create access token
    access_token = create_access_token(identity=str(user.user_id))
    
    return create_success_response({
        'access_token': access_token,
        'user': user.to_dict(include_email=True)
    })

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """User logout (stateless JWT - frontend handles token removal)"""
    return create_success_response({
        'message': 'Successfully logged out'
    })

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    user = get_current_user()
    
    if not user:
        return create_error_response(
            code='AUTH_REQUIRED',
            message='User not found',
            status=401
        )
    
    return create_success_response(user.to_dict(include_email=True))

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update current user profile"""
    user = get_current_user()
    
    if not user:
        return create_error_response(
            code='AUTH_REQUIRED',
            message='User not found',
            status=401
        )
    
    data = request.get_json()
    
    if not data:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Request body is required',
            status=400
        )
    
    field_errors = []
    
    # Validate email format if provided
    if 'email' in data and data['email']:
        if not validate_email(data['email']):
            field_errors.append({'field': 'email', 'message': 'Invalid email format'})
    
    # Validate username if provided
    if 'username' in data and data['username']:
        if not data['username'].strip():
            field_errors.append({'field': 'username', 'message': 'Username cannot be empty'})
    
    if field_errors:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Invalid input data provided',
            status=400,
            details=field_errors
        )
    
    try:
        # Update user fields
        if 'username' in data and data['username']:
            user.username = data['username'].strip()
        
        if 'email' in data and data['email']:
            user.email = data['email'].strip().lower()
        
        db.session.commit()
        
        return create_success_response(user.to_dict(include_email=True))
        
    except Exception as e:
        db.session.rollback()
        # Let the error handler deal with integrity errors
        raise

@auth_bp.route('/profile/password', methods=['PUT'])
@jwt_required()
def update_password():
    """Update current user password"""
    user = get_current_user()
    
    if not user:
        return create_error_response(
            code='AUTH_REQUIRED',
            message='User not found',
            status=401
        )
    
    data = request.get_json()
    
    if not data:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Request body is required',
            status=400
        )
    
    field_errors = validate_required_fields(data, ['current_password', 'new_password'])
    
    # Validate password length
    if 'new_password' in data and data['new_password'] and len(data['new_password']) < 6:
        field_errors.append({'field': 'new_password', 'message': 'New password must be at least 6 characters'})
    
    if field_errors:
        return create_error_response(
            code='VALIDATION_ERROR',
            message='Invalid input data provided',
            status=400,
            details=field_errors
        )
    
    if not user.check_password(data['current_password']):
        return create_error_response(
            code='INVALID_CREDENTIALS',
            message='Current password is incorrect',
            status=401
        )
    
    try:
        user.set_password(data['new_password'])
        db.session.commit()
        return create_success_response({'message': 'Password updated successfully'})
    except Exception as e:
        db.session.rollback()
        raise