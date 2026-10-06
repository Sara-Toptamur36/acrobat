import urllib.request
import json

API_BASE = "http://localhost:5000/api"

def check():
    try:
        url = f"{API_BASE}/songs?limit=5"
        with urllib.request.urlopen(url) as f:
            data = json.loads(f.read().decode('utf-8'))
            print(f"Data Type: {type(data)}")
            if isinstance(data, dict):
                print(f"Keys: {list(data.keys())}")
                # Print type of value for each key
                for k in data.keys():
                    print(f"Key '{k}' -> {type(data[k])}")
            elif isinstance(data, list):
                print("Data is a List.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    check()
