from app import create_app, db
from sqlalchemy import text

def test_queries():
    app = create_app()
    with app.app_context():
        print("Testing View Queries...")

        # 1. Genres Query
        print("\n--- Testing Genres Query ---")
        try:
            db.session.execute(text("""
                SELECT 
                    g.genre_id, 
                    g.name as genre_name, 
                    COUNT(DISTINCT s.song_id) as song_count, 
                    AVG(r.rating) as avg_genre_rating
                FROM genres g
                LEFT JOIN songs s ON g.genre_id = s.genre_id
                LEFT JOIN reviews r ON s.song_id = r.song_id
                GROUP BY g.genre_id, g.name
                LIMIT 1
            """))
            print("Genres Query: SUCCESS")
        except Exception as e:
            print(f"Genres Query FAILED: {e}")

        # 2. Albums Query
        print("\n--- Testing Albums Query ---")
        try:
            db.session.execute(text("""
                SELECT
                    a.release_year,
                    COUNT(a.album_id) as album_count,
                    COUNT(DISTINCT a.artist_id) as unique_artists,
                    AVG(a.song_count) as avg_songs_per_album,
                    AVG(a.total_duration) as avg_album_duration
                FROM albums a
                GROUP BY a.release_year
                ORDER BY a.release_year DESC
                LIMIT 1
            """))
            print("Albums Query: SUCCESS")
        except Exception as e:
            print(f"Albums Query FAILED: {e}")

        # 3. Users Query
        print("\n--- Testing Users Query ---")
        try:
            db.session.execute(text("""
                SELECT
                    u.user_id,
                    u.username,
                    (SELECT COUNT(*) FROM playlists p WHERE p.user_id = u.user_id) as playlist_count,
                    (SELECT COUNT(*) FROM reviews r WHERE r.user_id = u.user_id) as rating_comment_count,
                    0 as unique_songs_in_playlists,
                    (SELECT COUNT(*) FROM reviews r WHERE r.user_id = u.user_id) * 2 + (SELECT COUNT(*) FROM playlists p WHERE p.user_id = u.user_id) * 5 as activity_score
                FROM users u
                ORDER BY activity_score DESC
                LIMIT 1
            """))
            print("Users Query: SUCCESS")
        except Exception as e:
            print(f"Users Query FAILED: {e}")

        # 4. Top Songs Query
        print("\n--- Testing Top Songs Query ---")
        try:
            db.session.execute(text("""
                SELECT
                    s.song_id,
                    s.title as song_title,
                    a.title as album_title,
                    ar.name as artist_name,
                    g.name as genre_name,
                    AVG(r.rating) as average_rating,
                    COUNT(r.review_id) as rating_count,
                    s.duration
                FROM songs s
                JOIN albums a ON s.album_id = a.album_id
                JOIN artists ar ON a.artist_id = ar.artist_id
                LEFT JOIN genres g ON s.genre_id = g.genre_id
                LEFT JOIN reviews r ON s.song_id = r.song_id
                GROUP BY s.song_id, s.title, a.title, ar.name, g.name, s.duration
                HAVING COUNT(r.review_id) > 0
                ORDER BY average_rating DESC
                LIMIT 1
            """))
            print("Top Songs Query: SUCCESS")
        except Exception as e:
            print(f"Top Songs Query FAILED: {e}")

if __name__ == "__main__":
    test_queries()
