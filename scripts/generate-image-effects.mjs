#!/usr/bin/env node
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";

const root = resolve(process.argv[2] ?? ".");
const publicDir = join(root, "public");
const inputExts = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".svg"]);
const textExts = new Set([".md", ".mdx", ".toml"]);

let sharp;

try {
  sharp = (await import("sharp")).default;
} catch {
  console.error("papyrus-image-effects needs sharp. Install it in the site repo: pnpm add -D sharp");
  process.exit(1);
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  if (!await exists(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    if (entry.isFile()) files.push(path);
  }

  return files;
}

function publicAssetPath(value) {
  const clean = value.trim().replace(/^["']|["']$/g, "").split(/[?#]/)[0];
  if (!clean || /^https?:\/\//i.test(clean)) return undefined;
  const publicPath = clean.startsWith("/") ? clean : `/${clean}`;
  return inputExts.has(extname(publicPath).toLowerCase()) ? publicPath : undefined;
}

function ditherMaskPath(assetPath) {
  return `/generated/dither/${assetPath.replace(/^\/+/, "").replace(/\.[a-z0-9]+$/i, "")}.png`;
}

function markdownFrontmatter(text) {
  if (!text.startsWith("---\n")) return "";
  const end = text.indexOf("\n---", 4);
  return end === -1 ? "" : text.slice(4, end);
}

function collectDitherSources(path, text) {
  const sources = new Set();
  const ext = extname(path).toLowerCase();
  const configText = ext === ".md" || ext === ".mdx" ? markdownFrontmatter(text) : text;

  for (const match of text.matchAll(/data-papyrus-dither-src=["']([^"']+)["']/g)) {
    const asset = publicAssetPath(match[1]);
    if (asset) sources.add(asset);
  }

  const coverMatch = configText.match(/^cover:\s*["']?([^"'\n]+)["']?/m);
  const hasDitherCover = /^\s*(coverEffect|cover_effect):\s*["']?dither["']?\s*$/m.test(configText);
  if (coverMatch && hasDitherCover) {
    const asset = publicAssetPath(coverMatch[1]);
    if (asset) sources.add(asset);
  }

  const avatarMatch = configText.match(/^\s*avatar\s*=\s*["']([^"']+)["']/m);
  const hasDitherAvatar = /^\s*avatar_effect\s*=\s*["']dither["']\s*$/m.test(configText) || /^\s*effect\s*=\s*["']dither["']\s*$/m.test(configText);
  if (avatarMatch && hasDitherAvatar) {
    const asset = publicAssetPath(avatarMatch[1]);
    if (asset) sources.add(asset);
  }

  if (path.endsWith("papyrus.config.toml") && /^\s*effect\s*=\s*["']dither["']\s*$/m.test(configText)) {
    sources.add("__PROFILE_AVATAR__");
  }

  return sources;
}

async function configuredSources() {
  const candidates = [
    join(root, "papyrus.config.toml"),
    join(root, "src", "data"),
    join(root, "src", "content", "posts"),
  ];
  const files = [];

  for (const candidate of candidates) {
    if (!await exists(candidate)) continue;
    const info = await stat(candidate);
    files.push(...(info.isDirectory() ? await walk(candidate) : [candidate]));
  }

  const sources = new Set();

  for (const file of files.filter(file => textExts.has(extname(file).toLowerCase()))) {
    const text = await readFile(file, "utf8");
    for (const source of collectDitherSources(file, text)) sources.add(source);
  }

  if (sources.delete("__PROFILE_AVATAR__")) {
    const profilePath = join(root, "src", "data", "profile.toml");
    if (await exists(profilePath)) {
      const profileText = await readFile(profilePath, "utf8");
      const avatarMatch = profileText.match(/^\s*avatar\s*=\s*["']([^"']+)["']/m);
      const asset = avatarMatch ? publicAssetPath(avatarMatch[1]) : undefined;
      if (asset) sources.add(asset);
    }
  }

  return [...sources].sort();
}

function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function addError(values, width, height, x, y, error) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const index = y * width + x;
  values[index] = Math.max(0, Math.min(255, values[index] + error));
}

async function generateMask(assetPath) {
  const sourcePath = join(publicDir, assetPath.replace(/^\/+/, ""));
  if (!await exists(sourcePath)) {
    console.warn(`Skipping missing dither source ${assetPath}`);
    return false;
  }

  const { data, info } = await sharp(sourcePath)
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const values = new Float32Array(width * height);
  const alphas = new Uint8Array(width * height);

  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const offset = pixel * channels;
    values[pixel] = luminance(data[offset], data[offset + 1], data[offset + 2]);
    alphas[pixel] = data[offset + 3] ?? 255;
  }

  const output = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const oldValue = values[index];
      const newValue = oldValue < 132 ? 0 : 255;
      const error = (oldValue - newValue) / 8;
      const alpha = newValue === 0 ? alphas[index] : 0;
      const offset = index * 4;

      output[offset] = 0;
      output[offset + 1] = 0;
      output[offset + 2] = 0;
      output[offset + 3] = alpha;

      addError(values, width, height, x + 1, y, error);
      addError(values, width, height, x + 2, y, error);
      addError(values, width, height, x - 1, y + 1, error);
      addError(values, width, height, x, y + 1, error);
      addError(values, width, height, x + 1, y + 1, error);
      addError(values, width, height, x, y + 2, error);
    }
  }

  const maskPath = join(publicDir, ditherMaskPath(assetPath).replace(/^\/+/, ""));
  await mkdir(dirname(maskPath), { recursive: true });
  await writeFile(maskPath, await sharp(output, { raw: { width, height, channels: 4 } }).png({ compressionLevel: 9 }).toBuffer());
  console.log(`generated ${ditherMaskPath(assetPath)}`);
  return true;
}

const sources = await configuredSources();
let generated = 0;

for (const source of sources) {
  if (await generateMask(source)) generated += 1;
}

console.log(`Generated ${generated} dither mask(s).`);
