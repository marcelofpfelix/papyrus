#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2).filter((arg) => arg !== "--");
const [input = "src/content/posts", outputDir = "public", siteUrl = "", docsInput = "src/pages/docs"] = args;
const root = process.cwd();
const inputDir = path.resolve(root, input);
const targetDir = path.resolve(root, outputDir);
const docsDir = path.resolve(root, docsInput);

function usage() {
  console.error("Usage: papyrus-llms [content-dir] [output-dir] [site-url] [docs-dir]");
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

function docPathFor(file) {
  const relative = path.relative(docsDir, file).replace(/\.(astro|md|mdx)$/i, "");
  const parts = relative.split(path.sep).filter((part) => part && part !== "index");
  return `/docs/${parts.length > 0 ? `${parts.join("/")}/` : ""}`;
}

const docTitleByPath = {};

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

function cleanAstroFragment(value) {
  return cleanMarkdown(value
    .replace(/\{[^{}]*(?:=>|\.map\(|JSON\.|withBase\(|getAssetPath\(|data-|class:|set:|const\s|import\s)[^{}]*\}/g, "")
    .replace(/\{[^{}]+\}/g, "")
    .replace(/\s+/g, " "));
}

function uniqueText(values) {
  const seen = new Set();
  const result = [];

  for (const value of values) {
    const text = cleanAstroFragment(value);
    if (!text || text.length < 2) continue;
    if (/^[{}()[\],:;.\s]+$/.test(text)) continue;
    if (seen.has(text)) continue;
    seen.add(text);
    result.push(text);
  }

  return result;
}

function cleanAstroDoc(source) {
  const frontmatterClose = source.lastIndexOf("\n---\n");
  const body = frontmatterClose >= 0 ? source.slice(frontmatterClose + "\n---\n".length) : parseFrontmatter(source).body;
  const visibleSource = body
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  const parts = [];

  for (const match of visibleSource.matchAll(/\b(?:title|description)=["']([^"']+)["']/g)) {
    parts.push(match[1]);
  }

  for (const match of visibleSource.matchAll(/\b(?:title|description):\s*["`]([^"`]+)["`]/g)) {
    parts.push(match[1]);
  }

  for (const match of visibleSource.matchAll(/<(h[1-6]|p|li|small|strong)[^>]*>([\s\S]*?)<\/\1>/gi)) {
    parts.push(match[2]);
  }

  return uniqueText(parts).join("\n\n");
}

function cleanDocBody(file, source) {
  if (/\.astro$/i.test(file)) return cleanAstroDoc(source);
  return cleanMarkdown(parseFrontmatter(source).body);
}

function listTags(raw) {
  if (!raw) return [];
  return raw
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((tag) => tag.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

function titleFromDoc(file, source) {
  const { data } = parseFrontmatter(source);
  if (data.title) return data.title;

  const pathname = docPathFor(file);
  if (docTitleByPath[pathname]) return docTitleByPath[pathname];

  const heading = source.match(/<h1[^>]*>([^<]+)<\/h1>/i) || source.match(/^#\s+(.+)$/m);
  if (heading) return heading[1].trim();

  const layoutTitle = source.match(/<PaperBaseLayout[\s\S]*?\btitle=["']([^"']+)["']/);
  if (layoutTitle) return layoutTitle[1].trim();

  const fallbackPath = pathname.replace(/^\/docs\/?|\/$/g, "");
  return fallbackPath ? fallbackPath.split("/").at(-1).replaceAll("-", " ") : "Documentation";
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

  const docs = [];
  try {
    const docFiles = (await walk(docsDir)).sort();
    for (const file of docFiles) {
      const source = await readFile(file, "utf8");
      const pathname = docPathFor(file);
      docs.push({
        file,
        title: titleFromDoc(file, source),
        url: absoluteUrl(pathname),
        body: cleanDocBody(file, source),
      });
    }
  } catch (error) {
    if (error && error.code !== "ENOENT") throw error;
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
    docs.length > 0 ? "" : "",
    docs.length > 0 ? "# Documentation URLs" : "",
    ...docs.map((doc) => `- [${doc.title}](${doc.url})`),
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
    ...docs.flatMap((doc) => [
      `## ${doc.title}`,
      "",
      `URL: ${doc.url}`,
      `Source: ${path.relative(root, doc.file)}`,
      "",
      doc.body,
      "",
    ].filter(Boolean)),
  ].join("\n");

  await writeFile(path.join(targetDir, "llms.txt"), llms);
  await writeFile(path.join(targetDir, "llms-full.txt"), full);
  console.log(`Wrote ${posts.length} posts and ${docs.length} docs to ${path.relative(root, targetDir)}/llms.txt and llms-full.txt`);
} catch (error) {
  usage();
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
