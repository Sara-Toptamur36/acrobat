from app import create_app, db
from app.models.user import User
import traceback

app = create_app()
with app.app_context():
    try:
        print("Querying user...")
        u = User.query.filter_by(email='john@example.com').first()
        print(f"User found: {u}")
        if u:
            print(f"Checking attributes...")
            print(f"User ID: {u.user_id}")
            print(f"Email: {u.email}")
            print(f"Role: {getattr(u, 'role', 'MISSING')}")
            print(f"Is Admin: {u.is_admin}")
            print(f"Profile Image: {u.profile_image}")
            print("Convert to dict...")
            print(u.to_dict())
            print("Success!")
        else:
            print("User not found!")
    except Exception as e:
        print("EXCEPTION OCCURRED:")
        traceback.print_exc()
