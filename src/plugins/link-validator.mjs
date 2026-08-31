import { access, readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, posix, resolve } from "node:path";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

function normalizedBase(base = "/") {
  if (!base || base === "/") return "";
  return `/${base.replace(/^\/+|\/+$/g, "")}`;
}

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
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (/\.(html|json|xml|txt)$/.test(entry.name)) files.push(path);
  }
  return files;
}

async function walkMarkdown(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walkMarkdown(path));
    else if (/\.mdx?$/.test(entry.name)) files.push(path);
  }
  return files;
}

function internalPath(value) {
  const link = value.trim();
  if (!link || link.startsWith("#") || /^(mailto|tel|javascript):/i.test(link)) return null;
  if (/^https?:\/\//i.test(link)) {
    const url = new URL(link);
    if (!["localhost", "127.0.0.1", "192.168.1.102"].includes(url.hostname)) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  }
  if (!link.startsWith("/") || link.startsWith("/Users/") || link.startsWith("/private/")) return null;
  return link;
}

function routePath(link, base) {
  const pathname = link.split(/[?#]/, 1)[0];
  const prefix = normalizedBase(base);
  if (!prefix) return pathname;
  if (pathname === prefix || pathname === `${prefix}/`) return "/";
  if (!pathname.startsWith(`${prefix}/`)) return null;
  return pathname.slice(prefix.length) || "/";
}

async function routeExists(dist, route) {
  if (route === "/") return exists(join(dist, "index.html"));
  const normalized = route.replace(/^\/+/, "");
  return (await exists(join(dist, normalized))) ||
    (await exists(join(dist, normalized, "index.html"))) ||
    (await exists(join(dist, `${normalized}.html`)));
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
      const link = internalPath(match[1]);
      if (link) links.add(link);
    }
  }
  return [...links].filter((link) => !link.includes("/_astro/"));
}

// Adapted from starlight-links-validator v0.25.3 (MIT): Markdown AST link
// collection, source positions, URL normalization, validation, and reporting.
export async function validateMarkdownLinks(contentDirArg, distArg = "dist", { base = "/" } = {}) {
  const contentDir = resolve(contentDirArg);
  const dist = resolve(distArg);
  const checkedFiles = [];
  const broken = [];
  const processor = unified().use(remarkParse).use(remarkMdx);

  for (const file of await walkMarkdown(contentDir)) {
    const relative = posix.relative(process.cwd(), file);
    checkedFiles.push(relative);
    const tree = processor.parse(await readFile(file, "utf8"));
    const links = [];
    visit(tree, ["link", "image", "definition"], (node) => {
      if (typeof node.url !== "string") return;
      links.push({
        value: node.url,
        line: node.position?.start.line,
        column: node.position?.start.column,
      });
    });
    for (const link of links) {
      const value = internalPath(link.value);
      if (!value) continue;
      const route = routePath(value, base);
      if (route && await routeExists(dist, route)) continue;
      const position = link.line ? `:${link.line}:${link.column ?? 1}` : "";
      broken.push(`${relative}${position} -> ${link.value}`);
    }
  }
  return { checkedFiles, broken };
}

export async function validateBuiltLinks(distArg = "dist", { base = "/" } = {}) {
  const dist = resolve(distArg);
  const checkedFiles = [];
  const broken = [];

  for (const file of await walk(dist)) {
    const relative = posix.relative(dist, file);
    if (relative === "llms-full.txt" || relative.endsWith(".md.txt")) continue;
    checkedFiles.push(relative);
    let text = await readFile(file, "utf8");
    if (file.endsWith(".html")) {
      text = text
        .replaceAll(/<pre\b[\s\S]*?<\/pre>/gi, "")
        .replaceAll(/<code\b[\s\S]*?<\/code>/gi, "");
    }

    for (const link of extractLinks(text)) {
      const route = routePath(link, base);
      if (!route || !await routeExists(dist, route)) broken.push(`${relative} -> ${link}`);
    }
  }

  return { checkedFiles, broken };
}

export function papyrusLinkValidator(options = {}) {
  let base = options.base;
  const contentDir = options.contentDir ?? "src/content/posts";
  return {
    name: "astro-papyrus-links-validator",
    hooks: {
      "astro:config:done"({ config }) {
        base ??= config.base;
      },
      async "astro:build:done"({ dir, logger }) {
        const outputDir = fileURLToPath(dir);
        const [sourceResult, builtResult] = await Promise.all([
          validateMarkdownLinks(contentDir, outputDir, { base: base ?? "/" }),
          validateBuiltLinks(outputDir, { base: base ?? "/" }),
        ]);
        const broken = [...sourceResult.broken, ...builtResult.broken];
        if (broken.length > 0) {
          throw new Error(`Broken internal links: ${broken.length}\n${broken.map((item) => `- ${item}`).join("\n")}`);
        }
        logger.info(`Checked ${sourceResult.checkedFiles.length} Markdown sources and ${builtResult.checkedFiles.length} built files; no broken internal links found.`);
      },
    },
  };
}
