import zipfile
import os
import sys

ZIP_FILE = "fma_small.zip"
EXTRACT_DIR = "."

def setup_audio():
    if not os.path.exists(ZIP_FILE):
        print("Error: fma_small.zip not found.")
        return

    print(f"Extracting {ZIP_FILE}... (This may take a while)")
    try:
        with zipfile.ZipFile(ZIP_FILE, 'r') as zf:
            # check total files
            # print(f"Total files in zip: {len(zf.namelist())}")
            zf.extractall(EXTRACT_DIR)
        print("Extraction complete.")
    except Exception as e:
        print(f"Error extracting: {e}")

if __name__ == '__main__':
    setup_audio()
