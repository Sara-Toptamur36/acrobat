from app import create_app, db
from app.models.song import Song

app = create_app()
with app.app_context():
    count = Song.query.count()
    print(f"Total Songs: {count}")
