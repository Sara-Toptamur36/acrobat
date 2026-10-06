from app import create_app, db
from app.services.playlist_service import PlaylistService
from app.models.user import User
import traceback

app = create_app()
with app.app_context():
    try:
        print("Debugging Playlist Creation...")
        # Get a user (john@example.com)
        user = User.query.filter_by(email='john@example.com').first()
        if not user:
            print("User john@example.com not found. Creating test user...")
            # Fallback or error
            pass

        print(f"Attempting to create playlist for User ID: {user.user_id}")
        playlist = PlaylistService.create_playlist(user.user_id, "Test Playlist Debug", is_public=True)
        print(f"Playlist created successfully: {playlist}")
        
    except Exception as e:
        print("EXCEPTION IN PLAYLIST CREATION:")
        traceback.print_exc()
