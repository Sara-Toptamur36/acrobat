-- Music Catalog Manager Database Triggers
-- MySQL 8.0+ Compatible Triggers for Statistical Data Consistency
-- Created: 2024-12-20
-- Performance: Uses COUNT(*) and SUM() for accurate recalculation

-- ============================================================================
-- DROP EXISTING TRIGGERS (Safe cleanup)
-- ============================================================================
DROP TRIGGER IF EXISTS tr_songs_after_insert;
DROP TRIGGER IF EXISTS tr_songs_after_update;
DROP TRIGGER IF EXISTS tr_songs_after_delete;
DROP TRIGGER IF EXISTS tr_albums_after_insert;
DROP TRIGGER IF EXISTS tr_albums_after_delete;
DROP TRIGGER IF EXISTS tr_ratings_after_insert;
DROP TRIGGER IF EXISTS tr_ratings_after_update;
DROP TRIGGER IF EXISTS tr_ratings_after_delete;

DELIMITER $$

-- ============================================================================
-- SONGS TABLE TRIGGERS
-- Maintain albums.song_count and albums.total_duration statistics
-- Performance: Direct COUNT(*) and SUM(duration) for accuracy
-- ============================================================================

-- Trigger 1: Song INSERT - Update album statistics
CREATE TRIGGER tr_songs_after_insert
    AFTER INSERT ON songs
    FOR EACH ROW
BEGIN
    -- Recalculate album statistics using COUNT(*) and SUM()
    UPDATE albums 
    SET song_count = (
            SELECT COUNT(*) 
            FROM songs 
            WHERE album_id = NEW.album_id
        ),
        total_duration = (
            SELECT COALESCE(SUM(duration), 0) 
            FROM songs 
            WHERE album_id = NEW.album_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE album_id = NEW.album_id;
END$$

-- Trigger 2: Song UPDATE - Handle album changes and duration updates
CREATE TRIGGER tr_songs_after_update
    AFTER UPDATE ON songs
    FOR EACH ROW
BEGIN
    -- If song moved to different album, update both albums
    IF OLD.album_id != NEW.album_id THEN
        -- Update OLD album statistics
        UPDATE albums 
        SET song_count = (
                SELECT COUNT(*) 
                FROM songs 
                WHERE album_id = OLD.album_id
            ),
            total_duration = (
                SELECT COALESCE(SUM(duration), 0) 
                FROM songs 
                WHERE album_id = OLD.album_id
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE album_id = OLD.album_id;
        
        -- Update NEW album statistics
        UPDATE albums 
        SET song_count = (
                SELECT COUNT(*) 
                FROM songs 
                WHERE album_id = NEW.album_id
            ),
            total_duration = (
                SELECT COALESCE(SUM(duration), 0) 
                FROM songs 
                WHERE album_id = NEW.album_id
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE album_id = NEW.album_id;
    ELSE
        -- Same album, but duration might have changed
        IF OLD.duration != NEW.duration THEN
            UPDATE albums 
            SET total_duration = (
                    SELECT COALESCE(SUM(duration), 0) 
                    FROM songs 
                    WHERE album_id = NEW.album_id
                ),
                updated_at = CURRENT_TIMESTAMP
            WHERE album_id = NEW.album_id;
        END IF;
    END IF;
END$$

-- Trigger 3: Song DELETE - Update album statistics
CREATE TRIGGER tr_songs_after_delete
    AFTER DELETE ON songs
    FOR EACH ROW
BEGIN
    -- Recalculate album statistics using COUNT(*) and SUM()
    UPDATE albums 
    SET song_count = (
            SELECT COUNT(*) 
            FROM songs 
            WHERE album_id = OLD.album_id
        ),
        total_duration = (
            SELECT COALESCE(SUM(duration), 0) 
            FROM songs 
            WHERE album_id = OLD.album_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE album_id = OLD.album_id;
END$$

-- ============================================================================
-- ALBUMS TABLE TRIGGERS
-- Maintain artists.album_count statistics
-- Performance: Direct COUNT(*) for accuracy
-- ============================================================================

-- Trigger 4: Album INSERT - Update artist album count
CREATE TRIGGER tr_albums_after_insert
    AFTER INSERT ON albums
    FOR EACH ROW
BEGIN
    -- Recalculate artist album count using COUNT(*)
    UPDATE artists 
    SET album_count = (
            SELECT COUNT(*) 
            FROM albums 
            WHERE artist_id = NEW.artist_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE artist_id = NEW.artist_id;
END$$

-- Trigger 5: Album DELETE - Update artist album count
CREATE TRIGGER tr_albums_after_delete
    AFTER DELETE ON albums
    FOR EACH ROW
BEGIN
    -- Recalculate artist album count using COUNT(*)
    UPDATE artists 
    SET album_count = (
            SELECT COUNT(*) 
            FROM albums 
            WHERE artist_id = OLD.artist_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE artist_id = OLD.artist_id;
END$$

-- ============================================================================
-- RATINGS_COMMENTS TABLE TRIGGERS
-- Maintain songs.average_rating statistics
-- Performance: AVG() with rating IS NOT NULL filter, COALESCE for null handling
-- Note: Only rating changes trigger recalculation, not comment changes
-- ============================================================================

-- Trigger 6: Rating INSERT - Update song average rating
CREATE TRIGGER tr_ratings_after_insert
    AFTER INSERT ON ratings_comments
    FOR EACH ROW
BEGIN
    -- Only recalculate if a rating was provided (not just comment)
    IF NEW.rating IS NOT NULL THEN
        UPDATE songs 
        SET average_rating = (
                SELECT COALESCE(AVG(rating), 0.00)
                FROM ratings_comments 
                WHERE song_id = NEW.song_id 
                AND rating IS NOT NULL
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE song_id = NEW.song_id;
    END IF;
END$$

-- Trigger 7: Rating UPDATE - Update song average rating only if rating changed
CREATE TRIGGER tr_ratings_after_update
    AFTER UPDATE ON ratings_comments
    FOR EACH ROW
BEGIN
    -- Only recalculate if rating changed (not comment changes)
    -- Handles: NULL->rating, rating->NULL, rating->different_rating
    IF (OLD.rating IS NULL AND NEW.rating IS NOT NULL) OR
       (OLD.rating IS NOT NULL AND NEW.rating IS NULL) OR
       (OLD.rating IS NOT NULL AND NEW.rating IS NOT NULL AND OLD.rating != NEW.rating) THEN
        
        UPDATE songs 
        SET average_rating = (
                SELECT COALESCE(AVG(rating), 0.00)
                FROM ratings_comments 
                WHERE song_id = NEW.song_id 
                AND rating IS NOT NULL
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE song_id = NEW.song_id;
    END IF;
    -- Note: Comment-only changes do not trigger rating recalculation
END$$

-- Trigger 8: Rating DELETE - Update song average rating
CREATE TRIGGER tr_ratings_after_delete
    AFTER DELETE ON ratings_comments
    FOR EACH ROW
BEGIN
    -- Only recalculate if a rating was deleted (not just comment)
    IF OLD.rating IS NOT NULL THEN
        UPDATE songs 
        SET average_rating = (
                SELECT COALESCE(AVG(rating), 0.00)
                FROM ratings_comments 
                WHERE song_id = OLD.song_id 
                AND rating IS NOT NULL
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE song_id = OLD.song_id;
    END IF;
END$$

DELIMITER ;

-- ============================================================================
-- TRIGGER PERFORMANCE NOTES
-- ============================================================================
-- 1. COUNT(*) and SUM() ensure accurate statistics even with concurrent operations
-- 2. COALESCE handles NULL cases when no records exist (e.g., album with no songs)
-- 3. Rating triggers only fire when rating values change, not comments
-- 4. All triggers update the parent table's updated_at timestamp
-- 5. Subqueries are used instead of incremental updates for data consistency
-- 6. Triggers are optimized for correctness over performance (recalculation approach)
-- ============================================================================

-- ============================================================================
-- TRIGGER SUMMARY
-- ============================================================================
-- Songs Statistics: 3 triggers (INSERT, UPDATE, DELETE on songs table)
-- Albums Statistics: 2 triggers (INSERT, DELETE on albums table) 
-- Ratings Statistics: 3 triggers (INSERT, UPDATE, DELETE on ratings_comments table)
-- Total Triggers: 8 (focused on core statistical maintenance)
-- ============================================================================