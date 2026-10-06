-- ============================================================================
-- FINAL DATABASE SCHEMA FOR MUSIC LIBRARY APPLICATION
-- Consolidated from SQLAlchemy models and latest migrations
-- Target: MySQL 8.0+
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    profile_image VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_users_username (username),
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. ARTISTS TABLE
CREATE TABLE IF NOT EXISTS artists (
    artist_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    bio TEXT NULL,
    album_count INT DEFAULT 0 NOT NULL,
    image_url VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_artists_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. GENRES TABLE
CREATE TABLE IF NOT EXISTS genres (
    genre_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_genres_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. ALBUMS TABLE
CREATE TABLE IF NOT EXISTS albums (
    album_id INT AUTO_INCREMENT PRIMARY KEY,
    artist_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    release_year INT NULL,
    song_count INT DEFAULT 0 NOT NULL,
    total_duration INT DEFAULT 0 NOT NULL, -- in seconds
    cover_image VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_albums_artist_id 
        FOREIGN KEY (artist_id) REFERENCES artists(artist_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
        
    INDEX idx_albums_artist_id (artist_id),
    INDEX idx_albums_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. SONGS TABLE
CREATE TABLE IF NOT EXISTS songs (
    song_id INT AUTO_INCREMENT PRIMARY KEY,
    album_id INT NOT NULL,
    genre_id INT NULL,
    title VARCHAR(100) NOT NULL,
    duration INT NOT NULL, -- in seconds
    track_number INT NOT NULL,
    file_path VARCHAR(500) NULL,
    average_rating DECIMAL(3, 2) DEFAULT 0.00 NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_songs_album_id 
        FOREIGN KEY (album_id) REFERENCES albums(album_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_songs_genre_id 
        FOREIGN KEY (genre_id) REFERENCES genres(genre_id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
        
    CONSTRAINT uk_songs_album_track UNIQUE (album_id, track_number),
    CONSTRAINT chk_songs_duration CHECK (duration > 0),
    CONSTRAINT chk_songs_track_number CHECK (track_number > 0),
    CONSTRAINT chk_songs_average_rating CHECK (average_rating >= 0.00 AND average_rating <= 10.00),
    
    INDEX idx_songs_album_id (album_id),
    INDEX idx_songs_genre_id (genre_id),
    INDEX idx_songs_title (title),
    INDEX idx_songs_average_rating (average_rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. PLAYLISTS TABLE
CREATE TABLE IF NOT EXISTS playlists (
    playlist_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_public BOOLEAN DEFAULT FALSE NOT NULL,
    cover_image VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_playlists_user_id 
        FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
        
    INDEX idx_playlists_user_id (user_id),
    INDEX idx_playlists_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. PLAYLIST_SONGS TABLE
CREATE TABLE IF NOT EXISTS playlist_songs (
    playlist_song_id INT AUTO_INCREMENT PRIMARY KEY,
    playlist_id INT NOT NULL,
    song_id INT NOT NULL,
    position INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_playlist_songs_playlist_id 
        FOREIGN KEY (playlist_id) REFERENCES playlists(playlist_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_playlist_songs_song_id 
        FOREIGN KEY (song_id) REFERENCES songs(song_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
        
    CONSTRAINT uk_playlist_songs_playlist_song UNIQUE (playlist_id, song_id),
    CONSTRAINT uk_playlist_songs_playlist_position UNIQUE (playlist_id, position),
    CONSTRAINT chk_playlist_songs_position CHECK (position > 0),
    
    INDEX idx_playlist_songs_playlist_id (playlist_id),
    INDEX idx_playlist_songs_song_id (song_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    song_id INT NOT NULL,
    rating DECIMAL(3, 2) NULL,
    comment TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_reviews_user_id 
        FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_reviews_song_id 
        FOREIGN KEY (song_id) REFERENCES songs(song_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
        
    CONSTRAINT uk_reviews_user_song UNIQUE (user_id, song_id),
    CONSTRAINT chk_reviews_rating CHECK (rating IS NULL OR (rating >= 0.00 AND rating <= 10.00)),
    CONSTRAINT chk_reviews_content CHECK (rating IS NOT NULL OR comment IS NOT NULL),
    
    INDEX idx_reviews_user_id (user_id),
    INDEX idx_reviews_song_id (song_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. FAVORITES TABLE (SONGS)
CREATE TABLE IF NOT EXISTS favorites (
    favorite_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    song_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_favorites_user_id 
        FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_favorites_song_id 
        FOREIGN KEY (song_id) REFERENCES songs(song_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
        
    CONSTRAINT uk_favorites_user_song UNIQUE (user_id, song_id),
    
    INDEX idx_favorites_user_id (user_id),
    INDEX idx_favorites_song_id (song_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. ALBUM_FAVORITES TABLE
CREATE TABLE IF NOT EXISTS album_favorites (
    favorite_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    album_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_album_favorites_user_id 
        FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_album_favorites_album_id 
        FOREIGN KEY (album_id) REFERENCES albums(album_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
        
    CONSTRAINT uk_album_favorites_user_album UNIQUE (user_id, album_id),
    
    INDEX idx_album_favorites_user_id (user_id),
    INDEX idx_album_favorites_album_id (album_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. ARTIST_FAVORITES TABLE
CREATE TABLE IF NOT EXISTS artist_favorites (
    favorite_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    artist_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_artist_favorites_user_id 
        FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_artist_favorites_artist_id 
        FOREIGN KEY (artist_id) REFERENCES artists(artist_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
        
    CONSTRAINT uk_artist_favorites_user_artist UNIQUE (user_id, artist_id),
    
    INDEX idx_artist_favorites_user_id (user_id),
    INDEX idx_artist_favorites_artist_id (artist_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. FOLLOWS TABLE
CREATE TABLE IF NOT EXISTS follows (
    follower_id INT NOT NULL,
    following_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT fk_follows_follower_id 
        FOREIGN KEY (follower_id) REFERENCES users(user_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_follows_following_id 
        FOREIGN KEY (following_id) REFERENCES users(user_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
        
    INDEX idx_follows_follower_id (follower_id),
    INDEX idx_follows_following_id (following_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
