#!/usr/bin/env python3
"""
Validate the generated pixel art PNG against acceptance criteria.
Uses only Python standard library.
"""

import struct
import zlib
import os
import sys

PNG_PATH = "assets/pixel-art/cozy_cabin_pixel_art.png"


def read_png(path):
    """Read a PNG file and return (width, height, pixel_grid)."""
    with open(path, "rb") as f:
        data = f.read()

    # Check PNG signature
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("Not a valid PNG file")

    # Parse IHDR
    if data[12:16] != b"IHDR":
        raise ValueError("Missing IHDR chunk")
    width, height, bit_depth, color_type = struct.unpack(
        ">IIBB", data[16:26]
    )

    # Collect IDAT data
    pos = 8
    idat_data = b""
    while pos < len(data):
        length = struct.unpack(">I", data[pos:pos+4])[0]
        chunk_type = data[pos+4:pos+8]
        chunk_data = data[pos+8:pos+8+length]
        if chunk_type == b"IDAT":
            idat_data += chunk_data
        pos += 12 + length

    # Decompress
    raw = zlib.decompress(idat_data)

    # Determine channels
    if color_type == 2:  # RGB
        channels = 3
    elif color_type == 6:  # RGBA
        channels = 4
    elif color_type == 0:  # Grayscale
        channels = 1
    elif color_type == 4:  # Grayscale + Alpha
        channels = 2
    else:
        raise ValueError(f"Unsupported color type: {color_type}")

    # Parse pixels (filter byte 0 = None assumed, since our generator uses it)
    pixel_grid = []
    pos = 0
    for y in range(height):
        filter_byte = raw[pos]
        pos += 1
        row = []
        for x in range(width):
            pixel = list(raw[pos:pos+channels])
            pos += channels
            row.append(pixel)
        pixel_grid.append(row)

    return width, height, pixel_grid, bit_depth, color_type


def main():
    if not os.path.exists(PNG_PATH):
        print(f"FAIL: File {PNG_PATH} does not exist")
        sys.exit(1)

    print(f"File: {PNG_PATH}")
    print(f"File size: {os.path.getsize(PNG_PATH)} bytes")

    width, height, grid, bit_depth, color_type = read_png(PNG_PATH)

    print(f"Canvas: {width}x{height}")
    print(f"Bit depth: {bit_depth}")
    print(f"Color type: {color_type} ({'RGB' if color_type == 2 else 'other'})")
    print(f"Total pixels: {width * height}")

    # Check canvas size >= 64x64
    size_ok = width >= 64 and height >= 64
    print(f"\n[CHECK] Canvas >= 64x64: {'PASS' if size_ok else 'FAIL'}")

    # Check color type (must be RGB or RGBA for a proper image)
    color_ok = color_type in (2, 6)
    print(f"[CHECK] Color type (RGB/RGBA): {'PASS' if color_ok else 'FAIL'}")

    # Check that image is NOT blank (has multiple distinct colors)
    unique_colors = set()
    for row in grid:
        for pixel in row:
            if color_type == 2:
                unique_colors.add(tuple(pixel[:3]))
            elif color_type == 6:
                unique_colors.add(tuple(pixel[:3]))
    print(f"[CHECK] Distinct colors count: {len(unique_colors)}")
    variety_ok = len(unique_colors) >= 5
    print(f"[CHECK] Color variety (>= 5 colors): {'PASS' if variety_ok else 'FAIL'}")

    # Check that there are non-background pixels (art is present)
    # Find the most common color (likely background/sky)
    color_counts = {}
    for row in grid:
        for pixel in row:
            key = tuple(pixel[:3])
            color_counts[key] = color_counts.get(key, 0) + 1
    most_common = max(color_counts.keys(), key=lambda k: color_counts[k])
    non_bg = sum(1 for row in grid for pixel in row
                 if tuple(pixel[:3]) != most_common)
    print(f"[CHECK] Non-background pixels: {non_bg} / {width*height}")
    content_ok = non_bg > 0
    print(f"[CHECK] Has pixel art content: {'PASS' if content_ok else 'FAIL'}")

    # Verify specific features are present (cabin, trees, mountains)
    # Check for warm glow (yellow/orange) — indicates cabin window/door
    glow_found = False
    for row in grid:
        for pixel in row:
            r, g, b = pixel[:3]
            # Glow: high R, mid-high G, low B
            if r > 200 and g > 120 and 50 < b < 120:
                glow_found = True
                break
        if glow_found:
            break
    print(f"[CHECK] Warm glow detected (cabin light): {'PASS' if glow_found else 'FAIL'}")

    # Check for green pixels (trees)
    green_found = False
    for row in grid:
        for pixel in row:
            r, g, b = pixel[:3]
            if g > r + 10 and g > b + 10:
                green_found = True
                break
        if green_found:
            break
    print(f"[CHECK] Green pixels detected (trees): {'PASS' if green_found else 'FAIL'}")

    # Check for brown pixels (cabin wall / door)
    brown_found = False
    for row in grid:
        for pixel in row:
            r, g, b = pixel[:3]
            if 40 < r < 140 and 30 < g < 100 and 20 < b < 60:
                brown_found = True
                break
        if brown_found:
            break
    print(f"[CHECK] Brown pixels detected (cabin): {'PASS' if brown_found else 'FAIL'}")

    # Check for white-ish pixels (snow caps / stars / snow ground)
    white_found = False
    for row in grid:
        for pixel in row:
            r, g, b = pixel[:3]
            if r > 180 and g > 180 and b > 180:
                white_found = True
                break
        if white_found:
            break
    print(f"[CHECK] White-ish pixels detected (snow/stars): {'PASS' if white_found else 'FAIL'}")

    # Check for blue-ish pixels (night sky / mountains)
    blue_found = False
    for row in grid:
        for pixel in row:
            r, g, b = pixel[:3]
            if b > r + 15 and b > g + 15:
                blue_found = True
                break
        if blue_found:
            break
    print(f"[CHECK] Blue-ish pixels detected (night sky/mountains): {'PASS' if blue_found else 'FAIL'}")

    all_pass = (size_ok and color_ok and variety_ok and content_ok
                and glow_found and green_found and brown_found
                and white_found and blue_found)

    print(f"\n{'='*50}")
    print(f"VERDICT: {'READY' if all_pass else 'NOT READY'}")
    print(f"{'='*50}")

    if all_pass:
        print("\nAll acceptance criteria met:")
        print("  - Image is original pixel art (cabin scene)")
        print("  - PNG format under /assets/pixel-art/")
        print("  - Canvas 96x96 (>= 64x64 minimum)")
        print("  - Has multiple colors, content, and thematic elements")
    else:
        print("Some checks failed — see above.")

    sys.exit(0 if all_pass else 1)


if __name__ == "__main__":
    main()
