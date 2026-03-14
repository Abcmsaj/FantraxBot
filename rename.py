import json
import os
import pathlib

# --- CONFIGURATION ---
# Adjust these paths if your folder structure is different
JSON_FILE_PATH = 'src/json/memes.json'
IMAGES_DIR = 'src/images/memes'

def main():
    # 1. Check if files exist
    if not os.path.exists(JSON_FILE_PATH):
        print(f"Error: Could not find {JSON_FILE_PATH}")
        return
    if not os.path.exists(IMAGES_DIR):
        print(f"Error: Could not find directory {IMAGES_DIR}")
        return

    # 2. Load the JSON data
    try:
        with open(JSON_FILE_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
        return

    renamed_count = 0
    errors = 0

    print(f"Processing {len(data)} items...")

    # 3. Iterate through the dictionary keys (the IDs)
    for key, item in data.items():
        old_filename = item.get('file')
        
        if not old_filename:
            print(f"[Skip] ID {key}: No 'file' key found.")
            continue

        # Get the file extension (e.g., .jpg, .png)
        _, ext = os.path.splitext(old_filename)
        
        # Construct the new filename based on the Key ID
        new_filename = f"{key}{ext}"

        # Define full paths
        old_file_path = os.path.join(IMAGES_DIR, old_filename)
        new_file_path = os.path.join(IMAGES_DIR, new_filename)

        # Check if rename is required
        if old_filename != new_filename:
            try:
                # Rename the file on disk
                if os.path.exists(old_file_path):
                    # Check if destination already exists to prevent overwrite
                    if os.path.exists(new_file_path):
                        print(f"[Warn] ID {key}: Destination {new_filename} already exists. Skipping.")
                        errors += 1
                        continue
                    
                    os.rename(old_file_path, new_file_path)
                    
                    # Update the JSON entry
                    item['file'] = new_filename
                    renamed_count += 1
                    print(f"[Renamed] {old_filename} -> {new_filename}")
                else:
                    print(f"[Missing] ID {key}: File {old_filename} not found in images folder.")
                    errors += 1
            except OSError as e:
                print(f"[Error] ID {key}: Could not rename file. {e}")
                errors += 1

    # 4. Save the updated JSON back to the file
    if renamed_count > 0:
        with open(JSON_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4) # indent=4 makes it pretty-printed
        print(f"\nSuccess! Renamed {renamed_count} files and updated {JSON_FILE_PATH}.")
    else:
        print("\nNo files needed renaming.")

if __name__ == "__main__":
    main()