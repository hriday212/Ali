import os
from PIL import Image

def remove_white_and_crop(img_path, output_path):
    img = Image.open(img_path).convert("RGBA")
    data = img.getdata()
    new_data = []
    
    for item in data:
        r, g, b, a = item
        lum = (r + g + b) / 3
        # Any very bright pixel close to white becomes transparent or partially transparent
        if r > 230 and g > 230 and b > 230:
            # Smooth fade alpha out towards white
            alpha = max(0, int(255 - (lum - 230) * (255/25.0)))
            new_data.append((r, g, b, alpha))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    # Crop out uneven borders tightly around the non-transparent pixels
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(output_path)

files = [
    ("C.png", "public/char-1-C.png"),
    ("L.png", "public/char-2-l.png"),
    ("y.png", "public/char-3-y.png"),
    ("p design.png", "public/char-4-p.png"),
    ("s.png", "public/char-5-s.png"),
    ("o.png", "public/char-6-o.png")
]

for src, dst in files:
    try:
        if os.path.exists(src):
            remove_white_and_crop(src, dst)
            print(f"Processed {src} -> {dst}")
        else:
            print(f"Not found: {src}")
    except Exception as e:
        print(f"Error processing {src}: {e}")
