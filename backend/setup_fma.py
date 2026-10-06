import urllib.request
import zipfile
import os
import ssl

# Bypass SSL errors if certificates are missing
ssl._create_default_https_context = ssl._create_unverified_context

URL = "https://os.unil.cloud.switch.ch/fma/fma_metadata.zip"
ZIP_FILE = "fma_metadata.zip"
EXTRACT_DIR = "." # Extracts to fma_metadata/ folder structure kept in zip

def setup_metadata():
    print(f"Downloading {URL}...")
    try:
        urllib.request.urlretrieve(URL, ZIP_FILE)
        print("Download complete.")
    except Exception as e:
        print(f"Download FAILED: {e}")
        return

    if not os.path.exists(ZIP_FILE):
        print("Zip file not found!")
        return

    print("Extracting CSVs...")
    try:
        with zipfile.ZipFile(ZIP_FILE, 'r') as zf:
            # List of files we want
            targets = ['fma_metadata/tracks.csv', 'fma_metadata/genres.csv', 'fma_metadata/features.csv']
            
            for target in targets:
                try:
                    zf.extract(target, EXTRACT_DIR)
                    print(f"Extracted: {target}")
                except KeyError:
                    print(f"Warning: {target} not found in zip.")
                    
        print("Extraction complete.")
        
        # Cleanup zip if desired, but maybe keep it for safety? User didn't ask to delete.
        # os.remove(ZIP_FILE) 

    except zipfile.BadZipFile:
        print("Error: The downloaded file is not a valid zip file.")
    except Exception as e:
        print(f"Extraction error: {e}")

if __name__ == "__main__":
    setup_metadata()
