"""
Review model
"""
from datetime import datetime, UTC
from app import db

class Review(db.Model):
    __tablename__ = 'reviews'
    
    review_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    song_id = db.Column(db.Integer, db.ForeignKey('songs.song_id', ondelete='CASCADE'), nullable=False)
    rating = db.Column(db.Numeric(3, 1))
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    
    # Unique constraint and check constraints
    __table_args__ = (
        db.UniqueConstraint('user_id', 'song_id', name='uk_reviews_user_song'),
        db.CheckConstraint('rating IS NULL OR (rating >= 0.00 AND rating <= 10.00)', name='chk_reviews_rating'),
        db.CheckConstraint('rating IS NOT NULL OR comment IS NOT NULL', name='chk_reviews_content')
    )
    
    def to_dict(self, include_user=False, include_song=False):
        """Convert to dictionary"""
        data = {
            'review_id': self.review_id,
            'user_id': self.user_id,
            'song_id': self.song_id,
            'rating': float(self.rating) if self.rating is not None else None,
            'comment': self.comment,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_user and self.user:
            data['user'] = {
                'user_id': self.user.user_id,
                'username': self.user.username
            }
        
        if include_song and self.song:
            data['song'] = self.song.to_dict()
        
        return data
    
    def __repr__(self):
        return f'<Review user_id={self.user_id} song_id={self.song_id}>'
