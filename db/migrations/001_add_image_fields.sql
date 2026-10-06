-- Migration: Add image fields to artists and albums tables
-- Date: 2024-12-24
-- Description: Add image_url field to artists table and cover_image field to albums table

-- Add image_url field to artists table
ALTER TABLE artists 
ADD COLUMN image_url VARCHAR(255) NULL 
COMMENT 'URL path to artist profile image';

-- Add cover_image field to albums table  
ALTER TABLE albums 
ADD COLUMN cover_image VARCHAR(255) NULL 
COMMENT 'URL path to album cover image';

-- Add indexes for image fields (for potential future queries)
CREATE INDEX idx_artists_image_url ON artists(image_url);
CREATE INDEX idx_albums_cover_image ON albums(cover_image);