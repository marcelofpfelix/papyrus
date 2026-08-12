#!/usr/bin/env node
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const args = process.argv.slice(2);
const mode = args[0];
const inputs = args.slice(1);

if (!["check", "touch"].includes(mode) || inputs.length === 0) {
  console.error("Usage: post-date.mjs <check|touch> <post.md|directory> [post.md|directory...]");
  process.exit(1);
}

const now = new Date().toISOString();
let failed = false;

function frontmatterBounds(text) {
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 4);
  return end === -1 ? null : { start: 4, end };
}

async function expandInput(input) {
  const path = resolve(input);
  const info = await stat(path);

  if (info.isFile()) return [path];
  if (!info.isDirectory()) return [];

  const entries = await readdir(path, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const child = join(path, entry.name);
    if (entry.isDirectory()) files.push(...await expandInput(child));
    if (entry.isFile() && !entry.name.startsWith("_") && [".md", ".mdx"].includes(extname(entry.name))) {
      files.push(child);
    }
  }

  return files;
}

const files = (await Promise.all(inputs.map(expandInput))).flat();

for (const file of files) {
  const path = resolve(file);
  const text = await readFile(path, "utf8");
  const bounds = frontmatterBounds(text);

  if (!bounds) {
      console.error(`${path}: missing YAML frontmatter`);
    failed = true;
    continue;
  }

  const frontmatter = text.slice(bounds.start, bounds.end);
  const hasPublishedDate = /^(pubDatetime|date):/m.test(frontmatter);
  const hasMod = /^modDatetime:/m.test(frontmatter);

  if (mode === "check") {
    if (!hasPublishedDate) {
      console.error(`${path}: missing date or pubDatetime`);
      failed = true;
    }
    continue;
  }

  let nextFrontmatter = frontmatter;
  if (!hasPublishedDate) nextFrontmatter = `date: ${now}\n${nextFrontmatter}`;
  if (hasMod) {
    nextFrontmatter = nextFrontmatter.replace(/^modDatetime:.*$/m, `modDatetime: ${now}`);
  } else {
    nextFrontmatter = nextFrontmatter.replace(/^(pubDatetime|date):.*$/m, match => `${match}\nmodDatetime: ${now}`);
  }

  await writeFile(path, `---\n${nextFrontmatter}${text.slice(bounds.end)}`);
  console.log(`${path}: updated dates`);
}

if (failed) process.exit(1);
