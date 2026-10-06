import urllib.request
import json
import os

API_BASE = "http://localhost:5000/api"

def query_api():
    # 1. Query Album 9
    try:
        print(f"--- Fetching Album 9 ---")
        with urllib.request.urlopen(f"{API_BASE}/albums/9") as f:
            raw = f.read().decode('utf-8')
            print(f"Raw Album 9: {raw[:500]}...")
            
    except Exception as e:
        print(f"Check Album 9 Failed: {e}")

    # 2. Query Recent Songs
    try:
        print(f"\n--- Fetching Recent Songs ---")
        with urllib.request.urlopen(f"{API_BASE}/songs?limit=5&sort_by=created_at&order=desc") as f:
            raw = f.read().decode('utf-8')
            print(f"Raw Recent Songs: {raw[:500]}...")
            
            data = json.loads(raw)
            # Try to find list
            songs = []
            if isinstance(data, list): songs = data
            elif isinstance(data, dict):
                if 'items' in data: songs = data['items']
                elif 'songs' in data: songs = data['songs']
                else: 
                    # maybe values?
                    pass
            
            print(f"Found {len(songs)} songs in response.")
            for s in songs[:5]:
                print(f"Checking: {s.get('title')} ({s.get('file_path')})")
                if s.get('file_path'):
                    fp = s.get('file_path')
                    path = os.path.join(os.getcwd(), 'app', 'static', 'uploads', 'songs', fp)
                    print(f"  Path: {path} -> {os.path.exists(path)}")

    except Exception as e:
        print(f"Check Recent Failed: {e}")

if __name__ == '__main__':
    query_api()
