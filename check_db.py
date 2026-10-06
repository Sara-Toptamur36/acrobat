from app import create_app, db
from sqlalchemy import inspect
from app.models.playlist import Playlist

app = create_app()
with app.app_context():
    inspector = inspect(db.engine)
    columns = [c['name'] for c in inspector.get_columns('playlists')]
    print(f"Columns in 'playlists' table: {columns}")
    if 'is_public' in columns:
        print("Column 'is_public' EXISTS.")
    else:
        print("Column 'is_public' is MISSING!")
