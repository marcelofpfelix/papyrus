import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { parse } from "smol-toml";

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function titleFromSlug(slug) {
  return slug.split("-").filter(Boolean).map(part => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`).join(" ");
}

function normalizePath(value) {
  return value.split(sep).join("/");
}

export function collectionSectionSlug(name) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseSections(value) {
  return Array.isArray(value)
    ? value.map(section => {
        const record = asRecord(section);
        return {
          name: asString(record.name),
          description: asString(record.description),
        };
      }).filter(section => section.name)
    : [];
}

function parseSettings(value) {
  const record = asRecord(value);
  return {
    postFooter: record.post_footer === "none" ? "none" : "collection",
    postFooterCollapsible: record.post_footer_collapsible !== false,
  };
}

async function findTomlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return findTomlFiles(path);
    return entry.isFile() && entry.name.endsWith(".toml") ? [path] : [];
  }));
  return files.flat();
}

export async function readPostCollectionMetadata(postsDir = "src/content/posts") {
  const root = resolve(postsDir);
  const metadata = await Promise.all((await findTomlFiles(root)).map(async path => {
    const parsed = asRecord(parse(await readFile(path, "utf8")));
    const relativePath = normalizePath(relative(root, path));
    const pathSlug = relativePath.replace(/\/[^/]+\.toml$/, "").replace(/\.toml$/, "");
    const slug = pathSlug.split("/").filter(Boolean).at(-1) ?? pathSlug;
    const parentDirectory = normalizePath(dirname(relativePath));
    const directory = parentDirectory === "." ? slug : parentDirectory;

    return {
      slug,
      path: relativePath,
      directory,
      name: asString(parsed.name, titleFromSlug(slug)),
      description: asString(parsed.description),
      settings: parseSettings(parsed.settings),
      sections: parseSections(parsed.sections),
    };
  }));

  return metadata.sort((a, b) => a.name.localeCompare(b.name));
}

function relativePostPath(postsDir, postPath) {
  return normalizePath(relative(resolve(postsDir), resolve(postPath)));
}

export function collectionContainsPost(collection, postPath, postsDir = "src/content/posts") {
  const post = relativePostPath(postsDir, postPath);
  if (post.startsWith("../") || post === "..") return false;
  return !collection.directory || post.startsWith(`${collection.directory}/`);
}

export function collectionSectionForPost(collection, postPath, postsDir = "src/content/posts") {
  if (!collectionContainsPost(collection, postPath, postsDir)) return undefined;
  const post = relativePostPath(postsDir, postPath);
  const withinCollection = collection.directory ? post.slice(collection.directory.length + 1) : post;
  const sectionDirectory = withinCollection.split("/")[0];
  return collection.sections.find(section => collectionSectionSlug(section.name) === sectionDirectory)?.name;
}

export function primaryCollectionForPost(collections, postPath, postsDir = "src/content/posts") {
  return collections
    .filter(collection => collectionContainsPost(collection, postPath, postsDir))
    .sort((a, b) => {
      const depth = b.directory.split("/").filter(Boolean).length - a.directory.split("/").filter(Boolean).length;
      return depth || a.path.localeCompare(b.path);
    })[0];
}
