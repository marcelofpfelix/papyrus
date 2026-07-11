#!/usr/bin/env node
import { access, readFile } from "node:fs/promises";

const readme = await readFile("README.md", "utf8");
const statusRoadmap = await readFile(".agents/status-roadmap.md", "utf8");
const requestAudit = await readFile(".agents/request-audit.md", "utf8");
const astroPaperParity = await readFile(".agents/astropaper-parity.md", "utf8");
const docsIndex = await readFile("src/pages/docs/index.astro", "utf8");
const contentConfig = await readFile("src/content.config.ts", "utf8");
const docsIndexContent = await readFile("src/content/docs/index.md", "utf8");
const markdownFeaturePost = await readFile("src/content/posts/markdown-feature-sample.md", "utf8");
const publicPostDocs = [
  await readFile("src/content/posts/ai-first-demo.md", "utf8"),
  await readFile("src/content/posts/dark-mode-and-search.md", "utf8"),
  await readFile("src/content/posts/install-configure-papyrus.md", "utf8"),
  await readFile("src/content/posts/markdown-feature-sample.md", "utf8"),
  await readFile("src/content/posts/papyrus-package-shape.md", "utf8"),
];
const docsUtils = await readFile("src/utils/docs.ts", "utf8");
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const agents = await readFile("AGENTS.md", "utf8");

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

for (const phrase of [
  "Open `/docs/` in the public Papyrus site",
  "scripts",
  "docs",
]) {
  assert(readme.includes(phrase), `README missing docs pointer: ${phrase}`);
}

for (const forbidden of [
  "## Done",
  "## Roadmap",
  "| ID | Request / behavior | Status | Evidence | Next action |",
]) {
  assert(!readme.includes(forbidden), `README should not contain roadmap/audit detail: ${forbidden}`);
}

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
  "astropaper-parity",
  "cv-source-comparison",
  "guide",
  "pure-parity",
  "request-audit",
  "starlight-comparison",
  "status-roadmap",
  "theme-spec",
];

for (const slug of repoOnlyDocs) {
  assert(!(await exists(`src/pages/docs/${slug}.astro`)), `${slug} should stay repo-only, not render as /docs/${slug}/`);
  assert(!(await exists(`src/pages/docs/${slug}.md`)), `${slug} should stay repo-only, not render as /docs/${slug}/`);
  assert(!docsIndex.includes(`/docs/${slug}/`), `docs index should not link to repo-only ${slug} route`);
}

assert(docsIndex.includes("/docs/deploy/"), "public deploy guide should remain linked from docs index");
for (const phrase of [
  "Papyrus should not claim AstroPaper feature parity by default",
  "Typed central config resolver",
  "Dynamic OG image route",
  "Pagination and per-index config",
  "Language, direction, timezone, profile, and verification config",
  "Before release notes claim AstroPaper parity",
]) {
  assert(astroPaperParity.includes(phrase), `AstroPaper parity decisions missing phrase: ${phrase}`);
}
assert(!astroPaperParity.includes("| Partial |"), "AstroPaper parity decisions should not keep ambiguous Partial rows");
assert(!astroPaperParity.includes("Implement next"), "AstroPaper parity decisions should not keep open-ended Implement next rows");
assert(docsIndex.includes("Feature map"), "docs index missing Feature map link");
assert(contentConfig.includes("const docs = defineCollection"), "content config missing docs collection");
assert(docsIndexContent.includes("sections:"), "src/content/docs/index.md missing section metadata");
const declaredDocSections = [...docsIndexContent.matchAll(/^\s+- id: ([a-z-]+)$/gm)].map(match => match[1]);
assert(declaredDocSections.length > 0, "src/content/docs/index.md should declare docs section ids");
for (const post of publicPostDocs) {
  const section = post.match(/^\s+section: ([a-z-]+)$/m)?.[1];
  if (section) {
    assert(declaredDocSections.includes(section), `post-backed docs entry uses unknown docs section: ${section}`);
  }
}
assert(docsIndex.includes('getCollection("docs")'), "docs page should read section metadata from src/content/docs/index.md");
assert(docsIndex.includes("postDocIndexItem"), "docs page should include posts marked as docs");
assert(docsIndex.includes("buildDocIndex"), "docs page should build an ordered docs index");
assert(docsUtils.includes('source?: "doc" | "post"'), "docs utils should preserve post/doc source metadata");
assert(markdownFeaturePost.includes("docs:") && markdownFeaturePost.includes("section: authoring"), "markdown demo post should opt into docs indexing");
assert(packageJson.scripts?.["verify:docs"] === "node .agents/scripts/verify-docs-structure.mjs", "verify:docs package script missing");
assert(agents.includes("make verify-docs"), "AGENTS.md should document make verify-docs");

console.log("Verified roadmap/status details stay in repo docs and are not rendered as public demo pages.");
