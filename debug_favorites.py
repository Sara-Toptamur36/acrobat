from app import create_app, db
from app.models.user import User
from app.models.favorite import Favorite, AlbumFavorite, ArtistFavorite
from app.models.song import Song
from app.models.album import Album
from app.models.artist import Artist
import traceback

app = create_app()
with app.app_context():
    try:
        print("Debugging Favorites...")
        user = User.query.filter_by(email='john@example.com').first()
        
        # 1. Try to add a favorite song
        print("Adding song favorite...")
        song = Song.query.first()
        if song:
            fav = Favorite(user_id=user.user_id, song_id=song.song_id)
            db.session.add(fav)
            try:
                db.session.commit()
                print("Song favorite added.")
            except Exception as e:
                 db.session.rollback()
                 print(f"Song fav failed: {e}")
        
        # 2. Try to list favorites (Simulate Library View)
        print("Fetching Favorites...")
        favs = Favorite.query.filter_by(user_id=user.user_id).all()
        print(f"Found {len(favs)} song favorites.")
        for f in favs:
            print(f.to_dict())

    except Exception as e:
        print("EXCEPTION IN FAVORITES:")
        traceback.print_exc()
