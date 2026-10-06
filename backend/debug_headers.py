import csv
import os

CSV_PATH = os.path.join(os.getcwd(), 'fma_metadata', 'tracks.csv')

def debug():
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for i in range(4):
            print(f"Row {i}: {next(reader)}")

if __name__ == '__main__':
    debug()
