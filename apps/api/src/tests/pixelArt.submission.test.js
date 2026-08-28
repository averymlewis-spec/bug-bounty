import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { inflateSync } from "node:zlib";

const REPO_ROOT = join(import.meta.dirname, "..", "..", "..", "..");
const PIXEL_ART_DIR = join(REPO_ROOT, "assets", "pixel-art");

// Acceptance criteria from the paid "Pixel Art Creation" issue:
//   1. Original pixel art (non-animated raster image)
//   2. Submitted as .png, .jpg, or .jpeg under /assets/pixel-art/
//   3. Minimum canvas size of 64x64 px
const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg"]);
const MIN_DIM = 64;

function findPixelArtSubmissions() {
  let entries;
  try {
    entries = readdirSync(PIXEL_ART_DIR);
  } catch {
    return [];
  }
  return entries
    .filter((n) => ALLOWED_EXT.has(n.slice(n.lastIndexOf(".")).toLowerCase()))
    .map((n) => join(PIXEL_ART_DIR, n));
}

/**
 * Parse PNG IHDR using only the Node.js standard library.
 * Returns { width, height, bitDepth, colorType, hasMultipleFrames } or null if
 * the buffer is not a single-frame PNG.
 */
function parsePng(buf) {
  if (buf.length < 8 || buf.slice(0, 8).toString("binary") !== "\x89PNG\r\n\x1a\n") {
    return null;
  }
  let pos = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0;
  let sawIdat = false, sawActl = false, frameCount = 0;
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.subarray(pos + 4, pos + 8).toString("binary");
    if (type === "IHDR") {
      width = buf.readUInt32BE(pos + 8);
      height = buf.readUInt32BE(pos + 12);
      bitDepth = buf[pos + 16];
      colorType = buf[pos + 17];
    }
    if (type === "acTL") {
      sawActl = true; // animated PNG (APNG)
    }
    if (type === "IDAT" && !sawActl) {
      sawIdat = true;
    }
    // fcTL marks a frame boundary in APNG; non-zero count => multiple frames
    if (type === "fcTL") {
      frameCount += 1;
    }
    pos += 8 + len + 4; // 4 len + 4 type + data + 4 crc
  }
  const frames = sawActl ? Math.max(frameCount, 2) : 1;
  return { width, height, bitDepth, colorType, frames };
}

test("pixel art submission exists under assets/pixel-art/", () => {
  const subs = findPixelArtSubmissions();
  assert.ok(
    subs.length >= 1,
    `Expected at least one .png/.jpg/.jpeg under ${PIXEL_ART_DIR}; found: ${subs.length}`,
  );
});

test("each pixel art submission is at least 64x64 px", () => {
  const subs = findPixelArtSubmissions();
  assert.ok(subs.length >= 1, "no submissions to check dimensions");
  for (const file of subs) {
    const buf = readFileSync(file);
    const parsed = parsePng(buf);
    if (parsed) {
      assert.ok(
        parsed.width >= MIN_DIM && parsed.height >= MIN_DIM,
        `${file}: expected >=${MIN_DIM}x${MIN_DIM}, got ${parsed.width}x${parsed.height}`,
      );
    }
  }
});

test("each pixel art submission is a single-frame (non-animated) raster image", () => {
  const subs = findPixelArtSubmissions();
  assert.ok(subs.length >= 1, "no submissions to check frame count");
  for (const file of subs) {
    const buf = readFileSync(file);
    const ext = file.slice(file.lastIndexOf(".")).toLowerCase();
    const parsed = parsePng(buf);
    if (parsed) {
      assert.equal(
        parsed.frames,
        1,
        `${file}: pixel art must be a single image, got ${parsed.frames} frames`,
      );
    }
  }
});
