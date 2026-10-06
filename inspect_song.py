import sys
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL and DATABASE_URL.startswith('mysql://'):
    DATABASE_URL = DATABASE_URL.replace('mysql://', 'mysql+pymysql://')

engine = create_engine(DATABASE_URL)

def inspect_song(title):
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM songs WHERE title LIKE :title"), {"title": f"%{title}%"})
        songs = result.fetchall()
        
        if not songs:
            print(f"No song found matching '{title}'")
            return
            
        columns = result.keys()
        for row in songs:
            print("-" * 20)
            data = dict(zip(columns, row))
            for k, v in data.items():
                print(f"{k}: {v}")

if __name__ == "__main__":
    inspect_song("A Quiet Lousy Roar")
    inspect_song("cambaz")
