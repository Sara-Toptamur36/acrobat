import urllib.request
import json
import sys

def check(url):
    try:
        resp = urllib.request.urlopen(url)
        print(f"{url.split('/')[-1].upper()}:{resp.getcode()}")
        return True
    except Exception as e:
        print(f"{url.split('/')[-1].upper()}:ERROR {e}")
        return False

base = "http://127.0.0.1:5000/api"
print("--- VERIFICATION START ---")
h = check(f"{base}/health")
a = check(f"{base}/albums?limit=1")
r = check(f"{base}/artists?limit=1")
print("--- VERIFICATION END ---")

if h and a and r:
    sys.exit(0)
else:
    sys.exit(1)
