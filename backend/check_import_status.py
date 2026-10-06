import urllib.request
import json

API_BASE = "http://localhost:5000/api"

def check():
    print("CHECKING_IMPORT_STATUS")
    try:
        # Fetch up to 100 recent songs
        url = f"{API_BASE}/songs?limit=100&sort_by=created_at&order=desc"
        with urllib.request.urlopen(url) as f:
            data = json.loads(f.read().decode('utf-8'))
            items = data.get('items', data) if isinstance(data, dict) else data
            
            fma_found = False
            sample_title = ""
            
            for s in items:
                title = s.get('title', '')
                # FMA dataset often has titles like "Electric Avenue" or "Track ..."
                # Seed data is usually "Symphony", "Sonata", "Adele" (if manually added)
                # We imported 50 songs.
                if title and title not in ["Symphony No. 9", "Moonlight Sonata", "The Four Seasons", "Adele"]:
                     fma_found = True
                     sample_title = title
                     break
            
            if fma_found:
                print(f"RESULT: FMA_FOUND ({sample_title})")
            else:
                print("RESULT: FMA_NOT_FOUND (Only Seed Data)")
                
    except Exception as e:
        print(f"RESULT: API_ERROR ({e})")

if __name__ == '__main__':
    check()
