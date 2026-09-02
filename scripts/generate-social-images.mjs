#!/usr/bin/env node
import { mkdir, readdir, readFile, rm } from "node:fs/promises";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import sharp from "sharp";
import { configuredBrand, siteConfig } from "./site-config.mjs";
import { themeTokens } from "./theme-colors.mjs";
import { frontmatterTags, parseFrontmatter } from "./frontmatter.mjs";
import {
  collectionSectionForPost,
  primaryCollectionForPost,
  readPostCollectionMetadata,
} from "../src/utils/collection-metadata.mjs";

const cwd = process.cwd();
const defaultPostsDir = "src/content/posts";
const defaultOutputDir = "public/generated/social";

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrapWords(value, max = 30, limit = 3) {
  const words = String(value ?? "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }

  if (line) lines.push(line);
  return lines.slice(0, limit);
}

function assetHref(value) {
  if (!value) return undefined;
  if (/^(https?:|data:|\/)/i.test(value)) return value;
  return `/${value.replace(/^\.?\//, "")}`;
}

function mimeType(path) {
  switch (extname(path).toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

async function socialImageHref(root, value) {
  const href = assetHref(value);
  if (!href || /^(https?:|data:)/i.test(href)) return href;

  try {
    const file = resolve(root, "public", href.replace(/^\/+/, ""));
    const data = await readFile(file);
    return `data:${mimeType(file)};base64,${data.toString("base64")}`;
  } catch {
    return href;
  }
}

function postSlugFromPath(file, postsDir, frontmatterSlug) {
  if (typeof frontmatterSlug === "string" && frontmatterSlug) return frontmatterSlug.replace(/^\/+|\/+$/g, "");
  const relativePath = relative(postsDir, file).split(sep).join("/");
  return relativePath.replace(/\.(md|mdx)$/i, "");
}

async function walkMarkdown(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(error => {
    if (error?.code === "ENOENT") return [];
    throw error;
  });
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith("_")) continue;
      files.push(...await walkMarkdown(path));
      continue;
    }
    if (/^[^_].*\.(md|mdx)$/i.test(entry.name)) files.push(path);
  }

  return files;
}

function brandSvg({ brandMark, brandTitle }) {
  if (brandMark === "terminal") {
    return `<text x="72" y="120" class="brand">${escapeXml(brandTitle)}</text>`;
  }

  return `<g class="brand-mark" transform="translate(72 70) scale(.52)">
    <path d="m61.383 45.285 10.68-14.574c0.36719-0.50391-0.19531-1.1562-0.74609-0.86328l-16.598 8.7695-4.1328-31.031c-0.089844-0.67969-1.0703-0.67969-1.1641 0l-4.1328 31.031-14.621-8.7578c-0.52344-0.3125-1.1172 0.28125-0.80469 0.80469l8.7578 14.621-31.031 4.1328c-0.67969 0.089843-0.67969 1.0703 0 1.1641l31.031 4.1328-8.7578 14.621c-0.3125 0.52344 0.28125 1.1172 0.80469 0.80469l14.621-8.7578 4.1328 31.031c0.089844 0.67969 1.0703 0.67969 1.1641 0l4.1328-31.031 14.621 8.7578c0.52344 0.3125 1.1172-0.28125 0.80469-0.80469l-8.7578-14.621 31.031-4.1328c0.67969-0.089843 0.67969-1.0703 0-1.1641l-31.031-4.1328z"/>
  </g>
  <text x="136" y="120" class="brand">${escapeXml(brandTitle)}</text>`;
}

function sourceImageSvg(sourceHref) {
  if (!sourceHref) return "";

  const href = escapeXml(sourceHref);
  return `<defs>
    <clipPath id="source-image-panel">
      <rect x="756" y="0" width="444" height="630"/>
    </clipPath>
  </defs>
  <image href="${href}" x="0" y="0" width="1200" height="630" preserveAspectRatio="xMidYMid slice" opacity=".08"/>
  <image href="${href}" x="756" y="0" width="444" height="630" preserveAspectRatio="xMidYMid slice" clip-path="url(#source-image-panel)" opacity=".9"/>
  <rect x="720" y="0" width="52" height="630" class="fade"/>`;
}

function boundedLine(value, max) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, Math.max(0, max - 3)).trimEnd()}...` : text;
}

function tagLine(tags, max) {
  const seen = new Set();
  const unique = tags.filter(tag => {
    const key = tag.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return boundedLine(unique.slice(0, 3).map(tag => `#${tag.replace(/\s+/g, "-")}`).join("  "), max);
}

export function socialContextForPost(file, postsDir, collections) {
  const collection = primaryCollectionForPost(collections, file, postsDir);
  if (!collection) return "";
  const section = collectionSectionForPost(collection, file, postsDir);
  return section ? `${collection.name} / ${section}` : collection.name;
}

export function socialSvg({ title, description, brandTitle, brandMark, label, tokens, sourceImage, context = "", tags = [] }) {
  const hasSourceImage = Boolean(sourceImage);
  const contextText = boundedLine(context, hasSourceImage ? 38 : 62);
  const tagsText = tagLine(tags, hasSourceImage ? 38 : 62);
  const titleLines = wrapWords(title, hasSourceImage ? 20 : 26, 3);
  const descriptionLines = wrapWords(description, hasSourceImage ? 38 : 58, 3);
  const titleStart = contextText ? 225 : 205;
  const descriptionStart = contextText ? 450 : 472;
  const titleSvg = titleLines
    .map((line, index) => `<text x="72" y="${titleStart + index * 70}" class="title">${escapeXml(line)}</text>`)
    .join("\n  ");
  const descriptionSvg = descriptionLines
    .map((line, index) => `<text x="72" y="${descriptionStart + index * 38}" class="desc">${escapeXml(line)}</text>`)
    .join("\n  ");
  const labelX = tagsText ? (hasSourceImage ? 700 : 1128) : 72;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(title)}">
  <style>
    rect.bg { fill: ${tokens["--papyrus-bg"]}; }
    text { fill: ${tokens["--papyrus-fg"]}; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .brand { fill: ${tokens["--papyrus-accent"]}; font-size: 38px; font-weight: 700; }
    .brand-mark { fill: ${tokens["--papyrus-accent"]}; }
    .title { font-size: 62px; font-weight: 800; letter-spacing: 0; }
    .desc { fill: ${tokens["--papyrus-muted"]}; font-size: 30px; }
    .context { fill: ${tokens["--papyrus-accent"]}; font-size: 24px; font-weight: 700; }
    .tags { fill: ${tokens["--papyrus-accent"]}; font-size: 23px; }
    .label { fill: ${tokens["--papyrus-muted"]}; font-size: 24px; }
    .fade { fill: ${tokens["--papyrus-bg"]}; opacity: .92; }
  </style>
  <rect class="bg" width="1200" height="630" rx="0"/>
  ${sourceImageSvg(sourceImage)}
  ${brandSvg({ brandMark, brandTitle })}
  ${contextText ? `<text x="72" y="170" class="context">${escapeXml(contextText)}</text>` : ""}
  ${titleSvg}
  ${descriptionSvg}
  ${tagsText ? `<text x="72" y="582" class="tags">${escapeXml(tagsText)}</text>` : ""}
  <text x="${labelX}" y="582" class="label"${tagsText ? ' text-anchor="end"' : ""}>${escapeXml(label)}</text>
</svg>
`;
}

async function writeSocialPng(output, svg) {
  await mkdir(dirname(output), { recursive: true });
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(output);
  await rm(output.replace(/\.png$/i, ".svg"), { force: true });
}

export async function generateSocialImages(options = {}) {
  const root = resolve(options.cwd ?? cwd);
  const postsDir = resolve(root, options.postsDir ?? defaultPostsDir);
  const outputDir = resolve(root, options.outputDir ?? defaultOutputDir);
  const config = await siteConfig(root);
  const tokens = await themeTokens();
  const brand = configuredBrand(config);
  const collections = await readPostCollectionMetadata(postsDir);
  const siteTitle = config.title ?? brand.title;
  const siteDescription = config.description ?? "Personal site";
  const generated = [];

  const homeOutput = join(outputDir, "home.png");
  await writeSocialPng(homeOutput, socialSvg({
    title: siteTitle,
    description: siteDescription,
    brandTitle: brand.title,
    brandMark: brand.mark,
    label: "Home",
    tokens,
  }));
  generated.push(homeOutput);

  for (const file of await walkMarkdown(postsDir)) {
    const text = await readFile(file, "utf8");
    const { data } = parseFrontmatter(text);
    const slug = postSlugFromPath(file, postsDir, data.slug);
    const output = join(outputDir, "posts", `${slug}.png`);
    if (data.draft === true) {
      await rm(output, { force: true });
      await rm(output.replace(/\.png$/i, ".svg"), { force: true });
      continue;
    }

    const title = data.title;
    if (!title) continue;

    const description = data.description ?? siteDescription;
    const sourceImage = await socialImageHref(root, data.ogSourceImage ?? data.cover);
    await writeSocialPng(output, socialSvg({
      title,
      description,
      brandTitle: brand.title,
      brandMark: brand.mark,
      label: siteTitle,
      tokens,
      sourceImage,
      context: socialContextForPost(file, postsDir, collections),
      tags: frontmatterTags(data.tags),
    }));
    generated.push(output);
  }

  return generated;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [postsDir = defaultPostsDir, outputDir = defaultOutputDir] = process.argv.slice(2);
  const generated = await generateSocialImages({ postsDir, outputDir });
  console.log(`Generated ${generated.length} social image(s).`);
}
