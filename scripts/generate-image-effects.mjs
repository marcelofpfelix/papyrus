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

function ditherMaskPath(assetPath, mode = "dark", effect = "dither") {
  const suffix = mode === "light" ? "-light" : "";
  return `/generated/${effect}/${assetPath.replace(/^\/+/, "").replace(/\.[a-z0-9]+$/i, "")}${suffix}.png`;
}

function markdownFrontmatter(text) {
  if (!text.startsWith("---\n")) return "";
  const end = text.indexOf("\n---", 4);
  return end === -1 ? "" : text.slice(4, end);
}

function addSource(sources, effect, asset) {
  if (asset) sources.add(`${effect}:${asset}`);
}

function collectDitherSources(path, text) {
  const sources = new Set();
  const ext = extname(path).toLowerCase();
  const configText = ext === ".md" || ext === ".mdx" ? markdownFrontmatter(text) : text;

  for (const match of text.matchAll(/data-papyrus-dither-src=["']([^"']+)["']/g)) {
    const asset = publicAssetPath(match[1]);
    addSource(sources, "dither", asset);
  }

  for (const match of text.matchAll(/data-papyrus-dithernoise-src=["']([^"']+)["']/g)) {
    const asset = publicAssetPath(match[1]);
    addSource(sources, "dithernoise", asset);
  }

  const coverMatch = configText.match(/^cover:\s*["']?([^"'\n]+)["']?/m);
  const ditherCoverMatch = configText.match(/^\s*(coverEffect|cover_effect):\s*["']?(dither|dithernoise)["']?\s*$/m);
  if (coverMatch && ditherCoverMatch) {
    const asset = publicAssetPath(coverMatch[1]);
    addSource(sources, ditherCoverMatch[2], asset);
  }

  const avatarMatch = configText.match(/^\s*avatar\s*=\s*["']([^"']+)["']/m);
  const ditherAvatarMatch = configText.match(/^\s*(avatar_effect|effect)\s*=\s*["'](dither|dithernoise)["']\s*$/m);
  if (avatarMatch && ditherAvatarMatch) {
    const asset = publicAssetPath(avatarMatch[1]);
    addSource(sources, ditherAvatarMatch[2], asset);
  }

  if (path.endsWith("papyrus.config.toml")) {
    const defaultEffectMatch = configText.match(/^\s*effect\s*=\s*["'](dither|dithernoise)["']\s*$/m);
    if (defaultEffectMatch) sources.add(`__PROFILE_AVATAR__:${defaultEffectMatch[1]}`);
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

  for (const source of [...sources].filter(source => source.startsWith("__PROFILE_AVATAR__:"))) {
    sources.delete(source);
    const effect = source.split(":")[1];
    const profilePath = join(root, "src", "data", "profile.toml");
    if (await exists(profilePath)) {
      const profileText = await readFile(profilePath, "utf8");
      const avatarMatch = profileText.match(/^\s*avatar\s*=\s*["']([^"']+)["']/m);
      const asset = avatarMatch ? publicAssetPath(avatarMatch[1]) : undefined;
      addSource(sources, effect, asset);
    }
  }

  return [...sources].sort().map((source) => {
    const index = source.indexOf(":");
    return { effect: source.slice(0, index), assetPath: source.slice(index + 1) };
  });
}

function luminance(r, g, b) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function hash(x, y) {
  let px = fract(x * 0.1031);
  let py = fract(y * 0.1031);
  let pz = fract(x * 0.1031);
  const d = px * (py + 33.33) + py * (pz + 33.33) + pz * (px + 33.33);
  px += d;
  py += d;
  pz += d;
  return fract((px + py) * pz);
}

function fract(value) {
  return value - Math.floor(value);
}

function smoothstep(edge0, edge1, value) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function atkinsonThreshold(x, y) {
  const thresholds = [
    0, 12, 3, 15,
    8, 4, 11, 7,
    2, 14, 1, 13,
    10, 6, 9, 5,
  ];
  return thresholds[(y % 4) * 4 + (x % 4)] / 16;
}

function ditherAlpha(grayInput, x, y, width, height, sourceAlpha, themeMode, effect) {
  const uvX = x / width;
  const uvY = 1 - y / height;
  const edgeNoise = hash(x * 0.5, y * 0.5) * 0.15;
  const fadeLeft = smoothstep(0, 0.1 + edgeNoise, uvX);
  const fadeRight = smoothstep(0, 0.1 + edgeNoise, 1 - uvX);
  const fadeBottom = smoothstep(0, 0.1 + edgeNoise, uvY);
  const fadeTop = smoothstep(0, 0.1 + edgeNoise, 1 - uvY);
  const fade = fadeLeft * fadeRight * fadeBottom * fadeTop;
  const isLight = themeMode === "light" ? 1 : 0;
  let gray = grayInput;

  gray = gray * fade * (1 - isLight) + (1 - isLight) * 0;
  if (isLight) gray = 1 + (grayInput - 1) * fade;
  if (effect === "dither") gray = Math.max(0, Math.min(1, gray * 1.2 - 0.1));

  const threshold = effect === "dithernoise" ? hash(x, y) : atkinsonThreshold(x, y);
  const thresholdBias = isLight ? -0.1 : 0.1;
  const noise = hash(x * 0.15, y * 0.15) - 0.5;
  const flicker = 0.08 * Math.sin(hash(x * 0.2, y * 0.2) * 6.28);
  const effectIntensity = effect === "dithernoise" ? smoothstep(0.05, 0.3, gray) : 0;
  const thresholdLevel = Math.max(0.001, Math.min(0.999, threshold + thresholdBias + (noise * 0.15 + flicker) * effectIntensity));
  const dithered = gray >= thresholdLevel ? 1 : 0;
  const inkAlpha = isLight ? 1 - dithered : dithered;
  return Math.round(sourceAlpha * inkAlpha);
}

async function generateMask(assetPath, themeMode, effect) {
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
  const output = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const sourceOffset = index * channels;
      const offset = index * 4;
      const gray = luminance(data[sourceOffset], data[sourceOffset + 1], data[sourceOffset + 2]);
      const alpha = ditherAlpha(gray, x, y, width, height, data[sourceOffset + 3] ?? 255, themeMode, effect);

      output[offset] = 0;
      output[offset + 1] = 0;
      output[offset + 2] = 0;
      output[offset + 3] = alpha;
    }
  }

  const maskPath = join(publicDir, ditherMaskPath(assetPath, themeMode, effect).replace(/^\/+/, ""));
  await mkdir(dirname(maskPath), { recursive: true });
  await writeFile(maskPath, await sharp(output, { raw: { width, height, channels: 4 } }).png({ compressionLevel: 9 }).toBuffer());
  console.log(`generated ${ditherMaskPath(assetPath, themeMode, effect)}`);
  return true;
}

const sources = await configuredSources();
let generated = 0;

for (const { effect, assetPath } of sources) {
  const darkGenerated = await generateMask(assetPath, "dark", effect);
  const lightGenerated = await generateMask(assetPath, "light", effect);
  if (darkGenerated || lightGenerated) generated += 1;
}

console.log(`Generated ${generated} dither source(s).`);
