"""
Generate high-resolution transparent PNG of the official 3D Isometric Green/Gold Polygon Cube Logo + MultiShop Text.
"""
from PIL import Image, ImageDraw, ImageFont
import math

# Create 600x120 transparent image
width, height = 600, 120
img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Dark rounded box for 3D Polygon Cube
bx, by, bw, bh = 10, 10, 100, 100
r = 24
draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=r, fill=(15, 23, 42, 255), outline=(16, 185, 129, 150), width=3)

# Draw 3D Isometric Polygon Cube inside badge
cx, cy = 60, 60
s = 36 # scale

# Vertices
v_top = (cx, cy - s)
v_ur = (cx + s * math.cos(math.radians(30)), cy - s * math.sin(math.radians(30)))
v_lr = (cx + s * math.cos(math.radians(30)), cy + s * math.sin(math.radians(30)))
v_bot = (cx, cy + s)
v_ll = (cx - s * math.cos(math.radians(30)), cy + s * math.sin(math.radians(30)))
v_ul = (cx - s * math.cos(math.radians(30)), cy - s * math.sin(math.radians(30)))
v_ctr = (cx, cy)

# Facets
draw.polygon([v_top, v_ur, v_ctr, v_ul], fill=(16, 185, 129, 255)) # Top: Emerald
draw.polygon([v_ul, v_ctr, v_bot, v_ll], fill=(52, 211, 153, 255)) # Left: Mint
draw.polygon([v_ur, v_lr, v_bot, v_ctr], fill=(245, 158, 11, 255)) # Right: Gold

# Highlight lines
draw.line([v_ctr, v_top], fill=(255, 255, 255, 140), width=2)
draw.line([v_ctr, v_ll], fill=(255, 255, 255, 140), width=2)
draw.line([v_ctr, v_lr], fill=(255, 255, 255, 140), width=2)

# Save logo-v2-3d-cube.png
out_path = r"c:\Users\Leke\Documents\GitHub\shop\project\public\logo-v2-3d-cube.png"
img.save(out_path, "PNG")
print("Saved fresh logo image to:", out_path)
