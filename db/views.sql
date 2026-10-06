-- Music Catalog Manager Database Views
-- MySQL 8.0+ Compatible Views for API Endpoints
-- Created: 2024-12-20

-- ============================================================================
-- DROP EXISTING VIEWS (Safe cleanup)
-- ============================================================================
DROP VIEW IF EXISTS genres_with_song_count;
DROP VIEW IF EXISTS album_release_statistics;
DROP VIEW IF EXISTS most_active_users;
DROP VIEW IF EXISTS top_rated_songs;

-- ============================================================================
-- VIEW 1: genres_with_song_count
-- Usage: GET /api/genres/statistics - Genre popularity and ratings overview
-- ============================================================================
CREATE VIEW genres_with_song_count AS
SELECT 
    g.genre_id,
    g.name AS genre_name,
    COALESCE(COUNT(s.song_id), 0) AS song_count,
    COALESCE(AVG(s.average_rating), 0.00) AS avg_genre_rating
FROM genres g
LEFT JOIN songs s ON g.genre_id = s.genre_id
GROUP BY g.genre_id, g.name
ORDER BY song_count DESC, avg_genre_rating DESC;

-- ============================================================================
-- VIEW 2: album_release_statistics
-- Usage: GET /api/albums/release-stats - Music industry trends by year
-- ============================================================================
CREATE VIEW album_release_statistics AS
SELECT 
    al.release_year,
    COUNT(al.album_id) AS album_count,
    COUNT(DISTINCT al.artist_id) AS unique_artists,
    COALESCE(AVG(al.song_count), 0.00) AS avg_songs_per_album,
    COALESCE(AVG(al.total_duration), 0.00) AS avg_album_duration
FROM albums al
WHERE al.release_year IS NOT NULL
GROUP BY al.release_year
ORDER BY al.release_year DESC;

-- ============================================================================
-- VIEW 3: most_active_users
-- Usage: GET /api/users/leaderboard - User engagement and activity ranking
-- ============================================================================
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
    -- Activity score: (ratings + comments) * 100 + playlists (prioritize interactions)
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
ORDER BY activity_score DESC;

-- ============================================================================
-- VIEW 4: top_rated_songs
-- Usage: GET /api/songs/top-rated - Highest rated songs with minimum ratings
-- ============================================================================
CREATE VIEW top_rated_songs AS
SELECT 
    s.song_id,
    s.title AS song_title,
    al.title AS album_title,
    ar.name AS artist_name,
    g.name AS genre_name,
    s.average_rating,
    rating_stats.rating_count,
    s.duration
FROM songs s
INNER JOIN albums al ON s.album_id = al.album_id
INNER JOIN artists ar ON al.artist_id = ar.artist_id
LEFT JOIN genres g ON s.genre_id = g.genre_id
INNER JOIN (
    SELECT 
        song_id,
        COUNT(CASE WHEN rating IS NOT NULL THEN 1 END) AS rating_count
    FROM reviews
    GROUP BY song_id
    HAVING rating_count > 0  -- Only songs with at least one rating
) rating_stats ON s.song_id = rating_stats.song_id
ORDER BY s.average_rating DESC, rating_stats.rating_count DESC;

-- ============================================================================
-- VIEW USAGE SUMMARY
-- ============================================================================
-- genres_with_song_count: GET /api/genres/statistics
--   - Genre popularity dashboard
--   - Music discovery by genre
--   - Admin analytics for genre performance
--
-- album_release_statistics: GET /api/albums/release-stats  
--   - Music industry trends analysis
--   - Historical music data visualization
--   - Admin dashboard for release patterns
--
-- most_active_users: GET /api/users/leaderboard
--   - User engagement leaderboard
--   - Community features and gamification
--   - Admin user activity monitoring
--
-- top_rated_songs: GET /api/songs/top-rated
--   - Featured songs on homepage
--   - Music recommendation system
--   - "Best of" playlists generation
-- ============================================================================