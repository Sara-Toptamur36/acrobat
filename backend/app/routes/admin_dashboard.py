"""
Admin Dashboard Routes
"""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import text, desc
from app import db
from app.models.user import User
from app.models.song import Song
from app.models.album import Album
from app.models.review import Review
from app.utils.error_handlers import create_success_response
from app.utils.decorators import admin_required
from datetime import datetime

admin_dashboard_bp = Blueprint('admin_dashboard', __name__)

@admin_dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
@admin_required
def get_dashboard_stats():
    # Total counts
    user_count = User.query.count()
    song_count = Song.query.count()
    album_count = Album.query.count()
    review_count = Review.query.count()
    total_content = song_count + album_count + review_count

    # Recent Users
    recent_users = User.query.order_by(User.created_at.desc()).limit(5).all()
    recent_users_data = [{
        'type': 'user',
        'message': 'Yeni kullanıcı kaydı',
        'detail': u.username,
        'time': u.created_at.isoformat() if u.created_at else datetime.now().isoformat(),
        'id': u.user_id
    } for u in recent_users]
    
    # Recent Reviews (as activity)
    recent_reviews = Review.query.order_by(Review.updated_at.desc()).limit(5).all()
    recent_reviews_data = [{
        'type': 'review',
        'message': 'Yeni yorum yapıldı',
        'detail': f"{r.user.username} - {r.song.title}",
        'time': r.updated_at.isoformat() if r.updated_at else datetime.now().isoformat()
    } for r in recent_reviews]
    
    # Merge and sort activities
    activities = recent_users_data + recent_reviews_data
    activities.sort(key=lambda x: x['time'], reverse=True)
    activities = activities[:10] # Top 10 mixed
    
    return create_success_response({
        'stats': {
            'total_users': user_count,
            'active_content': total_content,
            'system_load': "Normal", # Placeholder
            'pending_approvals': 0 # Placeholder
        },
        'activities': activities
    })
