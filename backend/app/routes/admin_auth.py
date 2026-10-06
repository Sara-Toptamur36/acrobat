"""
Admin Authentication Routes
"""
from flask import Blueprint, request
from flask_jwt_extended import create_access_token
from app import db
from app.models.user import User
from app.utils.error_handlers import create_error_response, create_success_response
from app.utils.validation import validate_required_fields

admin_auth_bp = Blueprint('admin_auth', __name__)

@admin_auth_bp.route('/login', methods=['POST'])
def admin_login():
    """Admin login"""
    data = request.get_json()
    
    if not data:
        return create_error_response('VALIDATION_ERROR', 'Request body is required', 400)
    
    # Validate required fields
    required_fields = ['email', 'password']
    field_errors = validate_required_fields(data, required_fields)
    
    if field_errors:
        return create_error_response('VALIDATION_ERROR', 'Invalid input data', 400, details=field_errors)
    
    # Find user by email
    user = User.query.filter_by(email=data['email'].strip().lower()).first()
    
    # Check credentials AND admin status
    if not user or not user.check_password(data['password']):
        return create_error_response('INVALID_CREDENTIALS', 'Invalid email or password', 401)
        
    if not user.is_admin and user.role != 'admin':
        return create_error_response('FORBIDDEN', 'Access denied. Admin privileges required.', 403)
    
    # Create access token
    access_token = create_access_token(identity=str(user.user_id))
    
    return create_success_response({
        'access_token': access_token,
        'user': user.to_dict(include_email=True)
    })
