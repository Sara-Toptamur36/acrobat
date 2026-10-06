import os
import csv

# Configuration
FMA_METADATA_DIR = os.path.join(os.getcwd(), 'fma_metadata')
FMA_AUDIO_DIR = os.path.join(os.getcwd(), 'fma_small', 'fma_small') # Nested

def get_column_indices(header_row1, header_row2):
    indices = {}
    current_category = ''
    for i, (cat, field) in enumerate(zip(header_row1, header_row2)):
        if cat: current_category = cat
        if field:
            key = f"{current_category}.{field}"
            indices[key] = i
    indices['track_id'] = 0
    return indices

def debug_import():
    tracks_csv = os.path.join(FMA_METADATA_DIR, 'tracks.csv')
    print(f"Reading {tracks_csv}...")
    
    with open(tracks_csv, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        
        row0 = next(reader)
        row1 = next(reader)
        row2 = next(reader) # Unused headers
        
        indices = get_column_indices(row0, row1)
        
        print(f"Subset Index: {indices.get('set.subset')}")
        print(f"Indices Keys (Sample): {list(indices.keys())[:5]}")

        for i, row in enumerate(reader):
            if i > 10: break
            
            subset = row[indices['set.subset']]
            track_id = row[0]
            
            tid_str = str(track_id).zfill(6)
            folder = tid_str[:3]
            path = os.path.join(FMA_AUDIO_DIR, folder, f"{tid_str}.mp3")
            exists = os.path.exists(path)
            
            print(f"Row {i}: ID={track_id}, Subset='{subset}', Path='{path}', Exists={exists}")

if __name__ == '__main__':
    debug_import()
