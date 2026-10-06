DROP VIEW IF EXISTS most_active_users;

CREATE VIEW most_active_users AS
SELECT 
    u.user_id,
    u.username,
    u.created_at,
    COALESCE(playlist_stats.playlist_count, 0) AS playlist_count,
    COALESCE(rating_stats.rating_count, 0) AS total_ratings,
    COALESCE(rating_stats.comment_count, 0) AS total_comments,
    COALESCE(rating_stats.avg_rating, 0.00) AS avg_rating,
    COALESCE(playlist_stats.unique_songs_in_playlists, 0) AS unique_songs_in_playlists,
    (COALESCE(playlist_stats.playlist_count, 0) * 10 + 
     COALESCE(rating_stats.rating_count, 0) * 5 + 
     COALESCE(rating_stats.comment_count, 0) * 5 + 
     COALESCE(playlist_stats.unique_songs_in_playlists, 0) * 1) AS activity_score
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
        rc.user_id,
        COUNT(CASE WHEN rc.rating IS NOT NULL THEN 1 END) AS rating_count,
        COUNT(CASE WHEN rc.comment IS NOT NULL AND rc.comment != '' THEN 1 END) AS comment_count,
        AVG(rc.rating) AS avg_rating
    FROM ratings_comments rc
    GROUP BY rc.user_id
) rating_stats ON u.user_id = rating_stats.user_id
ORDER BY activity_score DESC;
