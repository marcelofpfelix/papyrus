#!/usr/bin/env node
import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2).filter((arg) => arg !== "--");
const [
  input = "src/content/posts",
  outputDir = "public/rss/tags",
  siteUrl = process.env.SITE_URL ?? process.env.CF_PAGES_URL ?? "",
] = args;
const root = process.cwd();
const inputDir = path.resolve(root, input);
const targetDir = path.resolve(root, outputDir);

function usage() {
  console.error("Usage: papyrus-tag-rss [content-dir] [output-dir] [site-url]");
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if ([".astro", ".git", "dist", "node_modules"].includes(entry.name)) continue;
      files.push(...await walk(fullPath));
      continue;
    }

    if (/\.(md|mdx)$/i.test(entry.name)) files.push(fullPath);
  }

  return files;
}

function parseScalar(raw) {
  const value = raw.trim();
  if (!value) return "";
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^\[.*\]$/.test(value)) {
    return value
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }

  return value.replace(/^["']|["']$/g, "");
}

function parseFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { data: {}, body: source };

  const data = {};
  let arrayKey = "";

  for (const line of match[1].split("\n")) {
    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (pair) {
      const [, key, rawValue] = pair;
      arrayKey = "";
      if (!rawValue.trim()) {
        data[key] = [];
        arrayKey = key;
      } else {
        data[key] = parseScalar(rawValue);
      }
      continue;
    }

    const arrayItem = line.match(/^\s*-\s*(.+)$/);
    if (arrayItem && arrayKey && Array.isArray(data[arrayKey])) {
      data[arrayKey].push(parseScalar(arrayItem[1]));
    }
  }

  return { data, body: source.slice(match[0].length) };
}

function tagsFrom(value) {
  if (Array.isArray(value)) return value.map(String).map((tag) => tag.trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((tag) => tag.trim()).filter(Boolean);
  return [];
}

function slugFor(file, data) {
  if (typeof data.slug === "string" && data.slug.trim()) {
    return data.slug.replace(/^\/+|\/+$/g, "");
  }

  return path
    .relative(inputDir, file)
    .replace(/\.(md|mdx)$/i, "")
    .split(path.sep)
    .filter((part) => !["index", "_index", "README"].includes(part))
    .join("/");
}

function absolutePostUrl(slug) {
  const cleanSlug = slug.replace(/^\/+|\/+$/g, "");
  const pathname = cleanSlug ? `/posts/${cleanSlug}/` : "/posts/";
  if (!siteUrl) return pathname;
  return new URL(pathname, siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`).toString();
}

function absoluteFeedUrl(tag) {
  const pathname = `rss/tags/${encodeURIComponent(tag)}.xml`;
  if (!siteUrl) return `/${pathname}`;
  return new URL(pathname, siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`).toString();
}

function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rssDate(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString();
}

function feedForTag(tag, posts) {
  const title = `#${tag} posts`;
  const feedUrl = absoluteFeedUrl(tag);
  const latest = posts[0]?.updated ?? new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(siteUrl || "/")}</link>
    <description>${escapeXml(`Posts tagged #${tag}`)}</description>
    <lastBuildDate>${rssDate(latest)}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${posts.map((post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(post.url)}</link>
      <guid>${escapeXml(post.url)}</guid>
      <pubDate>${rssDate(post.updated)}</pubDate>
      <description>${escapeXml(post.description)}</description>
    </item>`).join("\n")}
  </channel>
</rss>
`;
}

try {
  const files = (await walk(inputDir)).sort();
  const byTag = new Map();

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const { data } = parseFrontmatter(source);
    if (data.draft === true || data.hidden === true) continue;
    const tags = tagsFrom(data.tags);
    const slug = slugFor(file, data);
    const post = {
      title: typeof data.title === "string" ? data.title : slug.split("/").at(-1) ?? path.basename(file),
      description: typeof data.description === "string" ? data.description : "",
      url: absolutePostUrl(slug),
      updated: typeof data.modDatetime === "string" ? data.modDatetime : typeof data.pubDatetime === "string" ? data.pubDatetime : typeof data.date === "string" ? data.date : "",
    };

    tags.forEach((tag) => {
      const posts = byTag.get(tag) ?? [];
      posts.push(post);
      byTag.set(tag, posts);
    });
  }

  await mkdir(targetDir, { recursive: true });
  const existingFeeds = await readdir(targetDir).catch(() => []);
  await Promise.all(
    existingFeeds
      .filter((file) => file.endsWith(".xml"))
      .map((file) => unlink(path.join(targetDir, file)))
  );

  for (const [tag, posts] of [...byTag.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    posts.sort((a, b) => Date.parse(b.updated || "0") - Date.parse(a.updated || "0"));
    await writeFile(path.join(targetDir, `${tag}.xml`), feedForTag(tag, posts));
  }

  const index = [...byTag.keys()].sort().map((tag) => ({
    tag,
    feed: absoluteFeedUrl(tag),
    count: byTag.get(tag)?.length ?? 0,
  }));
  await writeFile(path.join(targetDir, "index.json"), `${JSON.stringify(index, null, 2)}\n`);

  console.log(`Wrote ${byTag.size} tag RSS feeds to ${path.relative(root, targetDir)}`);
} catch (error) {
  usage();
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
