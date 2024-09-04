
import os
import hashlib
import json

# Path to the directory to check and the manifest.json file
directory_to_check = "/path/to/files"  # Modify this path as needed
manifest_path = "/var/www/swg/Patcher Files/manifest.json"

# Calculate MD5 checksum for a file
def calculate_md5(file_path):
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

# Get file information including name and checksum
def get_file_info(directory):
    file_info_list = []
    for root, dirs, files in os.walk(directory):
        for name in files:
            file_path = os.path.join(root, name)
            file_info = {
                'file_name': os.path.relpath(file_path, directory),
                'checksum': calculate_md5(file_path)
            }
            file_info_list.append(file_info)
    return file_info_list

# Load or initialize the manifest.json file
if os.path.exists(manifest_path):
    with open(manifest_path, 'r') as manifest_file:
        manifest = json.load(manifest_file)
else:
    manifest = {}

# Compare and update manifest.json
def update_manifest(file_info_list):
    updated = False
    for file_info in file_info_list:
        file_name = file_info['file_name']
        new_checksum = file_info['checksum']
        
        # If the file is new or has a different checksum, update the manifest
        if manifest.get(file_name) != new_checksum:
            manifest[file_name] = new_checksum
            updated = True
            print(f"Updated checksum for: {file_name}")

    # Save changes to the manifest if updates were made
    if updated:
        with open(manifest_path, 'w') as manifest_file:
            json.dump(manifest, manifest_file, indent=4)
        print("Manifest.json has been updated.")
    else:
        print("No changes detected in the files.")

# Main logic
if __name__ == "__main__":
    file_info_list = get_file_info(directory_to_check)
    update_manifest(file_info_list)
