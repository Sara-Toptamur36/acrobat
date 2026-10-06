-- Music Catalog Manager Database Stored Procedures
-- MySQL 8.0+ Compatible Procedures for Complex Operations
-- Created: 2024-12-20
DROP PROCEDURE IF EXISTS AddNewAlbumWithSongs;
DROP PROCEDURE IF EXISTS CreatePlaylistFromGenre;
DELIMITER $$

-- ============================================================================
-- STORED PROCEDURE 1: AddNewAlbumWithSongs
-- Creates a new album and adds multiple songs in a single transaction
-- ============================================================================
CREATE PROCEDURE AddNewAlbumWithSongs(
    IN p_artist_id INT,
    IN p_album_title VARCHAR(255),
    IN p_release_year INT,
    IN p_songs JSON
)
BEGIN
    DECLARE v_album_id INT;
    DECLARE v_song_count INT;
    DECLARE v_i INT DEFAULT 0;
    DECLARE v_artist_exists INT DEFAULT 0;
    DECLARE v_song_title VARCHAR(255);
    DECLARE v_duration INT;
    DECLARE v_track_number INT;
    DECLARE v_genre_id INT;
    
    -- Error handler for any SQL exception
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    -- Validate input parameters
    IF p_artist_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Artist ID cannot be null';
    END IF;
    
    IF p_album_title IS NULL OR TRIM(p_album_title) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Album title cannot be empty';
    END IF;
    
    IF p_songs IS NULL OR JSON_LENGTH(p_songs) = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Songs array cannot be empty';
    END IF;
    
    -- Check if artist exists
    SELECT COUNT(*) INTO v_artist_exists
    FROM artists 
    WHERE artist_id = p_artist_id;
    
    IF v_artist_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Artist ID does not exist';
    END IF;
    
    START TRANSACTION;
    
    -- Insert new album
    INSERT INTO albums (artist_id, title, release_year)
    VALUES (p_artist_id, p_album_title, p_release_year);
    
    -- Get the new album ID
    SET v_album_id = LAST_INSERT_ID();
    
    -- Get number of songs in JSON array
    SET v_song_count = JSON_LENGTH(p_songs);
    
    -- Process each song in the JSON array
    WHILE v_i < v_song_count DO
        -- Extract song data from JSON
        SET v_song_title = JSON_UNQUOTE(JSON_EXTRACT(p_songs, CONCAT('$[', v_i, '].title')));
        SET v_duration = JSON_UNQUOTE(JSON_EXTRACT(p_songs, CONCAT('$[', v_i, '].duration')));
        SET v_track_number = JSON_UNQUOTE(JSON_EXTRACT(p_songs, CONCAT('$[', v_i, '].track_number')));
        SET v_genre_id = JSON_UNQUOTE(JSON_EXTRACT(p_songs, CONCAT('$[', v_i, '].genre_id')));
        
        -- Validate song data
        IF v_song_title IS NULL OR TRIM(v_song_title) = '' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Song title cannot be empty';
        END IF;
        
        IF v_duration IS NULL OR v_duration <= 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Song duration must be greater than 0';
        END IF;
        
        IF v_track_number IS NULL OR v_track_number <= 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Track number must be greater than 0';
        END IF;
        
        -- Handle NULL genre_id (convert 'null' string to actual NULL)
        IF v_genre_id = 'null' OR v_genre_id = '' THEN
            SET v_genre_id = NULL;
        END IF;
        
        -- Insert song
        INSERT INTO songs (album_id, genre_id, title, duration, track_number)
        VALUES (v_album_id, v_genre_id, v_song_title, v_duration, v_track_number);
        
        SET v_i = v_i + 1;
    END WHILE;
    
    COMMIT;
    
    -- Return the new album ID
    SELECT v_album_id AS album_id;
END$$

-- ============================================================================
-- STORED PROCEDURE 2: CreatePlaylistFromGenre
-- Creates a playlist with random songs from a specific genre
-- ============================================================================
CREATE PROCEDURE CreatePlaylistFromGenre(
    IN p_user_id INT,
    IN p_genre_id INT,
    IN p_song_limit INT,
    IN p_playlist_name VARCHAR(255)
)
BEGIN
    DECLARE v_playlist_id INT;
    DECLARE v_user_exists INT DEFAULT 0;
    DECLARE v_genre_exists INT DEFAULT 0;
    DECLARE v_available_songs INT DEFAULT 0;
    DECLARE v_actual_limit INT;
    
    -- Error handler for any SQL exception
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    -- Validate input parameters
    IF p_user_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User ID cannot be null';
    END IF;
    
    IF p_genre_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Genre ID cannot be null';
    END IF;
    
    IF p_song_limit IS NULL OR p_song_limit <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Song limit must be greater than 0';
    END IF;
    
    IF p_playlist_name IS NULL OR TRIM(p_playlist_name) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Playlist name cannot be empty';
    END IF;
    
    -- Check if user exists
    SELECT COUNT(*) INTO v_user_exists
    FROM users 
    WHERE user_id = p_user_id;
    
    IF v_user_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User ID does not exist';
    END IF;
    
    -- Check if genre exists
    SELECT COUNT(*) INTO v_genre_exists
    FROM genres 
    WHERE genre_id = p_genre_id;
    
    IF v_genre_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Genre ID does not exist';
    END IF;
    
    -- Count available songs in the genre
    SELECT COUNT(*) INTO v_available_songs
    FROM songs 
    WHERE genre_id = p_genre_id;
    
    IF v_available_songs = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No songs available in this genre';
    END IF;
    
    -- Calculate actual limit (minimum of requested limit and available songs)
    SET v_actual_limit = LEAST(p_song_limit, v_available_songs);
    
    START TRANSACTION;
    
    -- Create new playlist
    INSERT INTO playlists (user_id, name)
    VALUES (p_user_id, p_playlist_name);
    
    -- Get the new playlist ID
    SET v_playlist_id = LAST_INSERT_ID();
    
    -- Add random songs from the genre to the playlist
    INSERT INTO playlist_songs (playlist_id, song_id, position, created_at)
    SELECT 
        v_playlist_id,
        song_id,
        ROW_NUMBER() OVER (ORDER BY RAND()) as position,
        NOW()
    FROM songs 
    WHERE genre_id = p_genre_id
    ORDER BY RAND()
    LIMIT v_actual_limit;
    
    COMMIT;
    
    -- Return playlist ID and number of songs added
    SELECT v_playlist_id AS playlist_id, v_available_songs AS available_songs;
END$$

DELIMITER ;

-- ============================================================================
-- EXAMPLE USAGE (Call Examples)
-- ============================================================================

/*
-- Example 1: Add new album with songs
CALL AddNewAlbumWithSongs(
    1, -- artist_id (The Beatles)
    'Test Album',
    2024,
    '[
        {
            "title": "Test Song 1",
            "duration": 180,
            "track_number": 1,
            "genre_id": 1
        },
        {
            "title": "Test Song 2", 
            "duration": 240,
            "track_number": 2,
            "genre_id": null
        },
        {
            "title": "Test Song 3",
            "duration": 200,
            "track_number": 3,
            "genre_id": 2
        }
    ]'
);

-- Example 2: Create playlist from genre
CALL CreatePlaylistFromGenre(
    2,              -- user_id (john_doe)
    1,              -- genre_id (Rock)
    10,             -- song_limit
    'My Rock Mix'   -- playlist_name
);

-- Example 3: Create jazz playlist
CALL CreatePlaylistFromGenre(
    3,              -- user_id (jane_smith)
    3,              -- genre_id (Jazz)
    5,              -- song_limit
    'Jazz Favorites' -- playlist_name
);
*/

-- ============================================================================
-- PROCEDURE SUMMARY
-- ============================================================================
-- AddNewAlbumWithSongs: Creates album with multiple songs in single transaction
--   - Validates artist existence, album title, and songs array
--   - Processes JSON array of songs with validation
--   - Uses transaction with rollback on any error
--   - Returns new album_id on success
--
-- CreatePlaylistFromGenre: Creates playlist with random songs from genre
--   - Validates user, genre existence, and parameters
--   - Counts available songs and limits accordingly
--   - Uses ROW_NUMBER() OVER(ORDER BY RAND()) for positioning
--   - Returns playlist_id and available_songs count
--
-- Total Procedures: 2 (focused on complex multi-table operations)
-- ============================================================================