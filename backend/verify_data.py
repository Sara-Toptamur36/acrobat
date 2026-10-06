from app import create_app, db
from sqlalchemy import text

def verify_data():
    app = create_app()
    with app.app_context():
        print("Verifying Report Data...")
        
        views = [
            'genres_with_song_count',
            'album_release_statistics',
            'most_active_users',
            'top_rated_songs'
        ]
        
        for v in views:
            try:
                count = db.session.execute(text(f"SELECT COUNT(*) FROM {v}")).scalar()
                print(f"VIEW {v}: {count} rows")
            except Exception as e:
                print(f"VIEW {v} ERROR: {e}")

if __name__ == "__main__":
    verify_data()
