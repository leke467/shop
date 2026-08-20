"""
Check logo images in project/public/
"""
import os
from PIL import Image

public_dir = r"c:\Users\Leke\Documents\GitHub\shop\project\public"
for fname in os.listdir(public_dir):
    if fname.endswith(".png"):
        fpath = os.path.join(public_dir, fname)
        img = Image.open(fpath)
        print(f"File: {fname:<20} | Size: {os.path.getsize(fpath):>8} bytes | Dimensions: {img.size}")
