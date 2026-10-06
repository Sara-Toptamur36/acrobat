from app import create_app, db
from sqlalchemy import inspect

def inspect_db():
    app = create_app()
    with app.app_context():
        inspector = inspect(db.engine)
        views = inspector.get_view_names()
        print("--- VIEWS START ---")
        for v in views:
            print(v)
        print("--- VIEWS END ---")

if __name__ == "__main__":
    inspect_db()
