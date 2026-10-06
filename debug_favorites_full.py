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
        print("Debugging Full Favorites...")
        user = User.query.filter_by(email='john@example.com').first()
        
        # Album
        album = Album.query.first()
        if album:
            print(f"Adding favorite album: {album.album_id}")
            fav = AlbumFavorite(user_id=user.user_id, album_id=album.album_id)
            db.session.add(fav)
            try:
                db.session.commit()
                print("Album favorite added.")
            except Exception as e:
                db.session.rollback()
                print(f"Album fav failed: {e}")

        # Artist
        artist = Artist.query.first()
        if artist:
            print(f"Adding favorite artist: {artist.artist_id}")
            fav = ArtistFavorite(user_id=user.user_id, artist_id=artist.artist_id)
            db.session.add(fav)
            try:
                db.session.commit()
                print("Artist favorite added.")
            except Exception as e:
                db.session.rollback()
                print(f"Artist fav failed: {e}")

        # Fetch All
        print("Fetching All Favorites...")
        s_favs = Favorite.query.filter_by(user_id=user.user_id).all()
        a_favs = AlbumFavorite.query.filter_by(user_id=user.user_id).all()
        ar_favs = ArtistFavorite.query.filter_by(user_id=user.user_id).all()
        
        print(f"Songs: {len(s_favs)}")
        print(f"Albums: {len(a_favs)}")
        print(f"Artists: {len(ar_favs)}")

    except Exception as e:
        print("EXCEPTION IN FULL FAVORITES:")
        traceback.print_exc()
