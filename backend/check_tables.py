from app import create_app, db
from sqlalchemy import inspect

app = create_app()
with app.app_context():
    inspector = inspect(db.engine)
    print("Tables in DB:")
    for t in inspector.get_table_names():
        print(f" - {t}")
