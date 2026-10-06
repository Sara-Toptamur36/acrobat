-- Music Catalog Manager Database Seed Data
-- MySQL 8.0+ Compatible Test and Demonstration Data
-- Created: 2024-12-20

-- ============================================================================
-- DISABLE FOREIGN KEY CHECKS FOR SEEDING
-- ============================================================================
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- CLEAR EXISTING DATA (Optional - uncomment if needed)
-- ============================================================================
-- DELETE FROM ratings_comments;
-- DELETE FROM playlist_songs;
-- DELETE FROM playlists;
-- DELETE FROM songs;
-- DELETE FROM albums;
-- DELETE FROM artists;
-- DELETE FROM genres;
-- DELETE FROM users;

-- ============================================================================
-- SEED USERS
-- Note: In production, passwords should be properly hashed by the application
-- These are example bcrypt hashes for 'password123'
-- ============================================================================
INSERT IGNORE INTO users (user_id, username, email, password_hash, role) VALUES
(1, 'admin', 'admin@musiccatalog.com', 'scrypt:32768:8:1$hxBe0GpmGZScUnJP$af68f29e114c9da8cdd1b81dde42a5f1b7c6a5658a4cbb2e119d71ae7e98a5e630f1a2b5950d6fb6cbd13428e08b2408f88e21b7450a9f3854384ac2b88cd0c5', 'admin'),
(2, 'john_doe', 'john@example.com', 'scrypt:32768:8:1$hxBe0GpmGZScUnJP$af68f29e114c9da8cdd1b81dde42a5f1b7c6a5658a4cbb2e119d71ae7e98a5e630f1a2b5950d6fb6cbd13428e08b2408f88e21b7450a9f3854384ac2b88cd0c5', 'user'),
(3, 'jane_smith', 'jane@example.com', 'scrypt:32768:8:1$hxBe0GpmGZScUnJP$af68f29e114c9da8cdd1b81dde42a5f1b7c6a5658a4cbb2e119d71ae7e98a5e630f1a2b5950d6fb6cbd13428e08b2408f88e21b7450a9f3854384ac2b88cd0c5', 'user'),
(4, 'music_lover', 'lover@example.com', 'scrypt:32768:8:1$hxBe0GpmGZScUnJP$af68f29e114c9da8cdd1b81dde42a5f1b7c6a5658a4cbb2e119d71ae7e98a5e630f1a2b5950d6fb6cbd13428e08b2408f88e21b7450a9f3854384ac2b88cd0c5', 'user'),
(5, 'dj_mike', 'mike@example.com', 'scrypt:32768:8:1$hxBe0GpmGZScUnJP$af68f29e114c9da8cdd1b81dde42a5f1b7c6a5658a4cbb2e119d71ae7e98a5e630f1a2b5950d6fb6cbd13428e08b2408f88e21b7450a9f3854384ac2b88cd0c5', 'user');

-- ============================================================================
-- SEED GENRES
-- ============================================================================
INSERT INTO genres (genre_id, name, description) VALUES
(1, 'Rock', 'Rock music with electric guitars, bass, and drums'),
(2, 'Pop', 'Popular music with catchy melodies and mainstream appeal'),
(3, 'Jazz', 'Jazz music featuring improvisation and complex harmonies'),
(4, 'Classical', 'Traditional classical music with orchestral arrangements'),
(5, 'Electronic', 'Electronic music created using synthesizers and digital instruments'),
(6, 'Hip Hop', 'Hip hop music with rap vocals and rhythmic beats'),
(7, 'Country', 'Country music with folk influences and storytelling lyrics'),
(8, 'Blues', 'Blues music with twelve-bar structure and emotional expression'),
(9, 'Reggae', 'Reggae music with distinctive rhythm and Jamaican origins'),
(10, 'Folk', 'Traditional folk music with acoustic instruments');

-- ============================================================================
-- SEED ARTISTS
-- ============================================================================
INSERT INTO artists (artist_id, name, bio, album_count) VALUES
(1, 'The Beatles', 'Legendary British rock band formed in Liverpool in 1960', 0),
(2, 'Miles Davis', 'Influential American jazz trumpeter and bandleader', 0),
(3, 'Bob Dylan', 'American singer-songwriter and Nobel Prize winner', 0),
(4, 'Daft Punk', 'French electronic music duo known for their robot personas', 0),
(5, 'Adele', 'British singer-songwriter known for powerful vocals', 0),
(6, 'Johnny Cash', 'American country music legend known as "The Man in Black"', 0),
(7, 'B.B. King', 'American blues guitarist known as "King of the Blues"', 0),
(8, 'Bob Marley', 'Jamaican reggae legend and cultural icon', 0),
(9, 'Ludwig van Beethoven', 'German classical composer and pianist', 0),
(10, 'Eminem', 'American rapper and hip hop artist', 0);

-- ============================================================================
-- SEED ALBUMS
-- ============================================================================
INSERT INTO albums (album_id, artist_id, title, release_year, song_count, total_duration) VALUES
-- The Beatles Albums
(1, 1, 'Abbey Road', 1969, 0, 0),
(2, 1, 'Sgt. Pepper''s Lonely Hearts Club Band', 1967, 0, 0),

-- Miles Davis Albums
(3, 2, 'Kind of Blue', 1959, 0, 0),
(4, 2, 'Bitches Brew', 1970, 0, 0),

-- Bob Dylan Albums
(5, 3, 'Highway 61 Revisited', 1965, 0, 0),
(6, 3, 'Blood on the Tracks', 1975, 0, 0),

-- Daft Punk Albums
(7, 4, 'Discovery', 2001, 0, 0),
(8, 4, 'Random Access Memories', 2013, 0, 0),

-- Adele Albums
(9, 5, '21', 2011, 0, 0),
(10, 5, '25', 2015, 0, 0),

-- Johnny Cash Albums
(11, 6, 'At Folsom Prison', 1968, 0, 0),

-- B.B. King Albums
(12, 7, 'Live at the Regal', 1965, 0, 0),

-- Bob Marley Albums
(13, 8, 'Legend', 1984, 0, 0),

-- Beethoven Albums
(14, 9, 'Symphony No. 9', 1824, 0, 0),

-- Eminem Albums
(15, 10, 'The Marshall Mathers LP', 2000, 0, 0);

-- ============================================================================
-- SEED SONGS
-- ============================================================================
INSERT INTO songs (song_id, album_id, genre_id, title, duration, track_number, average_rating) VALUES
-- Abbey Road (The Beatles)
(1, 1, 1, 'Come Together', 259, 1, 8.5),
(2, 1, 1, 'Something', 183, 2, 9.2),
(3, 1, 1, 'Here Comes the Sun', 185, 7, 9.0),
(4, 1, 1, 'The End', 143, 16, 8.8),

-- Sgt. Pepper's (The Beatles)
(5, 2, 1, 'Lucy in the Sky with Diamonds', 208, 3, 8.7),
(6, 2, 1, 'With a Little Help from My Friends', 164, 2, 8.3),

-- Kind of Blue (Miles Davis)
(7, 3, 3, 'So What', 563, 1, 9.4),
(8, 3, 3, 'Freddie Freeloader', 577, 2, 8.9),
(9, 3, 3, 'Blue in Green', 337, 3, 9.1),

-- Bitches Brew (Miles Davis)
(10, 4, 3, 'Bitches Brew', 1620, 1, 8.6),

-- Highway 61 Revisited (Bob Dylan)
(11, 5, 10, 'Like a Rolling Stone', 369, 1, 9.3),
(12, 5, 10, 'Ballad of a Thin Man', 357, 3, 8.4),

-- Blood on the Tracks (Bob Dylan)
(13, 6, 10, 'Tangled Up in Blue', 341, 1, 8.9),
(14, 6, 10, 'Simple Twist of Fate', 254, 2, 8.7),

-- Discovery (Daft Punk)
(15, 7, 5, 'One More Time', 320, 1, 8.8),
(16, 7, 5, 'Harder, Better, Faster, Stronger', 225, 4, 9.0),
(17, 7, 5, 'Digital Love', 301, 3, 8.5),

-- Random Access Memories (Daft Punk)
(18, 8, 5, 'Get Lucky', 247, 8, 8.9),
(19, 8, 5, 'Instant Crush', 337, 5, 8.2),

-- 21 (Adele)
(20, 9, 2, 'Rolling in the Deep', 228, 1, 9.1),
(21, 9, 2, 'Someone Like You', 285, 2, 8.8),
(22, 9, 2, 'Set Fire to the Rain', 242, 4, 8.6),

-- 25 (Adele)
(23, 10, 2, 'Hello', 295, 1, 8.7),
(24, 10, 2, 'When We Were Young', 290, 3, 8.4),

-- At Folsom Prison (Johnny Cash)
(25, 11, 7, 'Folsom Prison Blues', 175, 1, 8.9),
(26, 11, 7, 'Dark as a Dungeon', 183, 3, 8.3),

-- Live at the Regal (B.B. King)
(27, 12, 8, 'Every Day I Have the Blues', 178, 1, 8.7),
(28, 12, 8, 'Sweet Little Angel', 201, 2, 8.5),

-- Legend (Bob Marley)
(29, 13, 9, 'No Woman No Cry', 427, 3, 9.2),
(30, 13, 9, 'Three Little Birds', 180, 7, 8.8),
(31, 13, 9, 'One Love', 172, 1, 9.0),

-- Symphony No. 9 (Beethoven)
(32, 14, 4, 'Ode to Joy', 1020, 4, 9.5),
(33, 14, 4, 'Allegro ma non troppo', 960, 1, 9.2),

-- The Marshall Mathers LP (Eminem)
(34, 15, 6, 'The Real Slim Shady', 284, 7, 8.4),
(35, 15, 6, 'Stan', 404, 3, 9.1);

-- ============================================================================
-- SEED PLAYLISTS
-- ============================================================================
INSERT INTO playlists (playlist_id, user_id, name) VALUES
(1, 2, 'My Favorites'),
(2, 2, 'Workout Mix'),
(3, 3, 'Chill Vibes'),
(4, 3, 'Classic Rock'),
(5, 4, 'Jazz Collection'),
(6, 4, 'Electronic Beats'),
(7, 5, 'Road Trip Songs');

-- ============================================================================
-- SEED PLAYLIST SONGS
-- ============================================================================
INSERT INTO playlist_songs (playlist_song_id, playlist_id, song_id, position) VALUES
-- John's Favorites
(1, 1, 1, 1),   -- Come Together
(2, 1, 7, 2),   -- So What
(3, 1, 11, 3),  -- Like a Rolling Stone
(4, 1, 20, 4),  -- Rolling in the Deep
(5, 1, 29, 5),  -- No Woman No Cry

-- John's Workout Mix
(6, 2, 15, 1),  -- One More Time
(7, 2, 16, 2),  -- Harder, Better, Faster, Stronger
(8, 2, 34, 3),  -- The Real Slim Shady

-- Jane's Chill Vibes
(9, 3, 3, 1),   -- Here Comes the Sun
(10, 3, 9, 2),  -- Blue in Green
(11, 3, 21, 3), -- Someone Like You
(12, 3, 30, 4), -- Three Little Birds

-- Jane's Classic Rock
(13, 4, 1, 1),  -- Come Together
(14, 4, 2, 2),  -- Something
(15, 4, 5, 3),  -- Lucy in the Sky with Diamonds

-- Music Lover's Jazz Collection
(16, 5, 7, 1),  -- So What
(17, 5, 8, 2),  -- Freddie Freeloader
(18, 5, 9, 3),  -- Blue in Green
(19, 5, 10, 4), -- Bitches Brew

-- Music Lover's Electronic Beats
(20, 6, 15, 1), -- One More Time
(21, 6, 16, 2), -- Harder, Better, Faster, Stronger
(22, 6, 17, 3), -- Digital Love
(23, 6, 18, 4), -- Get Lucky

-- DJ Mike's Road Trip Songs
(24, 7, 11, 1), -- Like a Rolling Stone
(25, 7, 25, 2), -- Folsom Prison Blues
(26, 7, 29, 3), -- No Woman No Cry
(27, 7, 31, 4); -- One Love

-- ============================================================================
-- SEED RATINGS AND COMMENTS
-- ============================================================================
INSERT INTO ratings_comments (rating_comment_id, user_id, song_id, rating, comment) VALUES
-- User ratings for various songs
(1, 2, 1, 8.5, 'Classic Beatles track with great bass line'),
(2, 2, 7, 9.5, 'Masterpiece of jazz improvisation'),
(3, 2, 20, 9.0, 'Adele''s powerful vocals shine here'),

(4, 3, 3, 9.0, 'Perfect song for a sunny day'),
(5, 3, 29, 9.5, 'Bob Marley at his finest'),
(6, 3, 21, 8.5, 'Emotional and beautifully written'),

(7, 4, 15, 8.8, 'Daft Punk''s electronic genius'),
(8, 4, 16, 9.2, 'Incredible production and catchy hook'),
(9, 4, 32, 10.0, 'Beethoven''s greatest achievement'),

(10, 5, 11, 9.0, 'Dylan''s revolutionary songwriting'),
(11, 5, 25, 8.7, 'Cash''s raw prison performance'),
(12, 5, 34, 7.8, 'Eminem''s clever wordplay and humor'),

-- Additional ratings without comments
(13, 2, 15, 8.8, NULL),
(14, 3, 7, 9.2, NULL),
(15, 4, 29, 9.0, NULL),
(16, 5, 2, 9.3, NULL),
(17, 2, 32, 9.8, NULL),
(18, 3, 16, 8.9, NULL),
(19, 4, 11, 9.1, NULL),
(20, 5, 20, 8.9, NULL);

-- ============================================================================
-- RE-ENABLE FOREIGN KEY CHECKS
-- ============================================================================
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- UPDATE STATISTICS (Triggers should handle this, but ensuring consistency)
-- ============================================================================
-- Update artist album counts
UPDATE artists SET album_count = (
    SELECT COUNT(*) FROM albums WHERE albums.artist_id = artists.artist_id
);

-- Update album song counts and durations
UPDATE albums SET 
    song_count = (
        SELECT COUNT(*) FROM songs WHERE songs.album_id = albums.album_id
    ),
    total_duration = (
        SELECT COALESCE(SUM(duration), 0) FROM songs WHERE songs.album_id = albums.album_id
    );

-- Update song average ratings
UPDATE songs SET average_rating = (
    SELECT COALESCE(AVG(rating), 0.00) 
    FROM ratings_comments 
    WHERE ratings_comments.song_id = songs.song_id 
    AND rating IS NOT NULL
);

-- ============================================================================
-- SEED DATA SUMMARY
-- ============================================================================
-- Users: 5 (1 admin, 4 regular users)
-- Genres: 10 (Rock, Pop, Jazz, Classical, Electronic, Hip Hop, Country, Blues, Reggae, Folk)
-- Artists: 10 (Famous musicians across different genres)
-- Albums: 15 (Classic albums from each artist)
-- Songs: 35 (Popular tracks from each album)
-- Playlists: 7 (User-created playlists with different themes)
-- Playlist Songs: 27 (Songs added to various playlists)
-- Ratings/Comments: 20 (User ratings and reviews)
-- ============================================================================

-- Verification queries (uncomment to run)
-- SELECT 'Users' as table_name, COUNT(*) as count FROM users
-- UNION ALL SELECT 'Artists', COUNT(*) FROM artists
-- UNION ALL SELECT 'Albums', COUNT(*) FROM albums  
-- UNION ALL SELECT 'Songs', COUNT(*) FROM songs
-- UNION ALL SELECT 'Genres', COUNT(*) FROM genres
-- UNION ALL SELECT 'Playlists', COUNT(*) FROM playlists
-- UNION ALL SELECT 'Playlist Songs', COUNT(*) FROM playlist_songs
-- UNION ALL SELECT 'Ratings/Comments', COUNT(*) FROM ratings_comments;