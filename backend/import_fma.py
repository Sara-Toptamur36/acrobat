import os
import csv
import shutil
import uuid
import sys
from datetime import datetime
from app import create_app, db
from app.models.song import Song
from app.models.album import Album
from app.models.artist import Artist
from app.models.genre import Genre
from app.models.playlist import PlaylistSong
from app.models.review import Review
from app.models.favorite import Favorite, AlbumFavorite, ArtistFavorite

# Configuration
FMA_METADATA_DIR = os.path.join(os.getcwd(), 'fma_metadata')
FMA_AUDIO_DIR = os.path.join(os.getcwd(), 'fma_small')
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'app', 'static', 'uploads', 'songs')

# Max songs to import
LIMIT = 500

def get_column_indices(header_row1, header_row2):
    """
    Map 'Category.Field' to column index.
    """
    indices = {}
    current_category = ''
    
    for i, (cat, field) in enumerate(zip(header_row1, header_row2)):
        if cat:
            current_category = cat
        
        if field:
            key = f"{current_category}.{field}"
            indices[key] = i
    
    # Manually add the ID (index 0)
    indices['track_id'] = 0
    return indices

def safe_int(val, default=0):
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return default

def clear_data():
    print("Clearing existing data (preserving Users and Playlists)...")
    try:
        # 1. Clear Dependent Tables (Children)
        ps = PlaylistSong.query.delete()
        r = Review.query.delete()
        f = Favorite.query.delete()
        af = AlbumFavorite.query.delete()
        arf = ArtistFavorite.query.delete()
        print(f"Deleted Relations: {ps} PlaylistSongs, {r} Reviews, {f} Favorites, {af} AlbumFavs, {arf} ArtistFavs")

        # 2. Clear Content Tables (Parents)
        s = Song.query.delete()
        a = Album.query.delete()
        ar = Artist.query.delete()
        g = Genre.query.delete()
        
        db.session.commit()
        print(f"Deleted Content: {s} Songs, {a} Albums, {ar} Artists, {g} Genres")
    except Exception as e:
        db.session.rollback()
        print(f"Clear DB Failed: {e}")
        # Re-raise to stop import if clear failed (avoid mixing data)
        raise e

def import_fma():
    if not os.path.exists(FMA_METADATA_DIR):
        print(f"Error: Metadata directory not found at {FMA_METADATA_DIR}")
        print("Please download fma_metadata.zip and extract it there.")
        return

    if not os.path.exists(FMA_AUDIO_DIR):
        print(f"Error: Audio directory not found at {FMA_AUDIO_DIR}")
        print("Please download fma_small.zip and extract it there.")
        return

    # Ensure upload directory exists
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    tracks_csv = os.path.join(FMA_METADATA_DIR, 'tracks.csv')
    
    print(f"Reading metadata from {tracks_csv}...")
    
    app = create_app()
    with app.app_context():
        try:
            clear_data()
        except Exception:
            print("Aborting import due to clear failure.")
            return

        with open(tracks_csv, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            
            # Header parsing
            row0 = next(reader) # Categories (album, artist, track)
            row1 = next(reader) # Fields (title, name, etc)
            row2 = next(reader) # Extra header (track_id, etc)
            
            indices = get_column_indices(row0, row1)
            
            # Verify critical columns
            required = ['set.subset', 'track.title', 'artist.name', 'album.title', 'track.genre_top', 'track.duration']
            for r in required:
                if r not in indices:
                    print(f"Critical Error: Could not find column '{r}' in CSV.")
                    print(f"Found columns: {list(indices.keys())}")
                    return

            count = 0
            
            print(f"Starting import (Limit: {LIMIT})...")
            
            for row_idx, row in enumerate(reader, start=4):
                if count >= LIMIT:
                    break
                
                try:
                    # check subset
                    # Handle index out of bounds if row is short
                    if len(row) <= indices['set.subset']:
                        continue
                        
                    subset = row[indices['set.subset']]
                    if subset not in ['Small', 'small']:
                        continue
                        
                    track_id = row[0]
                    
                    # Construct file path
                    # FMA Structure: fma_small/000/000123.mp3
                    tid_str = str(track_id).zfill(6)
                    folder_name = tid_str[:3]
                    src_filename = f"{tid_str}.mp3"
                    src_path = os.path.join(FMA_AUDIO_DIR, folder_name, src_filename)
                    
                    if not os.path.exists(src_path):
                        # print(f"Skipping {track_id}: File not found at {src_path}")
                        continue
                        
                    # Extract Data
                    title = row[indices['track.title']]
                    artist_name = row[indices['artist.name']]
                    album_title = row[indices['album.title']]
                    genre_name = row[indices['track.genre_top']]
                    duration = safe_int(row[indices['track.duration']], 180)
                    
                    if not title or not artist_name:
                        continue

                    # Database Operations
                    # 1. Artist
                    artist = Artist.query.filter_by(name=artist_name).first()
                    if not artist:
                        artist = Artist(name=artist_name, bio="Imported from FMA")
                        db.session.add(artist)
                        db.session.flush() # get ID
                    
                    # 2. Album
                    album = Album.query.filter_by(title=album_title, artist_id=artist.artist_id).first()
                    if not album:
                        album = Album(
                            title=album_title, 
                            artist_id=artist.artist_id,
                            release_year=2020, # Default/Unknown
                            song_count=0
                        )
                        db.session.add(album)
                        db.session.flush()
                    
                    # 3. Genre
                    genre_id = None
                    if genre_name:
                        genre = Genre.query.filter_by(name=genre_name).first()
                        if not genre:
                            genre = Genre(name=genre_name)
                            db.session.add(genre)
                            db.session.flush()
                        genre_id = genre.genre_id
                    
                    # 4. Copy File
                    ext = '.mp3'
                    new_filename = f"{uuid.uuid4()}{ext}"
                    dest_path = os.path.join(UPLOAD_FOLDER, new_filename)
                    shutil.copy2(src_path, dest_path)
                    
                    # 5. Song
                    song = Song(
                        album_id=album.album_id,
                        genre_id=genre_id,
                        title=title,
                        duration=duration,
                        track_number=count + 1,
                        file_path=f"/uploads/songs/{new_filename}",
                        average_rating=0
                    )
                    db.session.add(song)
                    
                    # Update counts
                    artist.album_count = Album.query.filter_by(artist_id=artist.artist_id).count()
                    # We can't easily update album song_count here efficiently without query, skipping or doing occasional
                    
                    count += 1
                    print(f"Imported [{count}/{LIMIT}]: {title} by {artist_name}")
                    
                    if count % 10 == 0:
                        db.session.commit()
                        
                except Exception as e:
                    print(f"Error processing row {row_idx}: {e}")
                    db.session.rollback()
                    continue
            
            # Final commit
            db.session.commit()
            
            # Post-import: Update Album song counts
            print("Updating album song counts...")
            albums = Album.query.all()
            for alb in albums:
                 alb.song_count = Song.query.filter_by(album_id=alb.album_id).count()
            db.session.commit()
            
            print("Import completed successfully!")

if __name__ == '__main__':
    import_fma()
