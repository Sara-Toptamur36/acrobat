from app import create_app, db
from sqlalchemy import text
import sys

def create_views():
    app = create_app()
    with app.app_context():
        print("Starting view creation...", flush=True)
        
        try:
            # 1. Genres with Song Count View
            print("Creating view: genres_with_song_count", flush=True)
            db.session.execute(text("DROP VIEW IF EXISTS genres_with_song_count"))
            db.session.execute(text("""
                CREATE VIEW genres_with_song_count AS
                SELECT 
                    g.genre_id, 
                    g.name as genre_name, 
                    COUNT(DISTINCT s.song_id) as song_count, 
                    AVG(r.rating) as avg_genre_rating
                FROM genres g
                LEFT JOIN songs s ON g.genre_id = s.genre_id
                LEFT JOIN reviews r ON s.song_id = r.song_id
                GROUP BY g.genre_id, g.name
            """))
            db.session.commit()
            print("SUCCESS: genres_with_song_count", flush=True)
            
            # 2. Album Release Statistics View
            print("Creating view: album_release_statistics", flush=True)
            db.session.execute(text("DROP VIEW IF EXISTS album_release_statistics"))
            db.session.execute(text("""
                CREATE VIEW album_release_statistics AS
                SELECT
                    a.release_year,
                    COUNT(a.album_id) as album_count,
                    COUNT(DISTINCT a.artist_id) as unique_artists,
                    AVG(a.song_count) as avg_songs_per_album,
                    AVG(a.total_duration) as avg_album_duration
                FROM albums a
                GROUP BY a.release_year
                ORDER BY a.release_year DESC
            """))
            db.session.commit()
            print("SUCCESS: album_release_statistics", flush=True)

            db.session.execute(text("DROP VIEW IF EXISTS most_active_users"))
            db.session.execute(text("""
                CREATE VIEW most_active_users AS
                SELECT 
                    u.user_id,
                    u.username,
                    u.created_at,
                    COALESCE(playlist_stats.playlist_count, 0) AS playlist_count,
                    COALESCE(review_stats.total_ratings, 0) AS total_ratings,
                    COALESCE(review_stats.total_comments, 0) AS total_comments,
                    COALESCE(review_stats.avg_rating, 0.0) AS avg_rating,
                    COALESCE(playlist_stats.unique_songs_in_playlists, 0) AS unique_songs_in_playlists,
                    ((COALESCE(review_stats.total_ratings, 0) + COALESCE(review_stats.total_comments, 0)) * 100 + 
                     COALESCE(playlist_stats.playlist_count, 0)) AS activity_score
                FROM users u
                LEFT JOIN (
                    SELECT 
                        p.user_id,
                        COUNT(p.playlist_id) AS playlist_count,
                        COUNT(DISTINCT ps.song_id) AS unique_songs_in_playlists
                    FROM playlists p
                    LEFT JOIN playlist_songs ps ON p.playlist_id = ps.playlist_id
                    GROUP BY p.user_id
                ) playlist_stats ON u.user_id = playlist_stats.user_id
                LEFT JOIN (
                    SELECT 
                        r.user_id,
                        COUNT(r.rating) AS total_ratings,
                        COUNT(r.comment) AS total_comments,
                        AVG(r.rating) AS avg_rating
                    FROM reviews r
                    GROUP BY r.user_id
                ) review_stats ON u.user_id = review_stats.user_id
                ORDER BY activity_score DESC
            """))
            db.session.commit()
            print("SUCCESS: most_active_users", flush=True)

            # 4. Top Rated Songs View
            print("Creating view: top_rated_songs", flush=True)
            db.session.execute(text("DROP VIEW IF EXISTS top_rated_songs"))
            db.session.execute(text("""
                CREATE VIEW top_rated_songs AS
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
            """))
            db.session.commit()
            print("SUCCESS: top_rated_songs", flush=True)
            
            print("All views created successfully!", flush=True)
        except Exception as e:
            print(f"ERROR CREATING VIEWS: {e}", flush=True)
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    create_views()
