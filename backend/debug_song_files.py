from app import create_app, db
from app.models.song import Song
from app.models.album import Album
import os

def check_songs():
    app = create_app()
    with app.app_context():
        # Check Album 9 (from screenshot)
        album = db.session.get(Album, 9)
        if album:
            print(f"--- Album 9: {album.title} (Artist: {album.artist.name if album.artist else 'None'}) ---")
            songs = Song.query.filter_by(album_id=9).all()
            for s in songs:
                file_path = s.file_path
                full_path = os.path.join(app.config['UPLOAD_FOLDER'], file_path) if file_path else None
                exists = os.path.exists(full_path) if full_path else False
                print(f"Song ID: {s.song_id}, Title: {s.title}, File: {file_path}, Exists: {exists}")
        else:
            print("Album 9 not found.")

        # Check a sample of recently imported songs (FMA)
        print("\n--- Recent 5 Songs ---")
        recent = Song.query.order_by(Song.song_id.desc()).limit(5).all()
        for s in recent:
            file_path = s.file_path
            # Handle absolute or relative
            if file_path and os.path.isabs(file_path):
                 full_path = file_path
            elif file_path:
                 full_path = os.path.join(os.getcwd(), 'app', 'static', 'uploads', 'songs', file_path)
            
            exists = os.path.exists(full_path) if file_path else False
            print(f"Song ID: {s.song_id}, Title: {s.title}, File: {file_path}, Exists: {exists}")

if __name__ == '__main__':
    check_songs()
