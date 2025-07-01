import os

base_path = r'U:\JIMBODASH'

# Define the directory structure
folders_to_create = [
    'backend',
    'backend/utils',
    'frontend',
    'frontend/static',
    'frontend/static/css',
    'frontend/static/js',
    'frontend/static/img',
    'frontend/templates',
    'config'
]

print(f"Attempting to create directory structure in: {base_path}")

# Create the base directory if it doesn't exist
if not os.path.exists(base_path):
    try:
        os.makedirs(base_path)
        print(f"Created base directory: {base_path}")
    except OSError as e:
        print(f"Error creating base directory {base_path}: {e}")
        # Exit if base directory cannot be created
        exit()
else:
    print(f"Base directory already exists: {base_path}")


# Create subdirectories
for folder in folders_to_create:
    folder_path = os.path.join(base_path, folder)
    if not os.path.exists(folder_path):
        try:
            os.makedirs(folder_path)
            print(f"Created directory: {folder_path}")
        except OSError as e:
            print(f"Error creating directory {folder_path}: {e}")
    else:
        print(f"Directory already exists: {folder_path}")

print("Directory structure creation attempt finished.")
print("Please check U:\\JIMBODASH to confirm folders were created.")

