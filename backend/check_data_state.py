import urllib.request
import json

API_BASE = "http://localhost:5000/api"

def check():
    print("--- Checking Data State ---")
    
    # 1. Get Album 9
    try:
        with urllib.request.urlopen(f"{API_BASE}/albums/9") as f:
            data = json.loads(f.read().decode('utf-8'))
            title = data.get('title') if isinstance(data, dict) else data[0].get('title')
            print(f"Album 9 Title: '{title}'")
    except Exception as e:
        print(f"Album 9 lookup failed: {e}")

    # 2. Count Songs
    try:
        with urllib.request.urlopen(f"{API_BASE}/songs?limit=100") as f:
            data = json.loads(f.read().decode('utf-8'))
            items = data.get('items', data) if isinstance(data, dict) else data
            print(f"Total Songs Visible: {len(items)}")
            if len(items) > 0:
                print(f"First Song: {items[0].get('title')}")
                print(f"Last Song: {items[-1].get('title')}")
    except Exception as e:
        print(f"Song list failed: {e}")

if __name__ == '__main__':
    check()
