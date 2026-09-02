#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { deflateSync } from "node:zlib";
import { configuredBrand, siteConfig } from "./site-config.mjs";
import { hexToRgba, themeTokens } from "./theme-colors.mjs";

const args = process.argv.slice(2);
const twinkleMode = args[0] === "--twinkle";
const config = await siteConfig();
const configured = configuredBrand(config);
const positional = twinkleMode ? args.slice(1) : args;
const [text, outputDir = "public"] = twinkleMode
  ? [undefined, positional[0]]
  : positional.length === 1
    ? [configured.mark === "terminal" ? configured.title : undefined, positional[0]]
    : positional.length > 0
      ? positional
      : [configured.mark === "terminal" ? configured.title : undefined, "public"];
const targetDir = resolve(outputDir);
const tokens = await themeTokens();
const colors = {
  background: hexToRgba(tokens["--papyrus-bg"]),
  foreground: hexToRgba(tokens["--papyrus-fg"]),
  accent: hexToRgba(tokens["--papyrus-accent"]),
  border: hexToRgba(tokens["--papyrus-border"]),
};

const glyphs = {
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  "$": ["00100", "11110", "10100", "11100", "00110", "10110", "01100"],
  ">": ["10000", "01000", "00100", "00010", "00100", "01000", "10000"],
  "_": ["00000", "00000", "00000", "00000", "00000", "00000", "11111"],
  "~": ["00000", "00000", "01001", "10110", "00000", "00000", "00000"],
};

const crcTable = new Uint32Array(256);
for (let index = 0; index < 256; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  crcTable[index] = value >>> 0;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function setPixel(buffer, size, x, y, [r, g, b, a]) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const offset = (y * size + x) * 4;
  buffer[offset] = r;
  buffer[offset + 1] = g;
  buffer[offset + 2] = b;
  buffer[offset + 3] = a;
}

function fillRect(buffer, size, x, y, width, height, color) {
  for (let row = y; row < y + height; row += 1) {
    for (let column = x; column < x + width; column += 1) {
      setPixel(buffer, size, column, row, color);
    }
  }
}

function fillPolygon(buffer, size, points, color) {
  const minY = Math.max(0, Math.floor(Math.min(...points.map((point) => point[1]))));
  const maxY = Math.min(size - 1, Math.ceil(Math.max(...points.map((point) => point[1]))));
  const minX = Math.max(0, Math.floor(Math.min(...points.map((point) => point[0]))));
  const maxX = Math.min(size - 1, Math.ceil(Math.max(...points.map((point) => point[0]))));

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
        const [xi, yi] = points[i];
        const [xj, yj] = points[j];
        const intersects = ((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersects) inside = !inside;
      }
      if (inside) setPixel(buffer, size, x, y, color);
    }
  }
}

function roundedBackground(buffer, size) {
  const radius = Math.round(size * 0.18);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const cornerX = x < radius ? radius : x >= size - radius ? size - radius - 1 : x;
      const cornerY = y < radius ? radius : y >= size - radius ? size - radius - 1 : y;
      const distance = Math.hypot(x - cornerX, y - cornerY);
      if (distance <= radius) setPixel(buffer, size, x, y, colors.background);
    }
  }

  const borderSize = Math.max(2, Math.round(size * 0.014));
  fillRect(buffer, size, 0, Math.round(size * 0.72), size, borderSize, colors.border);
}

function drawGlyph(buffer, size, glyph, startX, startY, scale, color) {
  const rows = glyphs[glyph] ?? glyphs[" "];
  rows.forEach((row, rowIndex) => {
    [...row].forEach((cell, columnIndex) => {
      if (cell === "1") fillRect(buffer, size, startX + columnIndex * scale, startY + rowIndex * scale, scale, scale, color);
    });
  });
}

function drawTwinkle(buffer, size) {
  const center = size / 2;
  const top = size * 0.16;
  const bottom = size * 0.84;
  const left = size * 0.16;
  const right = size * 0.84;
  const waist = size * 0.43;
  const diagonal = size * 0.32;

  fillPolygon(buffer, size, [
    [center, top],
    [center + size * 0.065, waist],
    [right, center],
    [center + size * 0.065, center + size * 0.065],
    [center, bottom],
    [center - size * 0.065, center + size * 0.065],
    [left, center],
    [center - size * 0.065, waist],
  ], colors.foreground);
  fillPolygon(buffer, size, [
    [center, top + diagonal * 0.2],
    [center + diagonal * 0.18, center - diagonal * 0.18],
    [right - diagonal * 0.2, center],
    [center + diagonal * 0.18, center + diagonal * 0.18],
    [center, bottom - diagonal * 0.2],
    [center - diagonal * 0.18, center + diagonal * 0.18],
    [left + diagonal * 0.2, center],
    [center - diagonal * 0.18, center - diagonal * 0.18],
  ], colors.foreground);
}

function drawTerminal(buffer, size) {
  const label = `${text}_`;
  const cellWidth = label.length * 5 + Math.max(0, label.length - 1);
  const cellHeight = 7;
  const scale = Math.max(4, Math.floor(Math.min((size * 0.76) / cellWidth, (size * 0.38) / cellHeight)));
  const width = cellWidth * scale;
  const height = cellHeight * scale;
  let x = Math.floor((size - width) / 2);
  const y = Math.floor((size - height) / 2);

  for (const char of label) {
    drawGlyph(buffer, size, char, x, y, scale, colors.foreground);
    x += 6 * scale;
  }
}

function pngFor(size) {
  const pixels = Buffer.alloc(size * size * 4, 0);
  roundedBackground(pixels, size);

  if (text) drawTerminal(pixels, size);
  else drawTwinkle(pixels, size);

  const scanlines = Buffer.alloc((size * 4 + 1) * size);
  for (let yIndex = 0; yIndex < size; yIndex += 1) {
    const rowStart = yIndex * (size * 4 + 1);
    scanlines[rowStart] = 0;
    pixels.copy(scanlines, rowStart + 1, yIndex * size * 4, (yIndex + 1) * size * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(scanlines, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

await mkdir(targetDir, { recursive: true });
for (const [fileName, size] of Object.entries({
  "favicon-32x32.png": 32,
  "apple-touch-icon.png": 180,
  "icon-192.png": 192,
  "icon-512.png": 512,
})) {
  await writeFile(resolve(targetDir, fileName), pngFor(size));
}

console.log(`Wrote mobile icons to ${targetDir}`);
