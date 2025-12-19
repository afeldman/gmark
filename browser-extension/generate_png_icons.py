#!/usr/bin/env python3
"""
Generate PNG icons for GMARK browser extension using PIL
"""

import os
from PIL import Image, ImageDraw

def create_png_icon(size, output_path):
    """Create a simple bookmark icon as PNG"""
    
    # Create new image with white background
    img = Image.new('RGB', (size, size), color='#0066cc')
    draw = ImageDraw.Draw(img)
    
    # Calculate proportions
    margin = size // 6
    bookmark_left = margin
    bookmark_right = size - margin
    bookmark_top = margin
    bookmark_bottom = size - margin * 2
    notch_size = size // 8
    
    # Draw bookmark shape (filled polygon)
    points = [
        (bookmark_left, bookmark_top),              # Top-left
        (bookmark_right, bookmark_top),             # Top-right
        (bookmark_right, bookmark_bottom),          # Bottom-right corner
        (size // 2, bookmark_bottom - notch_size),  # Center point (notch)
        (bookmark_left, bookmark_bottom),           # Bottom-left corner
    ]
    
    draw.polygon(points, fill='#ffffff', outline='#ffffff')
    
    # Draw AI indicator dot (yellow circle at top-right)
    dot_size = size // 6
    dot_right = bookmark_right - margin // 2
    dot_top = bookmark_top + margin // 2
    draw.ellipse(
        [(dot_right - dot_size, dot_top), 
         (dot_right + dot_size, dot_top + dot_size * 2)],
        fill='#ffdd00'
    )
    
    # Save as PNG
    img.save(output_path)
    print(f"✓ Created {output_path}")


def main():
    # Create icons directory if not exists
    icons_dir = "icons"
    os.makedirs(icons_dir, exist_ok=True)
    
    print("🎨 Generating GMARK Extension PNG Icons...")
    print("=" * 50)
    
    # Generate icons in required sizes
    sizes = [16, 32, 48, 128]
    
    for size in sizes:
        output_path = os.path.join(icons_dir, f"icon{size}.png")
        create_png_icon(size, output_path)
    
    print("=" * 50)
    print("✅ All PNG icons generated!")
    print()
    print("Extension kann jetzt geladen werden:")
    print("  chrome://extensions/")
    print("  → Developer Mode")
    print("  → 'Entpackte Extension laden'")
    print("  → Ordner wählen")


if __name__ == "__main__":
    main()
