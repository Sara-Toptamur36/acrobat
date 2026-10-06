
import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_dashboard_endpoints():
    print("Testing Dashboard Endpoints...")
    endpoints = ["/songs", "/artists", "/albums", "/playlists"]
    for ep in endpoints:
        res = requests.get(f"{BASE_URL}{ep}?limit=1")
        print(f"{ep}: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            print(f"  Success: {data.get('success')}")
            # Check structure
            if ep == "/songs":
                print(f"  Total items: {data.get('data', {}).get('pagination', {}).get('total_items')}")

def get_token():
    # Attempt to login with the test account created earlier
    payload = {"email": "verify_final@example.com", "password": "password123"}
    res = requests.post(f"{BASE_URL}/auth/login", json=payload)
    if res.status_code == 200:
        return res.json()['data']['access_token']
    return None

def test_favorites_sync():
    token = get_token()
    if not token:
        print("Could not get token for favorites test")
        return

    headers = {"Authorization": f"Bearer {token}"}
    
    # Get a song ID
    songs_res = requests.get(f"{BASE_URL}/songs?limit=1")
    song_id = songs_res.json()['data']['data'][0]['song_id']
    print(f"Liking song_id: {song_id}")
    
    # Toggle like
    res = requests.post(f"{BASE_URL}/playlists/like", json={"song_id": song_id}, headers=headers)
    print(f"Like toggle: {res.status_code} - {res.json()}")
    
    # Check playlists
    plist_res = requests.get(f"{BASE_URL}/playlists", headers=headers)
    playlists = plist_res.json()['data']['playlists']
    print(f"Playlists count: {len(playlists)}")
    for p in playlists:
        print(f"  Playlist: {p['name']} (songs: {p['song_count']})")

if __name__ == "__main__":
    test_dashboard_endpoints()
    test_favorites_sync()
