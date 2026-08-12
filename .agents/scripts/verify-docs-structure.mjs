#!/usr/bin/env node
import { access, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const readme = await readFile("README.md", "utf8");
const statusRoadmap = await readFile(".agents/status-roadmap.md", "utf8");
const requestAudit = await readFile(".agents/request-audit.md", "utf8");
const astroPapyrusParity = await readFile(".agents/astropapyrus-parity.md", "utf8");
const packageGuide = await readFile(".agents/package-guide.md", "utf8");
const docsCollection = await readFile("src/content/posts/docs/docs.toml", "utf8");
const docsIntro = await readFile("src/content/posts/docs/start/00-papyrus-docs.md", "utf8");
const contentStructure = await readFile("src/content/posts/docs/authoring/11-content-structure.md", "utf8");
const installGuide = await readFile("src/content/posts/docs/start/02-install-configure-papyrus.md", "utf8");
const markdownFeaturePost = await readFile("src/content/posts/docs/authoring/12-markdown-feature-sample.md", "utf8");
const releaseChecklist = await readFile("src/content/posts/docs/deploy/31-release-checklist.md", "utf8");
const themeSpec = await readFile("src/content/posts/docs/references/27-theme-spec.md", "utf8");
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const agents = await readFile("AGENTS.md", "utf8");
const legacyGuidePath = ["docs", "guide.md"].join("/");

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

async function walkMarkdown(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walkMarkdown(path));
    if (entry.isFile() && entry.name.endsWith(".md")) files.push(path);
  }
  return files;
}

for (const phrase of [
  "Open `/collections/docs/` in the public Papyrus site",
  "Package docs live as a post collection",
  ".agents/package-guide.md",
  ".agents/scripts` contains repo-only verification helpers",
]) {
  assert(readme.includes(phrase), `README missing docs pointer: ${phrase}`);
}

for (const forbidden of [
  "## Done",
  "## Roadmap",
  "| ID | Request / behavior | Status | Evidence | Next action |",
  legacyGuidePath,
]) {
  assert(!readme.includes(forbidden), `README should not contain roadmap/audit detail: ${forbidden}`);
}

assert(!(await exists("docs")), "top-level docs/ should not exist; public docs belong in src/content/posts/docs and agent notes belong in .agents");
assert(!(await exists("src/pages/docs")), "legacy src/pages/docs routes should not exist; docs render through the collections routes");
assert(!packageJson.files?.includes("docs"), "package files should not include a top-level docs folder");

for (const phrase of [
  "This file is a summary and historical roadmap index only",
  ".agents/request-audit.md",
  "authoritative request-by-request tracker",
  "the audit wins",
  "Do not add duplicate status tables",
  "Every feature, bug, behavior, and roadmap item gets its own row",
]) {
  assert(statusRoadmap.includes(phrase), `status roadmap missing non-authoritative disclaimer: ${phrase}`);
}

assert(!/^## Done$/m.test(statusRoadmap), "status roadmap should not use a broad Done heading");
assert(!/^## Partial$/m.test(statusRoadmap), "status roadmap should not keep a second Partial section");
assert(!/^## Pending$/m.test(statusRoadmap), "status roadmap should not keep a second Pending section");
assert(!statusRoadmap.includes("| Request | Status source | Demo visibility | Notes |"), "status roadmap should not keep a second request matrix");

for (const phrase of [
  "per-request source of truth",
  "Do not use broad",
  "run-level status such as \"done\"",
  "Each row must be updated",
  "## Status meanings",
]) {
  assert(requestAudit.includes(phrase), `request audit missing source-of-truth phrase: ${phrase}`);
}

const repoOnlyDocs = [
  "astropapyrus-parity",
  "cv-source-comparison",
  "package-guide",
  "pure-parity",
  "request-audit",
  "starlight-comparison",
  "status-roadmap",
];

for (const slug of repoOnlyDocs) {
  assert(!(await exists(`src/content/posts/docs/${slug}.md`)), `${slug} should stay agent-only, not render as a docs collection post`);
}

for (const phrase of [
  "Papyrus should not claim AstroPapyrus feature parity by default",
  "Typed central config resolver",
  "Dynamic OG image route",
  "Pagination and per-index config",
  "Language, direction, timezone, profile, and verification config",
  "Before release notes claim AstroPapyrus parity",
]) {
  assert(astroPapyrusParity.includes(phrase), `AstroPapyrus parity decisions missing phrase: ${phrase}`);
}
assert(!astroPapyrusParity.includes("| Partial |"), "AstroPapyrus parity decisions should not keep ambiguous Partial rows");
assert(!astroPapyrusParity.includes("Implement next"), "AstroPapyrus parity decisions should not keep open-ended Implement next rows");
assert(docsCollection.includes('name = "Papyrus docs"'), "docs collection metadata missing collection name");
for (const section of ["Start", "Authoring", "References", "Deploy"]) {
  assert(docsCollection.includes(`name = "${section}"`), `docs collection missing ${section} section`);
}

const docsPosts = await walkMarkdown("src/content/posts/docs");
for (const file of docsPosts) {
  const post = await readFile(file, "utf8");
  assert(post.startsWith("---\n"), `${file} should be a public post with frontmatter`);
  assert(/^slug: /m.test(post), `${file} missing slug frontmatter`);
}

for (const [post, phrase] of [
  [docsIntro, "Repo-only notes stay under `.agents/`"],
  [contentStructure, "Development-only notes stay under `.agents/`"],
  [installGuide, "Because the pages are injected by the package"],
  [markdownFeaturePost, "Markdown authoring guide"],
  [releaseChecklist, "Smoke install the packed tarball"],
  [themeSpec, "public behavior contract for `papyrus`"],
]) {
  assert(post.includes(phrase), `docs collection post missing phrase: ${phrase}`);
}

assert(!docsIntro.includes("repository `docs/`"), "docs intro should not point repo-only notes to the legacy docs folder");
assert(!contentStructure.includes("repository `docs/`"), "content structure docs should not point repo-only notes to the legacy docs folder");
assert(packageGuide.includes("Reference order"), "agent package guide should keep maintainer reference order");
assert(packageJson.scripts?.["verify:docs"] === "node .agents/scripts/verify-docs-structure.mjs", "verify:docs package script missing");
assert(agents.includes("make verify-docs"), "AGENTS.md should document make verify-docs");

console.log("Verified public docs live in the docs post collection and agent-only notes stay under .agents.");
