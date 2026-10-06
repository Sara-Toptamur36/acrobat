"""
Review routes - Aligned with frontend api.js expectations
"""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.services.rating_service import ReviewService
from app.utils.error_handlers import create_error_response, create_success_response
from app.utils.validation import validate_pagination
from app.utils.decorators import get_current_user

ratings_bp = Blueprint('ratings', __name__)

# --- Ratings API (used by ratingsApi in api.js) ---

@ratings_bp.route('/songs/<int:song_id>/ratings', methods=['GET'])
def get_song_ratings_legacy(song_id):
    """Legacy endpoint for compatibility with api.js ratingsApi.getSongRatings"""
    return get_song_reviews(song_id)

@ratings_bp.route('/songs/<int:song_id>/rating', methods=['POST'])
@jwt_required()
def create_song_rating_legacy(song_id):
    """Legacy endpoint for compatibility with api.js ratingsApi.rateSong"""
    return create_review(song_id)

@ratings_bp.route('/songs/<int:song_id>/rating', methods=['PUT'])
@jwt_required()
def update_song_rating_legacy(song_id):
    user = get_current_user()
    data = request.get_json()
    try:
        # Use ReviewService to update based on user_id and song_id
        # We need to ensure ReviewService has update_review method that takes (user_id, song_id, rating, comment)
        review = ReviewService.update_review(user.user_id, song_id, data.get('rating'), data.get('comment'))
        return create_success_response(review)
    except ValueError as e:
        print(f"Update Rating ValueError: {str(e)}")
        return create_error_response('RESOURCE_NOT_FOUND', str(e), 404)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Update Rating Error: {str(e)}")
        return create_error_response('INTERNAL_ERROR', str(e), 500)

@ratings_bp.route('/songs/<int:song_id>/rating', methods=['DELETE'])
@jwt_required()
def delete_song_rating_legacy(song_id):
    user = get_current_user()
    try:
        ReviewService.delete_review(user.user_id, song_id)
        return create_success_response({'message': 'Review deleted'})
    except ValueError as e:
        return create_error_response('RESOURCE_NOT_FOUND', str(e), 404)

# --- Reviews API (used by reviewsApi in api.js) ---

@ratings_bp.route('/songs/<int:song_id>/reviews', methods=['GET'])
def get_song_reviews(song_id):
    page = request.args.get('page', 1)
    limit = request.args.get('limit', 20)
    
    page, limit, errors = validate_pagination(page, limit)
    if errors:
        return create_error_response('VALIDATION_ERROR', 'Invalid pagination', 400, details=errors)
    
    try:
        song, reviews, pagination = ReviewService.get_song_reviews(song_id, page, limit)
        return create_success_response({
            'song': song,
            'ratings': reviews, # Frontend expects 'ratings'
            'pagination': pagination
        })
    except ValueError as e:
        return create_error_response('RESOURCE_NOT_FOUND', str(e), 404)

@ratings_bp.route('/songs/<int:song_id>/reviews', methods=['POST'])
@jwt_required()
def create_review(song_id):
    user = get_current_user()
    data = request.get_json()
    try:
        review = ReviewService.create_review(user.user_id, song_id, data.get('rating'), data.get('comment'))
        return create_success_response(review, status=201)
    except ValueError as e:
        return create_error_response('VALIDATION_ERROR', str(e), 400)

@ratings_bp.route('/reviews/<int:review_id>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_review_by_id(review_id):
    # This might need ReviewService.update_review_by_id, but usually we review by (user, song)
    # Keeping it simple for now if the frontend uses IDs
    return create_error_response('NOT_IMPLEMENTED', 'Update by ID not implemented', 501)

@ratings_bp.route('/reviews/<int:review_id>', methods=['DELETE'])
@jwt_required()
def delete_review_by_id(review_id):
    return create_error_response('NOT_IMPLEMENTED', 'Delete by ID not implemented', 501)