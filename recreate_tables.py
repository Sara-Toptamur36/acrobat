from app import create_app, db
# Explicitly import models to ensure they are registered with SQLAlchemy
from app.models.favorite import AlbumFavorite, ArtistFavorite

app = create_app()
with app.app_context():
    print("Forcing table creation...")
    # This will create any tables that don't exist
    db.create_all()
    print("Tables created.")
