#!/usr/bin/env node
import { access, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const siteUrl = process.env.SITE_URL ?? "https://papyrus.marcelofelix.com";
const tmp = await mkdtemp(join(tmpdir(), "papyrus-ai-"));
const publicOut = join(tmp, "public");
const aiOut = join(publicOut, "ai");
const rssOut = join(publicOut, "rss", "tags");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function walkDocs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkDocs(fullPath));
    } else if (/\.(astro|md|mdx)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function docsUrlFor(file) {
  const relative = file
    .replace(/^src\/pages\/docs\/?/, "")
    .replace(/\.(astro|md|mdx)$/i, "");
  const parts = relative.split("/").filter(part => part && part !== "index");
  const pathname = `/docs/${parts.length > 0 ? `${parts.join("/")}/` : ""}`;
  return new URL(pathname, siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`).toString();
}

async function compareGenerated(relativePath) {
  const generated = await readFile(join(publicOut, relativePath), "utf8");
  const currentPath = join("public", relativePath);
  if (await exists(currentPath)) {
    const current = await readFile(currentPath, "utf8");
    assert(current === generated, `${currentPath} is stale; regenerate ${relativePath}`);
  }
}

async function compareGeneratedJson(relativePath, normalize = value => value) {
  const generated = normalize(await readJson(join(publicOut, relativePath)));
  const currentPath = join("public", relativePath);
  if (await exists(currentPath)) {
    const current = normalize(await readJson(currentPath));
    assert(JSON.stringify(current) === JSON.stringify(generated), `${currentPath} is stale; regenerate ${relativePath}`);
  }
}

function withoutGeneratedAt(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const { generatedAt: _generatedAt, ...rest } = value;
    return rest;
  }
  return value;
}

try {
  await execFileAsync("node", ["scripts/generate-llms.mjs", "src/content/posts", publicOut, siteUrl, "src/pages/docs"]);
  await execFileAsync("node", ["scripts/generate-ai-indexes.mjs", "src/content/posts", aiOut, siteUrl, "public/demo/site-data.json"]);
  await execFileAsync("node", ["scripts/generate-tag-rss.mjs", "src/content/posts", rssOut]);
  await execFileAsync("node", ["scripts/validate-ai-metadata.mjs", "src/content/posts", "public/demo/site-data.json"]);

  const llms = await readFile(join(publicOut, "llms.txt"), "utf8");
  const full = await readFile(join(publicOut, "llms-full.txt"), "utf8");
  assert(llms.includes("# Content index"), "llms.txt missing content index heading");
  assert(llms.includes("AI-first metadata"), "llms.txt missing AI metadata post");
  assert(llms.includes(`${siteUrl}/posts/ai-first-metadata-demo/`), "llms.txt missing absolute post URL");
  assert(llms.includes("# Documentation URLs"), "llms.txt missing documentation URLs heading");
  assert(llms.includes(`${siteUrl}/docs/`), "llms.txt missing docs index URL");
  assert(llms.includes(`${siteUrl}/docs/code-demo/`), "llms.txt missing code demo docs URL");
  const docsFiles = await walkDocs("src/pages/docs");
  const docsUrls = docsFiles.map(docsUrlFor);
  assert(docsUrls.length >= 10, `expected at least 10 docs URLs, found ${docsUrls.length}`);
  for (const url of docsUrls) {
    assert(llms.includes(url), `llms.txt missing documentation URL ${url}`);
  }
  assert(full.includes("# Full content corpus"), "llms-full.txt missing corpus heading");
  assert(full.includes("Source: src/content/posts/ai-first-demo.md"), "llms-full.txt missing source path");
  assert(full.includes("Source: src/pages/docs/index.astro"), "llms-full.txt missing docs index source path");
  assert(full.includes("Open the Markdown guide to review code, alerts, diagrams, artifact links, and Markdown behavior."), "llms-full.txt missing public docs index copy");
  assert(full.includes("Deploy Papyrus"), "llms-full.txt missing public deploy docs copy");
  assert(full.includes("Every public feature has a route"), "llms-full.txt missing public feature-map docs copy");
  assert(full.includes('<PapyrusPostList posts={posts} view="list" />'), "llms-full.txt should preserve fenced Astro component examples");
  assert(full.includes('<PapyrusBaseLayout title="Posts" description="All posts.">'), "llms-full.txt should preserve fenced layout examples");
  assert(!full.includes("Folder tags for nested posts"), "llms-full.txt should exclude hidden posts");
  assert(!full.includes('import { demoNav }'), "llms-full.txt should not expose Astro docs implementation imports");
  assert(!full.includes("const demoPlugins"), "llms-full.txt should not expose Astro docs implementation constants");
  assert(!full.includes("const features ="), "llms-full.txt should not expose Astro docs implementation arrays");
  assert(!full.includes("baseExample") && !full.includes("postExample") && !full.includes("commentsExample") && !full.includes("pluginExample"), "llms-full.txt should not expose Astro docs expression placeholders");

  const posts = await readJson(join(aiOut, "posts.json"));
  const tags = await readJson(join(aiOut, "tags.json"));
  const projects = await readJson(join(aiOut, "projects.json"));
  const notes = await readJson(join(aiOut, "notes.json"));
  const cv = await readJson(join(aiOut, "cv.json"));
  const search = await readJson(join(aiOut, "search.json"));
  const graph = await readJson(join(aiOut, "graph.json"));
  const index = await readJson(join(aiOut, "index.json"));

  assert(Array.isArray(posts) && posts.length >= 1, "posts.json should contain posts");
  assert(posts.some(post => post.id === "post:ai-first-metadata-demo" && post.slug === "ai-first-metadata-demo" && post.sourcePath === "src/content/posts/ai-first-demo.md"), "posts.json missing stable AI metadata post source metadata");
  assert(!posts.some(post => post.slug === "folder-tags-demo" || post.id === "post:folder-tags-demo"), "posts.json should exclude hidden posts");
  assert(Array.isArray(tags) && tags.some(tag => tag.id === "tag:ai" && tag.tag === "ai" && tag.count >= 1), "tags.json missing stable #ai tag");
  assert(Array.isArray(projects) && projects.some(project => project.id === "project:papyrus"), "projects.json should contain stable demo projects");
  assert(Array.isArray(notes) && notes.some(note => note.id === "note:pure-shiki-code"), "notes.json should contain stable demo notes");
  assert(Array.isArray(cv) && cv.some(item => item.id === "cv:mira-lee" && item.type === "cv" && item.name === "Mira Lee"), "cv.json should contain stable CV metadata");
  assert(Array.isArray(search) && search.some(item => item.id === "post:ai-first-metadata-demo" && item.type === "post" && item.text.includes("same public content set")), "search.json missing searchable stable post text");
  assert(search.some(item => item.id === "project:ai-indexes" && item.text.includes("Static JSON")), "search.json missing searchable project text");
  assert(Array.isArray(graph.nodes) && graph.nodes.some(node => node.id === "post:ai-first-metadata-demo"), "graph.json missing post node");
  assert(Array.isArray(graph.edges) && graph.edges.some(edge => edge.relation === "has-tag"), "graph.json missing tag edges");
  assert(index.files?.posts === "posts.json" && index.files?.search === "search.json" && index.files?.graph === "graph.json", "ai/index.json missing generated file map");

  const rssIndex = await readJson(join(rssOut, "index.json"));
  const aiFeed = await readFile(join(rssOut, "ai.xml"), "utf8");
  const astroFeed = await readFile(join(rssOut, "astro.xml"), "utf8");
  assert(Array.isArray(rssIndex) && rssIndex.some(item => item.tag === "ai" && item.feed === "/rss/tags/ai.xml"), "RSS tag index missing #ai feed");
  assert(aiFeed.includes("<title>#ai posts</title>"), "ai RSS feed missing title");
  assert(aiFeed.includes("/posts/ai-first-metadata-demo/"), "ai RSS feed missing post URL");
  assert(!astroFeed.includes("/posts/folder-tags-demo/"), "tag RSS feeds should exclude hidden posts");

  await compareGenerated("llms.txt");
  await compareGenerated("llms-full.txt");
  await compareGeneratedJson("ai/posts.json");
  await compareGeneratedJson("ai/tags.json");
  await compareGeneratedJson("ai/projects.json");
  await compareGeneratedJson("ai/notes.json");
  await compareGeneratedJson("ai/cv.json");
  await compareGeneratedJson("ai/search.json");
  await compareGeneratedJson("ai/graph.json", withoutGeneratedAt);
  await compareGeneratedJson("ai/index.json", withoutGeneratedAt);
  await compareGeneratedJson("rss/tags/index.json");
  await compareGenerated("rss/tags/ai.xml");
  await compareGenerated("rss/tags/authoring.xml");

  const metadataComponent = await readFile("src/components/PapyrusAiMetadata.astro", "utf8");
  const postLayout = await readFile("src/layouts/PapyrusPostLayout.astro", "utf8");
  assert(metadataComponent.includes('"@id": stableId'), "PapyrusAiMetadata should emit JSON-LD @id");
  assert(postLayout.includes('id={canonicalUrl ? `${canonicalUrl.replace(/#.*$/, "")}#post` : undefined}'), "PapyrusPostLayout should pass a stable post JSON-LD id");

  console.log("Verified llms files with all docs URLs, stable AI JSON indexes, search index, graph export, metadata validation, and tag RSS feeds.");
} finally {
  await rm(tmp, { recursive: true, force: true });
}
