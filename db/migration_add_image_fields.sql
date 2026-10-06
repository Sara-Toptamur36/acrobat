-- Migration: Add image fields to artists and albums tables
-- Created: 2024-12-24
-- Purpose: Add image_url to artists table and cover_image to albums table

-- Add image_url column to artists table
ALTER TABLE artists 
ADD COLUMN image_url VARCHAR(255) NULL COMMENT 'Artist profile image URL';

-- Add cover_image column to albums table  
ALTER TABLE albums
ADD COLUMN cover_image VARCHAR(255) NULL COMMENT 'Album cover image URL';

-- Add indexes for image fields (optional, for potential future queries)
CREATE INDEX idx_artists_image_url ON artists(image_url);
CREATE INDEX idx_albums_cover_image ON albums(cover_image);