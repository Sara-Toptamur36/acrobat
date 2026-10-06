"""
Admin User Management Routes
"""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app import db
from app.models.user import User
from app.utils.error_handlers import create_error_response, create_success_response
from app.utils.validation import validate_pagination
from app.utils.decorators import admin_required

admin_users_bp = Blueprint('admin_users', __name__)

@admin_users_bp.route('/', methods=['GET'])
@jwt_required()
@admin_required
def get_users():
    """Get all users with pagination and search"""
    page = request.args.get('page', 1)
    limit = request.args.get('limit', 20)
    search = request.args.get('search', '')
    
    page, limit, errors = validate_pagination(page, limit)
    if errors:
        return create_error_response('VALIDATION_ERROR', 'Invalid pagination', 400, details=errors)
    
    query = User.query
    
    if search:
        query = query.filter(User.username.ilike(f'%{search}%') | User.email.ilike(f'%{search}%'))
    
    # Order by newest first
    query = query.order_by(User.created_at.desc())
    
    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    
    users_data = []
    for user in pagination.items:
        data = user.to_dict(include_email=True)
        # Add basic stats
        data['playlist_count'] = user.playlists.count()
        data['review_count'] = user.reviews.count()
        users_data.append(data)
    
    return create_success_response({
        'users': users_data,
        'pagination': {
            'page': page,
            'per_page': limit,
            'total': pagination.total,
            'pages': pagination.pages
        }
    })

@admin_users_bp.route('/<int:user_id>/ban', methods=['POST'])
@jwt_required()
@admin_required
def ban_user(user_id):
    """Ban a user (simplified as delete or flag for now)"""
    # Note: User model doesn't have is_banned column yet.
    # For now, we will just return a placeholder response or potentially delete.
    # The user asked for "Regulation", so maybe "Edit".
    # Implementation of Ban usually requires DB migration.
    # I'll stick to returning success for mock, or implement DELETE.
    return create_error_response('NOT_IMPLEMENTED', 'Ban functionality requires DB schema update', 501)

@admin_users_bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(user_id):
    """Delete a user"""
    user = User.query.get_or_404(user_id)
    if user.is_admin:
        return create_error_response('FORBIDDEN', 'Cannot delete admin user', 403)
        
    db.session.delete(user)
    db.session.commit()
    return create_success_response({'message': 'User deleted successfully'})

@admin_users_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_user(user_id):
    """Update user details"""
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    if 'username' in data:
        # Check uniqueness
        if User.query.filter(User.username == data['username'], User.user_id != user_id).first():
            return create_error_response('CONFLICT', 'Username already taken', 409)
        user.username = data['username']
        
    if 'email' in data:
        if User.query.filter(User.email == data['email'], User.user_id != user_id).first():
            return create_error_response('CONFLICT', 'Email already taken', 409)
        user.email = data['email']
        
    # Potential: is_admin toggle?
    
    db.session.commit()
    return create_success_response(user.to_dict(include_email=True))
