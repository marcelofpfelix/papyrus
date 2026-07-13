#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2).filter((arg) => arg !== "--");
const [input = "src/content/posts", outputDir = "public", siteUrl = ""] = args;
const root = process.cwd();
const inputDir = path.resolve(root, input);
const targetDir = path.resolve(root, outputDir);

function usage() {
  console.error("Usage: papyrus-llms [content-dir] [output-dir] [site-url]");
}

async function walk(dir) {
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if ([".astro", ".git", "dist", "node_modules"].includes(entry.name)) continue;
      files.push(...await walk(fullPath));
      continue;
    }

    if (/\.(astro|md|mdx)$/i.test(entry.name)) files.push(fullPath);
  }

  return files;
}

function parseFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { data: {}, body: source };

  const data = {};
  for (const line of match[1].split("\n")) {
    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!pair) continue;
    const [, key, rawValue] = pair;
    const value = rawValue.trim().replace(/^["']|["']$/g, "");
    if (value) data[key] = value;
  }

  return { data, body: source.slice(match[0].length) };
}

function slugFor(file, data) {
  if (data.slug) return data.slug.replace(/^\/+|\/+$/g, "");

  const relative = path.relative(inputDir, file).replace(/\.(md|mdx)$/i, "");
  return relative
    .split(path.sep)
    .filter((part) => !["index", "_index", "README"].includes(part))
    .join("/");
}

function absoluteUrl(pathname) {
  if (!siteUrl) return pathname;
  return new URL(pathname, siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`).toString();
}

function postUrl(slug) {
  const cleanSlug = slug.replace(/^\/+|\/+$/g, "");
  const pathname = cleanSlug ? `/posts/${cleanSlug}/` : "/posts/";
  return absoluteUrl(pathname);
}

function cleanMarkdown(body) {
  const codeBlocks = [];
  const withPlaceholders = body.replace(/```[\s\S]*?```/g, (block) => {
    const index = codeBlocks.push(block.trim()) - 1;
    return `\n__PAPYRUS_CODE_BLOCK_${index}__\n`;
  });

  return withPlaceholders
    .replace(/<[^>]+>/g, "")
    .replace(/__PAPYRUS_CODE_BLOCK_(\d+)__/g, (_, index) => codeBlocks[Number(index)] ?? "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function listTags(raw) {
  if (!raw) return [];
  return raw
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((tag) => tag.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

try {
  const files = (await walk(inputDir)).sort();
  const posts = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const { data, body } = parseFrontmatter(source);
    if (data.draft === "true" || data.hidden === "true") continue;
    const slug = slugFor(file, data);
    const title = data.title || slug.split("/").at(-1) || path.basename(file);
    const description = data.description || "";
    const tags = listTags(data.tags);
    const url = postUrl(slug);

    posts.push({
      file,
      title,
      description,
      tags,
      url,
      updated: data.modDatetime || data.updated || data.pubDatetime || data.date || "",
      body: cleanMarkdown(body),
    });
  }

  await mkdir(targetDir, { recursive: true });

  const llms = [
    "# Content index",
    "",
    ...posts.flatMap((post) => [
      `- [${post.title}](${post.url})${post.description ? ` - ${post.description}` : ""}`,
      post.tags.length > 0 ? `  Tags: ${post.tags.map((tag) => `#${tag}`).join(" ")}` : "",
      post.updated ? `  Updated: ${post.updated}` : "",
    ].filter(Boolean)),
    "",
  ].join("\n");

  const full = [
    "# Full content corpus",
    "",
    ...posts.flatMap((post) => [
      `## ${post.title}`,
      "",
      `URL: ${post.url}`,
      post.description ? `Summary: ${post.description}` : "",
      post.tags.length > 0 ? `Tags: ${post.tags.map((tag) => `#${tag}`).join(" ")}` : "",
      post.updated ? `Updated: ${post.updated}` : "",
      `Source: ${path.relative(root, post.file)}`,
      "",
      post.body,
      "",
    ].filter(Boolean)),
  ].join("\n");

  await writeFile(path.join(targetDir, "llms.txt"), llms);
  await writeFile(path.join(targetDir, "llms-full.txt"), full);
  console.log(`Wrote ${posts.length} posts to ${path.relative(root, targetDir)}/llms.txt and llms-full.txt`);
} catch (error) {
  usage();
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
