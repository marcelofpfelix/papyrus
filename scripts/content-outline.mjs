#!/usr/bin/env node
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";

const [source = "src/content/posts", output = "docs/content-structure.md"] = process.argv.slice(2);
const root = resolve(source);
const target = resolve(output);
const exts = new Set([".md", ".mdx"]);
const metadataNames = new Set(["index.md", "index.mdx", "_index.md", "_index.mdx", "README.md", "README.mdx"]);

function frontmatterValue(text, keys) {
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---/);
  const scope = frontmatter?.[1] ?? text;

  for (const key of keys) {
    const match = scope.match(new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, "m"));
    if (match) return match[1].trim();
  }

  return null;
}

async function metadataFor(path) {
  try {
    const text = await readFile(path, "utf8");
    return {
      title: frontmatterValue(text, ["sectionTitle", "navTitle", "title", "label"]),
      description: frontmatterValue(text, ["description"]),
    };
  } catch {
    return {};
  }
}

async function folderMetadata(dir, entries) {
  const candidates = [
    ...entries.filter(entry => entry.isFile() && metadataNames.has(entry.name)),
    ...entries.filter(entry => entry.isFile() && exts.has(extname(entry.name))),
  ];
  const first = candidates[0];

  if (!first) return {};

  return metadataFor(join(dir, first.name));
}

async function walk(dir, depth = 0) {
  const entries = await readdir(dir, { withFileTypes: true });
  const lines = [];
  const metadata = await folderMetadata(dir, entries.toSorted((a, b) => a.name.localeCompare(b.name)));

  if (depth === 0 && metadata.title) {
    lines.push(`Collection: ${metadata.title}`);
    if (metadata.description) lines.push(`Description: ${metadata.description}`);
    lines.push("");
  }

  for (const entry of entries.toSorted((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith(".")) continue;

    const path = join(dir, entry.name);
    const indent = "  ".repeat(depth);

    if (entry.isDirectory()) {
      const childEntries = await readdir(path, { withFileTypes: true });
      const childMetadata = await folderMetadata(path, childEntries.toSorted((a, b) => a.name.localeCompare(b.name)));
      lines.push(`${indent}- ${entry.name}${childMetadata.title ? `: ${childMetadata.title}` : ""}`);
      if (childMetadata.description) lines.push(`${indent}  _${childMetadata.description}_`);
      lines.push(...await walk(path, depth + 1));
    } else if (exts.has(extname(entry.name)) && !metadataNames.has(entry.name)) {
      const { title } = await metadataFor(path);
      lines.push(`${indent}- ${relative(root, path)}${title ? `: ${title}` : ""}`);
    }
  }

  return lines;
}

const lines = [
  "# Content structure",
  "",
  `Source: \`${relative(process.cwd(), root)}\``,
  "",
  ...await walk(root),
  "",
];

await mkdir(dirname(target), { recursive: true });
await writeFile(target, lines.join("\n"));
console.log(`Wrote ${target}`);
