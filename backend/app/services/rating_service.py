"""
Review service - Business logic for review and comment operations
"""
from typing import Dict, Optional, Tuple
from decimal import Decimal
from app import db

class ReviewService:
    """Service class for review business logic"""
    
    @staticmethod
    def _update_song_average_rating(song_id: int) -> None:
        """Helper to recalculate and update Song.average_rating"""
        from app.models import Review, Song
        from sqlalchemy import func
        
        # Calculate average for reviews that have a rating
        avg_rating_row = db.session.query(
            func.avg(Review.rating)
        ).filter(
            Review.song_id == song_id,
            Review.rating.isnot(None)
        ).first()
        
        avg_val = avg_rating_row[0] if avg_rating_row and avg_rating_row[0] is not None else 0.00
        
        # Update song
        song = db.session.get(Song, song_id)
        if song:
            song.average_rating = Decimal(str(round(float(avg_val), 2)))
            db.session.commit()
    
    @staticmethod
    def create_review(user_id: int, song_id: int, rating: Optional[float] = None, comment: Optional[str] = None) -> Dict:
        """Create new review/comment for song"""
        from app.models import Review, Song, User
        # Validate inputs
        if rating is None and (comment is None or not comment.strip()):
            raise ValueError("Either rating or comment must be provided")
        
        if rating is not None and (rating < 0.0 or rating > 10.0):
            raise ValueError("Rating must be between 0.0 and 10.0")
        
        # Check if user exists
        user = db.session.get(User, user_id)
        if not user:
            raise ValueError("User not found")
        
        # Check if song exists
        song = db.session.get(Song, song_id)
        if not song:
            raise ValueError("Song not found")
        
        # Check if user already reviewed this song
        existing_review = Review.query.filter_by(
            user_id=user_id,
            song_id=song_id
        ).first()
        
        if existing_review:
            raise ValueError("User has already reviewed this song")
        
        # Create new review
        new_review = Review(
            user_id=user_id,
            song_id=song_id,
            rating=Decimal(str(rating)) if rating is not None else None,
            comment=comment.strip() if comment else None
        )
        
        db.session.add(new_review)
        db.session.commit()
        
        # Update song average
        ReviewService._update_song_average_rating(song_id)
        
        return new_review.to_dict(include_song=True)
    
    @staticmethod
    def update_review(user_id: int, song_id: int, rating: Optional[float] = None, comment: Optional[str] = None) -> Dict:
        """Update existing review"""
        from app.models import Review
        # Validate inputs
        if rating is None and (comment is None or not comment.strip()):
            raise ValueError("Either rating or comment must be provided")
        
        if rating is not None and (rating < 0.0 or rating > 10.0):
            raise ValueError("Rating must be between 0.0 and 10.0")
        
        # Find existing review
        existing_review = Review.query.filter_by(
            user_id=user_id,
            song_id=song_id
        ).first()
        
        if not existing_review:
            raise ValueError("Review not found")
        
        # Update review
        if rating is not None:
            existing_review.rating = Decimal(str(rating))
        else:
            existing_review.rating = None
        
        if comment is not None:
            existing_review.comment = comment.strip() if comment else None
        
        db.session.commit()
        
        # Update song average
        ReviewService._update_song_average_rating(song_id)
        
        return existing_review.to_dict(include_song=True)
    
    @staticmethod
    def delete_review(user_id: int, song_id: int) -> bool:
        """Delete user's review for song"""
        from app.models import Review
        # Find existing review
        existing_review = Review.query.filter_by(
            user_id=user_id,
            song_id=song_id
        ).first()
        
        if not existing_review:
            raise ValueError("Review not found")
        
        db.session.delete(existing_review)
        db.session.commit()
        
        # Update song average
        ReviewService._update_song_average_rating(song_id)
        
        return True
    
    @staticmethod
    def get_song_reviews(song_id: int, page: int = 1, limit: int = 20) -> Tuple[Dict, list, Dict]:
        """Get all reviews for a specific song"""
        from app.models import Review, Song
        # Check if song exists
        song = db.session.get(Song, song_id)
        if not song:
            raise ValueError("Song not found")
        
        # Calculate offset for manual pagination
        offset = (page - 1) * limit
        
        # Get total count efficiently
        total_count = Review.query.filter_by(song_id=song_id).count()
        
        # Get reviews with manual pagination
        reviews_query = Review.query.filter_by(song_id=song_id).order_by(
            Review.updated_at.desc()
        ).offset(offset).limit(limit)
        
        reviews = [review.to_dict(include_user=True) for review in reviews_query.all()]
        
        # Calculate pagination info
        total_pages = (total_count + limit - 1) // limit if total_count > 0 else 0
        
        pagination = {
            'page': page,
            'per_page': limit,
            'total': total_count,
            'pages': total_pages
        }
        
        return song.to_dict(), reviews, pagination
    
    @staticmethod
    def get_user_review(user_id: int, song_id: int) -> Optional[Dict]:
        """Get user's review for a specific song"""
        from app.models import Review
        review = Review.query.filter_by(
            user_id=user_id,
            song_id=song_id
        ).first()
        
        if not review:
            return None
        
        return review.to_dict(include_song=True)
        
    # Legacy alias for backward compatibility
    @staticmethod
    def create_rating(*args, **kwargs): return ReviewService.create_review(*args, **kwargs)
    @staticmethod
    def update_rating(*args, **kwargs): return ReviewService.update_review(*args, **kwargs)
    @staticmethod
    def delete_rating(*args, **kwargs): return ReviewService.delete_review(*args, **kwargs)
    @staticmethod
    def get_song_ratings(*args, **kwargs): return ReviewService.get_song_reviews(*args, **kwargs)
    @staticmethod
    def get_user_rating(*args, **kwargs): return ReviewService.get_user_review(*args, **kwargs)