
import requests

BASE_URL = "http://localhost:5000/api"

def test_upload():
    # Attempt to get a token (assuming we can use the same creds as before)
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "user@test.com",
        "password": "Password123!"
    })
    
    if login_res.status_code != 200:
        print("Login failed")
        return
        
    token = login_res.json()['data']['access_token']
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Create a playlist to test with
    p_res = requests.post(f"{BASE_URL}/playlists", headers=headers, json={"name": "Test Upload Playlist"})
    playlist_id = p_res.json()['data']['playlist_id']
    print(f"Created playlist {playlist_id}")
    
    # 2. Upload cover
    # Create a dummy image file
    with open("test_image.png", "wb") as f:
        f.write(b"PNG dummy data")
        
    with open("test_image.png", "rb") as f:
        files = {'cover': ('test_image.png', f, 'image/png')}
        up_res = requests.post(f"{BASE_URL}/uploads/playlists/{playlist_id}/cover", headers=headers, files=files)
        
    print(f"Upload Status: {up_res.status_code}")
    print(f"Upload Response: {up_res.text}")
    
    # 3. Check if it's in the playlist object
    get_res = requests.get(f"{BASE_URL}/playlists/{playlist_id}", headers=headers)
    print(f"Playlist Data: {get_res.json()['data']}")

if __name__ == "__main__":
    test_upload()
