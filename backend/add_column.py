from app import create_app, db
from sqlalchemy import text

def add_column():
    app = create_app()
    with app.app_context():
        try:
            with db.engine.connect() as conn:
                conn.execute(text("ALTER TABLE songs ADD COLUMN file_path VARCHAR(500)"))
                conn.commit()
                print("Column 'file_path' added successfully")
        except Exception as e:
            print(f"Error (might exist already): {e}")

if __name__ == "__main__":
    add_column()
