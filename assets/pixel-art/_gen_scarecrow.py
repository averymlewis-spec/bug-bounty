#!/usr/bin/env python3
"""Generate an original 80x80 pixel-art PNG (deep-night spacefarer scarecrow)
under assets/pixel-art/. Self-contained: stdlib only."""
import os, struct, zlib

W, H = 80, 80  # canvas >= 64x64

# RGB palette
BG    = (17, 24, 47)
MOON  = (240, 240, 220)
STRAW = (245, 220, 85)
LEAF  = (34, 140, 60)
STEM  = (26, 105, 45)
EYE1  = (255, 255, 255)
EYE2  = (0, 0, 0)
MOUTH = (210, 90, 70)
STAR  = (252, 221, 89)

grid = [[BG for _ in range(W)] for _ in range(H)]

def setp(x, y, c):
    if 0 <= x < W and 0 <= y < H:
        grid[y][x] = c

def rect(x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            setp(x, y, c)

def fill_ellipse(cx, cy, rx, ry, c):
    for y in range(H):
        for x in range(W):
            if ((x - cx) ** 2) / (rx * rx) + ((y - cy) ** 2) / (ry * ry) <= 1:
                setp(x, y, c)

# Scattered stars
for sx, sy in [(6,6),(18,4),(33,9),(52,5),(66,11),(24,15),(44,16),(71,17),
               (12,20),(60,19),(9,26),(38,28),(74,25),(30,30),(50,30),
               (20,33),(40,34),(62,36),(76,30),(15,40),(55,42),(45,45),
               (25,48),(68,46),(10,46),(50,50),(35,50),(8,52),(72,52),
               (18,55),(60,54),(40,58),(78,38),(70,40)]:
    setp(sx, sy, STAR)

# Crescent moon
fill_ellipse(58, 18, 14, 16, MOON)
fill_ellipse(52, 18, 14, 16, BG)

# Scarecrow head
fill_ellipse(40, 46, 9, 10, STRAW)
# Straw hat brim + crown
rect(31, 36, 49, 40, STRAW)
rect(36, 32, 44, 36, STRAW)
# Eyes + pupils
for x in [37, 38, 43, 44]:
    setp(x, 43, EYE1)
setp(37, 44, EYE2)
setp(44, 44, EYE2)
# Nose
setp(40, 45, MOUTH)
setp(41, 45, MOUTH)
# Mouth (smile)
setp(40, 47, MOUTH)
setp(41, 47, MOUTH)
setp(39, 48, MOUTH)
setp(42, 48, MOUTH)
# Torso
rect(34, 54, 46, 62, STRAW)
# Arms
rect(28, 52, 33, 58, STRAW)
rect(47, 52, 52, 58, STRAW)
# Legs
rect(34, 63, 38, 71, STRAW)
rect(42, 63, 46, 71, STRAW)
# Broomstick + bristles
for yy in range(54, 72):
    setp(24, yy, STEM)
for yy in range(60, 70):
    for xx in range(19, 25):
        setp(xx, yy, LEAF)
# Pumpkin + ground
fill_ellipse(62, 70, 10, 6, MOUTH)
for yy in range(64, 68):
    setp(64, yy, EYE1)
    setp(65, yy, EYE1)
    setp(64, yy, EYE2)
    setp(65, yy, EYE2)
setp(62, 68, STEM)
setp(63, 67, STEM)
rect(0, 73, 79, 79, STEM)

def chunk(ctype, data):
    c = ctype + data
    return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

def write_png(path, w, h, grid):
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)  # 8-bit RGBA, deflate/inflate, filter-adaptive, no interlace
    raw = bytearray()
    for y in range(h):
        raw.append(0)
        for x in range(w):
            r, g, b = grid[y][x]
            raw += bytes((r, g, b, 255))
    out = sig
    out += chunk(b'IHDR', ihdr)
    out += chunk(b'IDAT', zlib.compress(bytes(raw)))
    out += chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(out)

os.makedirs('assets/pixel-art', exist_ok=True)
out = 'assets/pixel-art/spacefarer-scarecrow.png'
write_png(out, W, H, grid)

with open(out, 'rb') as f:
    head = f.read(8)
print('PNG signature OK:', head == b'\x89PNG\r\n\x1a\n')
print('bytes:', os.path.getsize(out))
print('dims:', W, 'x', H, '(>= 64x64:', W >= 64 and H >= 64, ')')
print('path:', out)
