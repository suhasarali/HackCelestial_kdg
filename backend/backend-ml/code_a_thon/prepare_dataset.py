import os
import shutil

SRC_ROOT = "datasets"
SPLITS = ["train", "valid", "test"]

for split in SPLITS:
    src_dir = os.path.join(SRC_ROOT, split)
    if not os.path.exists(src_dir):
        continue

    for file in os.listdir(src_dir):
        # we only care about images
        if not file.lower().endswith((".jpg", ".jpeg", ".png")):
            continue

        # extract class name from filename
        class_name = file.split("_")[0]

        class_dir = os.path.join(src_dir, class_name)
        os.makedirs(class_dir, exist_ok=True)

        src_path = os.path.join(src_dir, file)
        dst_path = os.path.join(class_dir, file)

        shutil.move(src_path, dst_path)

print("Dataset reorganization complete.")
