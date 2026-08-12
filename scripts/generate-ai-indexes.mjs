#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2).filter((arg) => arg !== "--");
const [input = "src/content/posts", outputDir = "public/ai", siteUrl = "", dataFile = ""] = args;
const root = process.cwd();
const inputDir = path.resolve(root, input);
const targetDir = path.resolve(root, outputDir);

function usage() {
  console.error("Usage: papyrus-ai-indexes [content-dir] [output-dir] [site-url] [site-data-json]");
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

function absoluteUrl(slug) {
  const cleanSlug = slug.replace(/^\/+|\/+$/g, "");
  const pathname = cleanSlug ? `/posts/${cleanSlug}/` : "/posts/";
  if (!siteUrl) return pathname;
  return new URL(pathname, siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`).toString();
}

function stableId(type, key) {
  return `${type}:${String(key).trim().replace(/^#+/, "").replace(/\s+/g, "-").toLowerCase()}`;
}

function tagsFrom(value) {
  if (Array.isArray(value)) return value.map(String).map((tag) => tag.trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((tag) => tag.trim()).filter(Boolean);
  return [];
}

function excerptFrom(body) {
  return body
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/^#+\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

function withAbsoluteUrl(item, basePath = "/") {
  const output = { ...item };
  if (typeof output.href === "string" && output.href.startsWith("/") && siteUrl) {
    output.url = new URL(output.href.replace(/^\/+/, ""), siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`).toString();
  } else if (typeof output.href === "string") {
    output.url = output.href;
  } else if (basePath && siteUrl) {
    output.url = new URL(basePath.replace(/^\/+/, ""), siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`).toString();
  }
  return output;
}

function node(id, type, label, extra = {}) {
  return {
    id,
    type,
    label,
    ...extra,
  };
}

function edge(source, target, relation) {
  return { source, target, relation };
}

function uniqueById(items) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

function uniqueEdges(items) {
  return [
    ...new Map(items.map((item) => [`${item.source}\u0000${item.target}\u0000${item.relation}`, item])).values(),
  ];
}

function snapshotGeneratedAt(posts) {
  const times = posts
    .flatMap((post) => [post.updated, post.created])
    .map((value) => Date.parse(value))
    .filter(Number.isFinite);

  if (times.length === 0) return "1970-01-01T00:00:00.000Z";
  return new Date(Math.max(...times)).toISOString();
}

async function readSiteData() {
  if (!dataFile) return {};

  const file = path.resolve(root, dataFile);
  const source = await readFile(file, "utf8");
  return JSON.parse(source);
}

try {
  const files = (await walk(inputDir)).sort();
  const siteData = await readSiteData();
  const posts = [];
  const tagMap = new Map();
  const projects = Array.isArray(siteData.projects)
    ? siteData.projects.map((project) => withAbsoluteUrl(project, "/projects/"))
    : [];
  const notes = Array.isArray(siteData.notes)
    ? siteData.notes.map((note) => ({
        ...note,
        type: "note",
        url: siteUrl ? new URL(`#${encodeURIComponent(note.id ?? "")}`, siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`).toString() : `/#${encodeURIComponent(note.id ?? "")}`,
      }))
    : [];
  const cv = siteData.cv && typeof siteData.cv === "object"
    ? withAbsoluteUrl({ type: "cv", ...siteData.cv, href: siteData.cv.url ?? "/profile/" }, "/profile/")
    : null;

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const { data, body } = parseFrontmatter(source);
    if (data.draft === true || data.hidden === true) continue;
    const slug = slugFor(file, data);
    const tags = tagsFrom(data.tags);
    const post = {
      id: stableId("post", slug),
      type: "post",
      slug,
      url: absoluteUrl(slug),
      sourcePath: path.relative(root, file),
      title: typeof data.title === "string" ? data.title : slug.split("/").at(-1) ?? path.basename(file),
      description: typeof data.description === "string" ? data.description : "",
      excerpt: excerptFrom(body),
      tags,
      license: typeof data.license === "string" ? data.license : "",
      created: typeof data.pubDatetime === "string" ? data.pubDatetime : typeof data.date === "string" ? data.date : "",
      updated: typeof data.modDatetime === "string" ? data.modDatetime : typeof data.updated === "string" ? data.updated : "",
      draft: data.draft === true,
    };

    posts.push(post);
    tags.forEach((tag) => {
      const existing = tagMap.get(tag) ?? { tag, count: 0, posts: [] };
      existing.count += 1;
      existing.posts.push({ id: post.id, slug: post.slug, title: post.title, url: post.url });
      tagMap.set(tag, existing);
    });
  }

  const supplementalTags = new Set([
    ...projects.flatMap((project) => project.tags ?? []),
    ...notes.flatMap((note) => note.tags ?? []),
  ]);
  supplementalTags.forEach((tag) => {
    if (!tagMap.has(tag)) tagMap.set(tag, { tag, count: 0, posts: [] });
  });
  const tagItems = [...tagMap.values()]
    .map((tag) => ({ id: stableId("tag", tag.tag), ...tag }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
  const projectItems = projects.map((project) => ({ ...project, id: stableId("project", project.title), type: "project" }));
  const noteItems = notes.map((note) => ({ ...note, noteId: note.id, id: stableId("note", note.id) }));
  const cvItems = cv ? [{ ...cv, id: stableId("cv", cv.name) }] : [];
  const searchItems = [
    ...posts.map((post) => ({
      id: post.id,
      type: post.type,
      title: post.title,
      url: post.url,
      sourcePath: post.sourcePath,
      description: post.description,
      excerpt: post.excerpt,
      tags: post.tags,
      text: [post.title, post.description, post.excerpt, post.tags.join(" ")].filter(Boolean).join("\n"),
    })),
    ...projectItems.map((project) => ({
      id: project.id,
      type: project.type,
      title: project.title,
      url: project.url,
      description: project.description,
      tags: project.tags ?? [],
      text: [project.title, project.description, project.repo, project.language, project.status].filter(Boolean).join("\n"),
    })),
    ...noteItems.map((note) => ({
      id: note.id,
      type: note.type,
      title: note.noteId,
      url: note.url,
      description: note.text,
      tags: note.tags ?? [],
      text: [note.noteId, note.text, (note.tags ?? []).join(" ")].filter(Boolean).join("\n"),
    })),
    ...cvItems.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.name,
      url: item.url,
      source: item.source,
      description: (item.roles ?? []).join(", "),
      tags: ["cv", "profile"],
      text: [item.name, ...(item.roles ?? []), ...(item.sections ?? []), ...(item.templates ?? [])].filter(Boolean).join("\n"),
    })),
  ];
  const graphNodes = uniqueById([
    ...posts.map((post) => node(post.id, "post", post.title, {
      url: post.url,
      sourcePath: post.sourcePath,
      tags: post.tags,
    })),
    ...tagItems.map((tag) => node(tag.id, "tag", `#${tag.tag}`, {
      count: tag.count,
    })),
    ...projectItems.map((project) => node(project.id, "project", project.title, {
      url: project.url,
      repo: project.repo,
      tags: project.tags ?? [],
    })),
    ...noteItems.map((note) => node(note.id, "note", note.id, {
      url: note.url,
      tags: note.tags ?? [],
    })),
    ...cvItems.map((item) => node(item.id, "cv", item.name, {
      url: item.url,
      source: item.source,
    })),
    ...cvItems.flatMap((item) => (item.sections ?? []).map((section) => node(stableId("cv-section", section), "cv-section", section))),
  ]);

  const graphEdges = uniqueEdges([
    ...posts.flatMap((post) => post.tags.map((tag) => edge(post.id, stableId("tag", tag), "has-tag"))),
    ...projectItems.flatMap((project) => (project.tags ?? []).map((tag) => edge(project.id, stableId("tag", tag), "has-tag"))),
    ...noteItems.flatMap((note) => (note.tags ?? []).map((tag) => edge(note.id, stableId("tag", tag), "mentions-tag"))),
    ...cvItems.flatMap((item) => (item.sections ?? []).map((section) => edge(item.id, stableId("cv-section", section), "has-section"))),
    ...posts.flatMap((post) => posts
      .filter((other) => other.slug !== post.slug && other.tags.some((tag) => post.tags.includes(tag)))
      .map((other) => edge(post.id, other.id, "related-by-tag"))),
  ]);
  const generatedAt = snapshotGeneratedAt(posts);

  const graph = {
    generatedAt,
    nodes: graphNodes,
    edges: graphEdges,
  };

  const manifest = {
    generatedAt,
    contentDir: path.relative(root, inputDir),
    postCount: posts.length,
    tagCount: tagMap.size,
    projectCount: projects.length,
    noteCount: notes.length,
    cvCount: cv ? 1 : 0,
    files: {
      posts: "posts.json",
      tags: "tags.json",
      projects: "projects.json",
      notes: "notes.json",
      cv: "cv.json",
      search: "search.json",
      graph: "graph.json",
    },
  };

  await mkdir(targetDir, { recursive: true });
  await writeFile(path.join(targetDir, "index.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(path.join(targetDir, "posts.json"), `${JSON.stringify(posts, null, 2)}\n`);
  await writeFile(path.join(targetDir, "tags.json"), `${JSON.stringify(tagItems, null, 2)}\n`);
  await writeFile(path.join(targetDir, "projects.json"), `${JSON.stringify(projectItems, null, 2)}\n`);
  await writeFile(path.join(targetDir, "notes.json"), `${JSON.stringify(noteItems, null, 2)}\n`);
  await writeFile(path.join(targetDir, "cv.json"), `${JSON.stringify(cvItems, null, 2)}\n`);
  await writeFile(path.join(targetDir, "search.json"), `${JSON.stringify(searchItems, null, 2)}\n`);
  await writeFile(path.join(targetDir, "graph.json"), `${JSON.stringify(graph, null, 2)}\n`);

  console.log(`Wrote AI indexes to ${path.relative(root, targetDir)}: ${posts.length} posts, ${projects.length} projects, ${notes.length} notes, ${cv ? 1 : 0} CV, ${graph.nodes.length} graph nodes`);
} catch (error) {
  usage();
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
