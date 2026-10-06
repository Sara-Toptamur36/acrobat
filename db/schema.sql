-- Music Catalog Manager Database Schema
-- MySQL 8.0+ Compatible Schema
-- Created: 2024-12-20

-- Optional: Create database (uncomment if needed)
-- CREATE DATABASE IF NOT EXISTS music_catalog_manager 
-- CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE music_catalog_manager;

-- ============================================================================
-- USERS TABLE
-- Stores user authentication and profile information with role-based access
-- ============================================================================
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_users_username (username),
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================================
-- ARTISTS TABLE  
-- Stores music artist information with album count tracking
-- Note: DELETE RESTRICT - artists cannot be deleted if they have albums
-- ============================================================================
CREATE TABLE artists (
    artist_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    bio TEXT,
    album_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_artists_name (name)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================================
-- GENRES TABLE
-- Stores music genre categories with descriptions
-- Note: ON DELETE SET NULL - songs can exist without genre assignment
-- ============================================================================
CREATE TABLE genres (
    genre_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_genres_name (name)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================================
-- ALBUMS TABLE
-- Stores album information with artist relationships and track statistics
-- ============================================================================
CREATE TABLE albums (
    album_id INT PRIMARY KEY AUTO_INCREMENT,
    artist_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    release_year INT NULL,
    song_count INT DEFAULT 0 NOT NULL,
    total_duration INT DEFAULT 0 NOT NULL, -- Total duration in seconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_albums_artist_id 
        FOREIGN KEY (artist_id) REFERENCES artists(artist_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Indexes for performance
    INDEX idx_albums_artist_id (artist_id),
    INDEX idx_albums_title (title),
    INDEX idx_albums_release_year (release_year)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================================
-- SONGS TABLE
-- Stores individual song information with album and genre relationships
-- ============================================================================
CREATE TABLE songs (
    song_id INT PRIMARY KEY AUTO_INCREMENT,
    album_id INT NOT NULL,
    genre_id INT NULL,
    title VARCHAR(100) NOT NULL,
    duration INT NOT NULL, -- Duration in seconds
    track_number INT NOT NULL,
    average_rating DECIMAL(4,2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_songs_album_id 
        FOREIGN KEY (album_id) REFERENCES albums(album_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_songs_genre_id 
        FOREIGN KEY (genre_id) REFERENCES genres(genre_id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- Business logic constraints
    CONSTRAINT chk_songs_duration CHECK (duration > 0),
    CONSTRAINT chk_songs_track_number CHECK (track_number > 0),
    CONSTRAINT chk_songs_average_rating CHECK (average_rating >= 0.00 AND average_rating <= 10.00),
    
    -- Unique constraint for track numbers within an album
    UNIQUE KEY uk_songs_album_track (album_id, track_number),
    
    -- Indexes for performance
    INDEX idx_songs_album_id (album_id),
    INDEX idx_songs_genre_id (genre_id),
    INDEX idx_songs_title (title),
    INDEX idx_songs_duration (duration),
    INDEX idx_songs_average_rating (average_rating)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================================
-- PLAYLISTS TABLE
-- Stores user-created playlists for organizing songs
-- ============================================================================
CREATE TABLE playlists (
    playlist_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_playlists_user_id 
        FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Indexes for performance
    INDEX idx_playlists_user_id (user_id),
    INDEX idx_playlists_name (name)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================================
-- PLAYLIST_SONGS TABLE
-- Junction table for many-to-many relationship between playlists and songs
-- Includes position for song ordering within playlists
-- ============================================================================
CREATE TABLE playlist_songs (
    playlist_song_id INT PRIMARY KEY AUTO_INCREMENT,
    playlist_id INT NOT NULL,
    song_id INT NOT NULL,
    position INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_playlist_songs_playlist_id 
        FOREIGN KEY (playlist_id) REFERENCES playlists(playlist_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_playlist_songs_song_id 
        FOREIGN KEY (song_id) REFERENCES songs(song_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Business logic constraints
    CONSTRAINT chk_playlist_songs_position CHECK (position > 0),
    
    -- Unique constraints
    UNIQUE KEY uk_playlist_songs_playlist_song (playlist_id, song_id),
    UNIQUE KEY uk_playlist_songs_playlist_position (playlist_id, position),
    
    -- Indexes for performance
    INDEX idx_playlist_songs_playlist_id (playlist_id),
    INDEX idx_playlist_songs_song_id (song_id),
    INDEX idx_playlist_songs_position (position)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================================
-- RATINGS_COMMENTS TABLE
-- Stores user ratings and comments for songs
-- Each user can only rate/comment on a song once
-- ============================================================================
CREATE TABLE ratings_comments (
    rating_comment_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    song_id INT NOT NULL,
    rating DECIMAL(4,2) NULL,
    comment TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_ratings_comments_user_id 
        FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ratings_comments_song_id 
        FOREIGN KEY (song_id) REFERENCES songs(song_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Business logic constraints
    CONSTRAINT chk_ratings_comments_rating CHECK (rating IS NULL OR (rating >= 0.00 AND rating <= 10.00)),
    CONSTRAINT chk_ratings_comments_content CHECK (rating IS NOT NULL OR comment IS NOT NULL),
    
    -- Unique constraint - one rating/comment per user per song
    UNIQUE KEY uk_ratings_comments_user_song (user_id, song_id),
    
    -- Indexes for performance
    INDEX idx_ratings_comments_user_id (user_id),
    INDEX idx_ratings_comments_song_id (song_id),
    INDEX idx_ratings_comments_rating (rating)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================================
-- ADDITIONAL INDEXES FOR COMPLEX QUERIES
-- ============================================================================

-- Composite indexes for common query patterns
CREATE INDEX idx_songs_album_track ON songs(album_id, track_number);
CREATE INDEX idx_songs_genre_rating ON songs(genre_id, average_rating DESC);
CREATE INDEX idx_albums_artist_year ON albums(artist_id, release_year DESC);
CREATE INDEX idx_playlists_user_created ON playlists(user_id, created_at DESC);

-- ============================================================================
-- SCHEMA VALIDATION AND COMMENTS
-- ============================================================================

-- Add table comments for documentation
ALTER TABLE users COMMENT = 'User accounts with authentication and role-based access control';
ALTER TABLE artists COMMENT = 'Music artists with biography and album count tracking';
ALTER TABLE genres COMMENT = 'Music genre categories for song classification';
ALTER TABLE albums COMMENT = 'Music albums with artist relationships and track statistics';
ALTER TABLE songs COMMENT = 'Individual songs with metadata, ratings, and relationships';
ALTER TABLE playlists COMMENT = 'User-created song collections with custom ordering';
ALTER TABLE playlist_songs COMMENT = 'Junction table linking playlists to songs with position';
ALTER TABLE ratings_comments COMMENT = 'User ratings and comments for songs with uniqueness constraints';

-- ============================================================================
-- SCHEMA INFORMATION
-- ============================================================================
-- Total Tables: 8
-- Total Foreign Keys: 7
-- Total Indexes: 25+ (including primary keys and unique constraints)
-- Character Set: utf8mb4 (full Unicode support)
-- Collation: utf8mb4_unicode_ci (case-insensitive Unicode)
-- Engine: InnoDB (supports transactions, foreign keys, and full-text search)
-- ============================================================================