#!/usr/bin/env node
import { access, readdir, readFile } from "node:fs/promises";
import { join, posix, resolve } from "node:path";

const [distArg = "dist"] = process.argv.slice(2);
const dist = resolve(distArg);
const checkedFiles = [];
const broken = [];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(path));
    } else if (/\.(html|json|xml|txt)$/.test(entry.name)) {
      files.push(path);
    }
  }

  return files;
}

function normalizePath(link) {
  const value = link.trim();
  if (!value || value.startsWith("#")) return null;
  if (/^(mailto|tel|javascript):/i.test(value)) return null;
  if (/^https?:\/\//i.test(value)) {
    const url = new URL(value);
    if (!["localhost", "127.0.0.1", "192.168.1.102"].includes(url.hostname)) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  }
  if (!value.startsWith("/")) return null;
  if (value.startsWith("/Users/") || value.startsWith("/private/")) return null;
  return value;
}

function stripQueryAndHash(path) {
  return path.split(/[?#]/, 1)[0];
}

async function routeExists(route) {
  const pathname = stripQueryAndHash(route);
  if (pathname === "/") return exists(join(dist, "index.html"));

  const normalized = pathname.replace(/^\/+/, "");
  const asFile = join(dist, normalized);
  const asIndex = join(dist, normalized, "index.html");
  const asHtml = join(dist, `${normalized}.html`);

  return (await exists(asFile)) || (await exists(asIndex)) || (await exists(asHtml));
}

function extractLinks(text) {
  const links = new Set();
  const patterns = [
    /\b(?:href|src|action)=["']([^"']+)["']/gi,
    /"(\/[^"\\\s<>]+)"/g,
    /`(\/[^`\\\s<>]+)`/g,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const normalized = normalizePath(match[1]);
      if (normalized) links.add(normalized);
    }
  }

  return [...links].filter((link) => !link.startsWith("/_astro/"));
}

for (const file of await walk(dist)) {
  checkedFiles.push(posix.relative(dist, file));
  let text = await readFile(file, "utf8");
  if (file.endsWith(".html")) {
    text = text.replaceAll(/<pre\b[\s\S]*?<\/pre>/gi, "");
  }

  for (const link of extractLinks(text)) {
    if (!await routeExists(link)) {
      broken.push(`${posix.relative(dist, file)} -> ${link}`);
    }
  }
}

if (broken.length > 0) {
  console.error(`Broken internal links: ${broken.length}`);
  for (const item of broken) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`Checked ${checkedFiles.length} built files; no broken internal links found.`);
