import json
import hashlib
import os
import shutil
from datetime import datetime

# Path to the directory to check and the manifest.json file
directory_to_check = "/var/www/swg/Patcher Files/" 
manifest_path = "/var/www/swg/Patcher Files/manifest.json"

def calculate_md5(file_path):
    with open(file_path, 'rb') as file:
        file_hash = hashlib.md5()
        while chunk := file.read(8192):
            file_hash.update(chunk)
    return file_hash.hexdigest()

def backup_manifest(manifest_path):
    now = datetime.now()
    backup_path = f"{manifest_path}.bak_{now.strftime('%Y%m%d_%H%M%S')}"
    shutil.copy2(manifest_path, backup_path)
    print(f"Backup created: {backup_path}")

def update_manifest():
    backup_manifest(manifest_path)

    with open(manifest_path, 'r') as file:
        manifest = json.load(file)

    required = manifest['required']
    updated_required = []

    for entry in required:
        file_path = os.path.join(directory_to_check, entry['name'])
        if os.path.exists(file_path):
            entry['md5'] = calculate_md5(file_path)
            entry['size'] = os.path.getsize(file_path)
        updated_required.append(entry)

    for root, dirs, files in os.walk(directory_to_check):
        for file_name in files:
            file_path = os.path.join(root, file_name)
            relative_path = os.path.relpath(file_path, directory_to_check)
            if relative_path.endswith('.tre') or relative_path.endswith('.cfg') or relative_path.endswith('.iff'):
                if not any(entry['name'] == relative_path for entry in updated_required):
                    new_entry = {
                        'name': relative_path,
                        'size': os.path.getsize(file_path),
                        'md5': calculate_md5(file_path),
                        'url': 'https://swg.hellafast.io/Patcher%20Files/' + relative_path
                    }
                    updated_required.append(new_entry)

    manifest['required'] = updated_required

    with open(manifest_path, 'w') as file:
        json.dump(manifest, file, indent=4)

if __name__ == "__main__":
    update_manifest()
