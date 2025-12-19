#!/usr/bin/env python3
"""
Simple icon generator for GMARK browser extension.
Creates placeholder SVG icons in different sizes.
"""

import os

def create_svg_icon(size, output_path):
    """Create a simple bookmark icon as SVG"""
    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="{size}" height="{size}" fill="#0066cc" rx="{size//8}"/>
  
  <!-- Bookmark shape -->
  <path d="M {size//4} {size//4} 
           L {size*3//4} {size//4} 
           L {size*3//4} {size*3//4} 
           L {size//2} {size*5//8} 
           L {size//4} {size*3//4} Z" 
        fill="#ffffff" 
        stroke="#ffffff" 
        stroke-width="2"/>
  
  <!-- AI indicator dot -->
  <circle cx="{size*3//4}" cy="{size//4}" r="{size//12}" fill="#ffdd00"/>
</svg>'''
    
    with open(output_path, 'w') as f:
        f.write(svg)
    print(f"✓ Created {output_path}")


def main():
    # Create icons directory
    icons_dir = "icons"
    os.makedirs(icons_dir, exist_ok=True)
    
    print("🎨 Generating GMARK Extension Icons...")
    print("=" * 50)
    
    # Generate icons in required sizes
    sizes = [16, 32, 48, 128]
    
    for size in sizes:
        output_path = os.path.join(icons_dir, f"icon{size}.svg")
        create_svg_icon(size, output_path)
    
    print("=" * 50)
    print("✅ All icons generated!")
    print()
    print("📝 Note: These are SVG placeholders.")
    print("   For production, convert to PNG:")
    print()
    print("   # Using ImageMagick:")
    print("   for size in 16 32 48 128; do")
    print("     convert icons/icon${size}.svg icons/icon${size}.png")
    print("   done")
    print()
    print("   # Or use an online converter:")
    print("   https://cloudconvert.com/svg-to-png")


if __name__ == "__main__":
    main()
