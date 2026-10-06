"""
Social and Public Profile Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text
from app import db
from app.models.user import User
from app.models.follow import Follow
from app.models.playlist import Playlist
from app.utils.error_handlers import create_error_response, create_success_response

social_bp = Blueprint('social', __name__)

@social_bp.route('/profile/<int:user_id>', methods=['GET'])
def get_public_profile(user_id):
    """Get public profile data for a user"""
    user = User.query.get_or_404(user_id)
    
    # Get current user to check if following
    current_user_id = None
    is_following = False
    try:
        from flask_jwt_extended import verify_jwt_in_request
        verify_jwt_in_request(optional=True)
        current_user_id = get_jwt_identity()
    except:
        pass
    
    if current_user_id:
        is_following = Follow.query.filter_by(
            follower_id=current_user_id, 
            following_id=user_id
        ).first() is not None
    
    # Get public playlists - handle case where is_public might not exist yet in DB or Model
    try:
        # Check if is_public column exists in DB using raw SQL to be safe
        result = db.session.execute(text("SHOW COLUMNS FROM playlists LIKE 'is_public'")).fetchone()
        if result:
            playlists = Playlist.query.filter_by(user_id=user_id, is_public=True).all()
        else:
            # Fallback: model might have it but DB doesn't. 
            # We can't use Playlist.query because it selects all columns including is_public.
            # We'll just return all playlists for this user but manually convert to dict
            # to avoid using the model's to_dict which might access is_public.
            raw_playlists = db.session.query(Playlist.playlist_id, Playlist.name).filter_by(user_id=user_id).all()
            playlists = [{'playlist_id': p.playlist_id, 'name': p.name, 'song_count': 0} for p in raw_playlists]
            return create_success_response({
                'user': {
                    'user_id': user.user_id,
                    'username': user.username,
                    'email': user.email if current_user_id == user_id else None,
                    'created_at': user.created_at.isoformat(),
                    'follower_count': user.followers.count(),
                    'following_count': user.following.count(),
                    'is_following': is_following
                },
                'playlists': playlists
            })
    except Exception as e:
        print(f"Social route warning: {str(e)}")
        playlists = []
    
    return create_success_response({
        'user': {
            'user_id': user.user_id,
            'username': user.username,
            'email': user.email if current_user_id == user_id else None, # Only owner sees email
            'created_at': user.created_at.isoformat(),
            'follower_count': user.followers.count(),
            'following_count': user.following.count(),
            'is_following': is_following,
            'followers': [{'user_id': f.follower.user_id, 'username': f.follower.username} for f in user.followers.limit(50).all()],
            'following': [{'user_id': f.following.user_id, 'username': f.following.username} for f in user.following.limit(50).all()]
        },
        'playlists': [p.to_dict() for p in playlists]
    })

@social_bp.route('/follow/<int:user_id>', methods=['POST'])
@jwt_required()
def follow_user(user_id):
    """Follow a user"""
    follower_id = get_jwt_identity()
    
    if follower_id == user_id:
        return create_error_response('CANNOT_FOLLOW_SELF', 'You cannot follow yourself', 400)
    
    user_to_follow = User.query.get_or_404(user_id)
    
    existing_follow = Follow.query.filter_by(
        follower_id=follower_id, 
        following_id=user_id
    ).first()
    
    if existing_follow:
        # Toggle: Unfollow if already following
        db.session.delete(existing_follow)
        db.session.commit()
        return create_success_response({'is_following': False}, 'Unfollowed successfully')
    
    new_follow = Follow(follower_id=follower_id, following_id=user_id)
    db.session.add(new_follow)
    db.session.commit()
    
    return create_success_response({'is_following': True}, 'Followed successfully')

@social_bp.route('/following', methods=['GET'])
@jwt_required()
def get_following():
    """Get users the current user is following"""
    user_id = get_jwt_identity()
    following = Follow.query.filter_by(follower_id=user_id).all()
    return create_success_response([f.following.username for f in following])

@social_bp.route('/followers', methods=['GET'])
@jwt_required()
def get_followers():
    """Get users following the current user"""
    user_id = get_jwt_identity()
    followers = Follow.query.filter_by(following_id=user_id).all()
    return create_success_response([f.follower.username for f in followers])

@social_bp.route('/search', methods=['GET'])
def search_users():
    """Search for users by username"""
    query_str = request.args.get('search', '').strip()
    limit = request.args.get('limit', 20, type=int)
    
    query = User.query
    if query_str:
        query = query.filter(User.username.ilike(f'%{query_str}%'))
    
    users = query.limit(limit).all()
    return create_success_response([{
        'user_id': u.user_id,
        'username': u.username,
        'follower_count': u.followers.count(),
        'playlist_count': u.playlists.count(),
        'review_count': u.reviews.count()
    } for u in users])
