#!/usr/bin/env node
import { readdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const args = process.argv.slice(2);
const optional = args.includes("--optional");
const source = args.find(arg => arg !== "--optional") ?? "public/images";
const root = resolve(source);
const imageExts = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

let sharp;

try {
  sharp = (await import("sharp")).default;
} catch {
  const message = "papyrus-compress needs sharp. Install it in the site repo: pnpm add -D sharp";
  if (optional) {
    console.warn(`${message}. Skipping optional image compression.`);
    process.exit(0);
  }

  console.error(message);
  process.exit(1);
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    if (entry.isFile() && imageExts.has(extname(entry.name).toLowerCase())) files.push(path);
  }

  return files;
}

async function compress(path) {
  const ext = extname(path).toLowerCase();
  const before = await stat(path);
  const image = sharp(await readFile(path), { animated: ext === ".webp" });
  let output;

  if (ext === ".png") output = await image.png({ compressionLevel: 9, effort: 10 }).toBuffer();
  else if (ext === ".webp") output = await image.webp({ quality: 82, effort: 6 }).toBuffer();
  else if (ext === ".avif") output = await image.avif({ quality: 62, effort: 6 }).toBuffer();
  else output = await image.jpeg({ quality: 82, mozjpeg: true }).toBuffer();

  if (output.byteLength >= before.size) {
    return { path, before: before.size, after: before.size, changed: false };
  }

  const tmp = `${path}.papyrus-tmp`;
  await writeFile(tmp, output);
  await rename(tmp, path).catch(async error => {
    await unlink(tmp).catch(() => {});
    throw error;
  });

  return { path, before: before.size, after: output.byteLength, changed: true };
}

const files = await walk(root);
let saved = 0;

for (const file of files) {
  const result = await compress(file);
  saved += result.before - result.after;
  const status = result.changed ? "optimized" : "kept";
  console.log(`${status} ${result.path} ${result.before} -> ${result.after}`);
}

console.log(`Saved ${saved} bytes across ${files.length} image(s).`);
