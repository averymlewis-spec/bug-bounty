#!/usr/bin/env python3
"""
Generate an original pixel art image: "Cozy Mountain Cabin at Night"
Uses only Python standard library (struct + zlib) to write a PNG file.
Canvas: 96x96 pixels (above the 64x64 minimum).
Theme: A pixel-art cabin nestled among pine trees under a starry night sky
       with snow-capped mountains in the background.
"""

import struct
import zlib
import os

# ---------------------------------------------------------------------------
# Canvas dimensions
# ---------------------------------------------------------------------------
WIDTH = 96
HEIGHT = 96

# ---------------------------------------------------------------------------
# Color palette (R, G, B) - limited palette for authentic pixel art feel
# ---------------------------------------------------------------------------
COLORS = {
    # Sky / night
    "night_sky":    (15, 25, 55),
    "star_white":   (230, 235, 245),
    "star_gold":    (240, 220, 120),

    # Mountains
    "mountain_dark":   (35, 50, 85),
    "mountain_mid":    (50, 65, 100),
    "snow_cap":        (235, 240, 245),

    # Pine trees
    "tree_dark":   (15, 55, 25),
    "tree_mid":    (20, 75, 30),
    "tree_light":  (30, 100, 40),
    "trunk_dark":  (60, 35, 15),
    "trunk_mid":   (80, 50, 25),

    # Cabin
    "cabin_wall":    (110, 70, 45),
    "cabin_wall_alt":(95, 60, 40),
    "cabin_dark":    (85, 55, 38),
    "roof_dark":     (55, 35, 25),
    "roof_mid":      (70, 45, 30),
    "roof_light":    (85, 55, 35),
    "door":          (90, 45, 20),
    "door_knob":     (190, 180, 120),
    "window_glass":  (200, 230, 250),
    "window_frame":  (75, 50, 25),

    # Cabin light glow
    "glow_yellow": (245, 210, 110),
    "glow_orange": (250, 170, 80),

    # Ground
    "ground_dark":  (45, 40, 45),
    "ground_mid":   (55, 50, 55),
    "snow_ground":  (230, 235, 240),
    "snow_shadow":  (200, 210, 220),

    # Ground details
    "bush":       (25, 65, 30),
    "bush_light": (35, 85, 40),
    "path":       (60, 55, 60),
    "path_dark":  (50, 45, 50),
}

# ---------------------------------------------------------------------------
# Build the pixel grid: list of rows, each row is a list of (R,G,B) tuples
# ---------------------------------------------------------------------------

def blank_canvas(fill=COLORS["night_sky"]):
    """Create a HEIGHT x WIDTH grid filled with the given color."""
    return [[fill[:] for _ in range(WIDTH)] for _ in range(HEIGHT)]


def set_pixel(grid, x, y, color):
    """Set a single pixel, bounds-checked."""
    if 0 <= x < WIDTH and 0 <= y < HEIGHT:
        grid[y][x] = list(color)


def fill_rect(grid, x0, y0, x1, y1, color):
    """Fill a rectangle (inclusive) with a solid color."""
    for y in range(max(0, y0), min(HEIGHT, y1 + 1)):
        for x in range(max(0, x0), min(WIDTH, x1 + 1)):
            grid[y][x] = list(color)


def draw_stars(grid):
    """Scatter stars across the night sky."""
    # Star positions (x, y) — carefully placed for visual balance
    star_positions = [
        (5, 8), (12, 3), (20, 10), (28, 5), (35, 12), (42, 2), (50, 8),
        (58, 4), (63, 11), (70, 3), (78, 9), (85, 5), (9, 15), (16, 13),
        (24, 16), (31, 14), (40, 17), (48, 14), (55, 16), (62, 15),
        (70, 17), (77, 14), (84, 13), (4, 20), (11, 19), (18, 21),
        (26, 19), (33, 22), (40, 20), (47, 21), (54, 19), (61, 22),
        (68, 20), (75, 18), (82, 21), (88, 17), (3, 25), (10, 24),
        (17, 26), (25, 24), (32, 26), (39, 25), (46, 24), (53, 26),
        (60, 25), (67, 24), (74, 26), (81, 25), (88, 24), (6, 28),
        (13, 27), (21, 29), (28, 28), (35, 27), (43, 29), (50, 28),
        (57, 27), (65, 29), (72, 28), (79, 27), (86, 29),
    ]
    for sx, sy in star_positions:
        set_pixel(grid, sx, sy, COLORS["star_white"])
        # Occasional brighter/golden star
        if (sx + sy) % 7 == 0:
            set_pixel(grid, sx, sy, COLORS["star_gold"])


def draw_mountains(grid):
    """Draw layered mountain silhouettes with snow caps."""
    # Distant mountains (back layer) - peaks at y ~ 28-35
    # Left peak
    fill_rect(grid, 0, 28, 0, 28, COLORS["mountain_dark"])
    for i in range(1, 12):
        fill_rect(grid, i, 28, i, 28, COLORS["mountain_dark"])
    # Actually draw proper triangle peaks
    # Peak 1 (left)
    peak1_x = 10
    for row_y in range(20, 36):
        width_at_y = (36 - row_y) * 2 + 1
        x_start = peak1_x - width_at_y // 2
        for px in range(x_start, x_start + width_at_y + 1):
            if 0 <= px < WIDTH:
                grid[row_y][px] = list(COLORS["mountain_dark"])

    # Snow cap on peak 1
    for dx in range(-2, 3):
        set_pixel(grid, peak1_x + dx, 18, COLORS["snow_cap"])
    set_pixel(grid, peak1_x, 17, COLORS["snow_cap"])

    # Peak 2 (middle)
    peak2_x = 38
    for row_y in range(18, 36):
        width_at_y = (36 - row_y) * 3 + 1
        x_start = peak2_x - width_at_y // 2
        for px in range(x_start, x_start + width_at_y + 1):
            if 0 <= px < WIDTH:
                grid[row_y][px] = list(COLORS["mountain_mid"])

    # Snow cap on peak 2
    for dx in range(-3, 4):
        set_pixel(grid, peak2_x + dx, 15, COLORS["snow_cap"])
    set_pixel(grid, peak2_x, 14, COLORS["snow_cap"])
    set_pixel(grid, peak2_x - 4, 15, COLORS["snow_cap"])
    set_pixel(grid, peak2_x + 4, 15, COLORS["snow_cap"])

    # Peak 3 (right)
    peak3_x = 72
    for row_y in range(22, 36):
        width_at_y = (36 - row_y) * 2 + 1
        x_start = peak3_x - width_at_y // 2
        for px in range(x_start, x_start + width_at_y + 1):
            if 0 <= px < WIDTH:
                grid[row_y][px] = list(COLORS["mountain_dark"])

    # Snow cap on peak 3
    for dx in range(-2, 3):
        set_pixel(grid, peak3_x + dx, 20, COLORS["snow_cap"])
    set_pixel(grid, peak3_x, 19, COLORS["snow_cap"])

    # Foreground snow line
    fill_rect(grid, 0, 36, WIDTH - 1, 42, COLORS["snow_ground"])
    fill_rect(grid, 0, 43, WIDTH - 1, 45, COLORS["snow_shadow"])


def draw_ground(grid):
    """Draw snow-covered ground with a path leading to the cabin."""
    # Snow ground
    fill_rect(grid, 0, 46, WIDTH - 1, HEIGHT - 1, COLORS["snow_ground"])

    # Path — winding from foreground up to cabin
    path_points = [
        # (x, y) path stepping
        (48, 95), (48, 88), (47, 86), (48, 84), (47, 82), (48, 80),
        (49, 78), (48, 76), (49, 74), (48, 72), (49, 70), (50, 68),
        (49, 66), (50, 64), (49, 62), (50, 60), (51, 58), (50, 56),
        (51, 54), (50, 52), (51, 50), (50, 48), (51, 46), (52, 44),
        (51, 42),
    ]
    for px, py in path_points:
        set_pixel(grid, px, py, COLORS["path"])
        set_pixel(grid, px - 1, py, COLORS["path"])
        set_pixel(grid, px + 1, py, COLORS["path"])
        # Path edges
        if py % 2 == 0:
            set_pixel(grid, px - 2, py, COLORS["path_dark"])
            set_pixel(grid, px + 2, py, COLORS["path_dark"])

    # Snow shadow details on ground
    for y in range(46, HEIGHT, 3):
        for x in range(0, WIDTH, 5):
            offset = (y * 7 + x * 3) % 8
            if offset < 3:
                grid[y][x] = list(COLORS["snow_shadow"])


def draw_tree(grid, x_center, y_base, height):
    """Draw a pine tree at (x_center, y_base) with given height."""
    trunk_height = height // 4
    trunk_top = y_base - height

    # Trunk
    trunk_width = max(2, height // 6)
    for y in range(trunk_top, y_base + 1):
        for dx in range(-trunk_width // 2, trunk_width // 2 + 1):
            set_pixel(grid, x_center + dx, y, COLORS["trunk_dark"])
        # Highlight on one side
        set_pixel(grid, x_center + trunk_width // 2, y, COLORS["trunk_mid"])

    # Foliage layers (triangles)
    foliage_height = height - trunk_height
    layer_width = max(3, height // 2)
    for layer in range(foliage_height // 3 + 1):
        layer_y = trunk_top + layer * 3
        current_width = layer_width + layer * 2
        for dy in range(3):
            y = layer_y + dy
            if y < 0 or y >= HEIGHT:
                continue
            half_w = current_width // 2
            for dx in range(-half_w, half_w + 1):
                px = x_center + dx
                if 0 <= px < WIDTH:
                    if dy == 0:
                        grid[y][px] = list(COLORS["tree_dark"])
                    elif dy == 1:
                        grid[y][px] = list(COLORS["tree_mid"])
                    else:
                        grid[y][px] = list(COLORS["tree_light"])
            # Narrow each layer slightly
            layer_width -= 1

    # Tree tip
    tip_y = trunk_top - 1
    if tip_y >= 0:
        grid[tip_y][x_center] = list(COLORS["tree_dark"])


def draw_trees(grid):
    """Draw several pine trees of varying sizes in the foreground."""
    trees = [
        # (x_center, y_base, height)
        (8, 80, 28),
        (20, 78, 22),
        (90, 79, 25),
        (82, 81, 20),
        (4, 82, 18),
    ]
    for tx, ty, th in trees:
        draw_tree(grid, tx, ty, th)

    # Bushes near cabin
    for bx in range(30, 46, 3):
        set_pixel(grid, bx, 78, COLORS["bush"])
        set_pixel(grid, bx + 1, 78, COLORS["bush"])
        set_pixel(grid, bx, 79, COLORS["bush_light"])
        set_pixel(grid, bx + 1, 79, COLORS["bush"])


def draw_cabin(grid):
    """Draw a cozy pixel art cabin with roof, door, and window."""
    cab_x = 48
    cab_y = 44
    cab_w = 12  # interior width (pixels)
    cab_h = 14  # interior height

    # Cabin body
    for y in range(cab_y, cab_y + cab_h):
        for x in range(cab_x, cab_x + cab_w):
            grid[y][x] = list(COLORS["cabin_wall"])

    # Cabin wall texture — alternate pixels for wood grain effect
    for y in range(cab_y + 2, cab_y + cab_h - 2):
        for x in range(cab_x + 1, cab_x + cab_w - 1):
            if (x + y) % 3 == 0:
                grid[y][x] = list(COLORS["cabin_wall_alt"])
    for y in range(cab_y + 4, cab_y + cab_h - 2):
        for x in range(cab_x + 1, cab_x + cab_w - 1):
            if (x + y) % 5 == 0:
                grid[y][x] = list(COLORS["cabin_dark"])

    # Roof (triangle peak)
    roof_top_y = cab_y - 4
    roof_peak_x = cab_x + cab_w // 2
    for ry in range(roof_top_y, cab_y):
        roof_half_w = (cab_y - ry) * 3 + 2
        for rx in range(roof_peak_x - roof_half_w, roof_peak_x + roof_half_w + 1):
            if cab_x - 3 <= rx < cab_x + cab_w + 3:
                if 0 <= rx < WIDTH and 0 <= ry < HEIGHT:
                    grid[ry][rx] = list(COLORS["roof_mid"])
    # Roof darker edges
    for rx in range(cab_x - 3, cab_x):
        set_pixel(grid, rx, cab_y - 2, COLORS["roof_dark"])
    for rx in range(cab_x + cab_w, cab_x + cab_w + 3):
        set_pixel(grid, rx, cab_y - 2, COLORS["roof_dark"])
    # Roof peak
    for ry in range(roof_top_y - 1, cab_y - 1):
        if 0 <= ry < HEIGHT:
            grid[ry][roof_peak_x] = list(COLORS["roof_dark"])

    # Door
    door_x = cab_x + 3
    door_y = cab_y + cab_h - 5
    door_w = 4
    door_h = 5
    for y in range(door_y, door_y + door_h):
        for x in range(door_x, door_x + door_w):
            set_pixel(grid, x, y, COLORS["door"])
    # Door knob
    set_pixel(grid, door_x + 3, door_y + 2, COLORS["door_knob"])

    # Window
    win_x = cab_x + 8
    win_y = cab_y + 3
    win_w = 4
    win_h = 4
    for y in range(win_y, win_y + win_h):
        for x in range(win_x, win_x + win_w):
            set_pixel(grid, x, y, COLORS["window_frame"])
    # Glass inside window
    for y in range(win_y + 1, win_y + win_h - 1):
        for x in range(win_x + 1, win_x + win_w - 1):
            set_pixel(grid, x, y, COLORS["window_glass"])
    # Window cross
    set_pixel(grid, win_x + 1, win_y + 1, COLORS["window_frame"])
    set_pixel(grid, win_x + 2, win_y + 1, COLORS["window_frame"])
    set_pixel(grid, win_x + 1, win_y + 2, COLORS["window_frame"])
    set_pixel(grid, win_x + 2, win_y + 2, COLORS["window_frame"])
    set_pixel(grid, win_x + 1, win_y + 2, COLORS["window_frame"])

    # Warm glow from window and door (visible on snow)
    glow_positions = [
        (win_x + 1, win_y), (win_x + 2, win_y), (win_x, win_y + 1), (win_x + 3, win_y + 1),
        (win_x + 1, win_y + 3), (win_x + 2, win_y + 3), (win_x, win_y + 2), (win_x + 3, win_y + 2),
        (door_x + 1, door_y), (door_x + 2, door_y), (door_x, door_y + 1), (door_x + 3, door_y + 1),
        (door_x + 1, door_y),
    ]
    for gx, gy in glow_positions:
        set_pixel(grid, gx, gy, COLORS["glow_yellow"])
        # Spread glow to adjacent snow pixels
        for dx in range(-1, 2):
            for dy in range(-1, 2):
                set_pixel(grid, gx + dx, gy + dy, COLORS["glow_orange"])


def write_png(filename, grid):
    """Write the pixel grid to a PNG file using only stdlib."""
    width = len(grid[0])
    height = len(grid)

    # Build raw image data: each pixel is RGB (3 bytes)
    raw_data = bytearray()
    for row in grid:
        # PNG scanline begins with a filter byte (0 = None)
        raw_data.append(0)
        for pixel in row:
            # pixel is [R, G, B] — write as bytes
            raw_data.extend(bytes(pixel))

    # Compress with zlib
    compressed = zlib.compress(bytes(raw_data), level=9)

    def png_chunk(chunk_type, data):
        """Create a PNG chunk: length + type + data + CRC."""
        chunk = chunk_type + data
        return (
            struct.pack(">I", len(data))
            + chunk
            + struct.pack(">I", zlib.crc32(chunk) & 0xFFFFFFFF)
        )

    # PNG signature
    signature = b"\x89PNG\r\n\x1a\n"

    # IHDR chunk: width, height, bit depth=8, color type=2 (RGB)
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    ihdr = png_chunk(b"IHDR", ihdr_data)

    # IDAT chunk
    idat = png_chunk(b"IDAT", compressed)

    # IEND chunk
    iend = png_chunk(b"IEND", b"")

    # Write the file
    with open(filename, "wb") as f:
        f.write(signature)
        f.write(ihdr)
        f.write(idat)
        f.write(iend)

    print(f"PNG written: {filename} ({width}x{height})")


def main():
    # Build the scene
    grid = blank_canvas(COLORS["night_sky"])
    draw_stars(grid)
    draw_mountains(grid)
    draw_ground(grid)
    draw_trees(grid)
    draw_cabin(grid)

    # Ensure assets/pixel-art directory exists
    output_dir = "assets/pixel-art"
    os.makedirs(output_dir, exist_ok=True)

    output_path = os.path.join(output_dir, "cozy_cabin_pixel_art.png")
    write_png(output_path, grid)

    # Report
    file_size = os.path.getsize(output_path)
    print(f"  Size: {file_size} bytes")
    print(f"  Canvas: {WIDTH}x{HEIGHT} pixels")
    print(f"  Theme: Cozy Mountain Cabin at Night — original pixel art")
    print(f"  Palette: {len(COLORS)} colors")


if __name__ == "__main__":
    main()
