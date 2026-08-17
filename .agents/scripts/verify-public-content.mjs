#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const roots = ["dist", "public"];
const extensions = new Set([".html", ".json", ".md", ".txt", ".xml"]);
const excludedParts = new Set(["_astro", "pagefind"]);
const forbidden = [
  "TODO",
  "FIXME",
  "lorem",
  "dummy",
  "Description not set",
  "Waiting for api",
  "GitHub metadata unavailable",
  "Original CV",
  "docsDescription",
  "baseExample",
  "postExample",
  "commentsExample",
  "pluginExample",
  "demoPluginConfig",
  "__PAPYRUS_CODE_BLOCK",
  "https://example.com",
  "https://github.com/example/site",
  "request audits",
  "What the Site Owns",
  "Configure Site Defaults",
  "Create a Base Page",
  "Route Checklist",
  "Add Posts",
  "Render a Post Page",
  "Enable Search, RSS, and Metadata",
  "Add a Profile",
  "Keep the Boundary Clean",
  "Example Author",
  'data-gh-stars>?',
  'data-gh-forks>?',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function extension(path) {
  const match = path.match(/\.[^.]+$/);
  return match?.[0] ?? "";
}

function shouldSkip(path) {
  return path.split("/").some((part) => excludedParts.has(part));
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (shouldSkip(path)) continue;
    if (entry.isDirectory()) {
      files.push(...await walk(path));
      continue;
    }
    if (extensions.has(extension(entry.name))) files.push(path);
  }

  return files;
}

function publicText(path, source) {
  if (!path.endsWith(".html")) return source;
  return source
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\splaceholder=(["']).*?\1/gi, "")
    .replace(/\s+/g, " ");
}

const files = [];
for (const root of roots) {
  files.push(...await walk(root));
}

const failures = [];
for (const file of files) {
  const content = publicText(file, await readFile(file, "utf8"));
  for (const phrase of forbidden) {
    if (content.includes(phrase)) failures.push(`${relative(process.cwd(), file)} contains ${JSON.stringify(phrase)}`);
  }
}

assert(failures.length === 0, `Public content fallback text found:\n${failures.join("\n")}`);

const llmsFull = await readFile("public/llms-full.txt", "utf8");
assert(llmsFull.includes('<PapyrusPostList posts={posts} view="list" />'), "llms-full.txt should preserve post-list Astro examples");
assert(llmsFull.includes("Source: src/content/posts/docs/start/00-papyrus-docs.md"), "llms-full.txt should include docs overview content");
assert(llmsFull.includes("Source: src/content/posts/docs/references/20-feature-map.md"), "llms-full.txt should include feature-map content");
assert(llmsFull.includes("email_user") && llmsFull.includes("email_domain"), "llms-full.txt should document supported split email TOML fields");

const mainRss = await readFile("dist/rss.xml", "utf8");
assert(mainRss.includes("Reusable Astro theme package for posts, docs, projects, profile/CV pages, search, RSS, and generated metadata."), "main RSS feed should use polished public-site description");
assert(!mainRss.includes("Example feed for Papyrus") && !mainRss.includes("profile examples"), "main RSS feed should not use generic example wording");

const demoSiteData = JSON.parse(await readFile("public/demo/site-data.json", "utf8"));
for (const note of demoSiteData.notes ?? []) {
  assert(!/\b(test|todo|lorem|placeholder)\b/i.test(note.text), `demo note ${note.id} should not read as filler`);
}
for (const project of demoSiteData.projects ?? []) {
  assert(project.description?.length > 40, `project ${project.title} should have a useful public description`);
  assert(Array.isArray(project.links) && project.links.length > 0, `project ${project.title} should expose useful public links`);
  assert(project.status !== "example", `project ${project.title} should not use scaffold-style example status`);
}

const homeHtml = await readFile("dist/index.html", "utf8");
assert(homeHtml.includes("/collections/docs/") && homeHtml.includes("/posts/") && homeHtml.includes("/projects/"), "home page should link core public surfaces");
assert(homeHtml.includes("Papyrus theme") && homeHtml.includes("Papyrus template"), "home page should show current Papyrus projects");
assert(homeHtml.includes('name="twitter:card" content="summary_large_image"'), "home page should use a large social card");
assert(homeHtml.includes('property="og:image" content="https://papyrus.marcelofelix.com/generated/social/home.svg"'), "home page should use the generated site social image");
assert(homeHtml.includes('name="twitter:image:alt" content="papyrus"'), "home page social card should have alt text");

const docsIndexHtml = await readFile("dist/collections/docs/index.html", "utf8");
for (const repoOnlyDoc of ["guide", "request-audit", "status-roadmap", "pure-parity"]) {
  assert(!docsIndexHtml.includes(`/collections/docs/${repoOnlyDoc}/`), `repo-only ${repoOnlyDoc} doc should not be linked from the public docs collection index`);
}
for (const phrase of ["Start", "Authoring", "References", "Deploy", "Feature map", "Markdown code guide", "Papyrus package shape"]) {
  assert(docsIndexHtml.includes(phrase), `docs collection index missing ${phrase}`);
}
assert(!docsIndexHtml.includes("/posts/ai-first-metadata-demo/") && !docsIndexHtml.includes("AI-first metadata"), "docs collection index should not link the removed AI metadata post");

const codeDemoHtml = await readFile("dist/collections/docs/code-demo/index.html", "utf8");
assert(codeDemoHtml.includes('alt="Profile fixture avatar"'), "Markdown code guide should use fixture-style image alt text");
assert(codeDemoHtml.includes("Keep feature walkthroughs explicit"), "Markdown code guide should use walkthrough wording in task lists");
assert(!codeDemoHtml.includes('alt="Example profile avatar"'), "Markdown code guide should not use generic example image alt text");

const contentStructureHtml = await readFile("dist/collections/docs/content-structure/index.html", "utf8");
assert(contentStructureHtml.includes("User-facing docs now live as regular posts under <code>src/content/posts/docs</code>"), "content-structure docs should distinguish public docs from repo-only notes");
assert(contentStructureHtml.includes("Development-only notes stay under <code>.agents/</code>"), "content-structure docs should state repo-only docs boundary");

const profileHtml = await readFile("dist/profile/index.html", "utf8");
assert(profileHtml.includes(">Source<") && profileHtml.includes("profile.toml") && profileHtml.includes("profile.json") && profileHtml.includes("profile.md"), "profile page should expose canonical source links through the shared action menu");
assert(!profileHtml.includes("Original CV"), "profile page should not use the ambiguous Original CV label");

const metadataDemoHtml = await readFile("dist/metadata-demo/index.html", "utf8");
assert(!metadataDemoHtml.includes('rel="canonical" href="https://example.com'), "metadata demo should not publish an example.com canonical URL");
assert(metadataDemoHtml.includes('rel="canonical" href="https://papyrus.marcelofelix.com/metadata-demo/"'), "metadata demo should publish its own canonical URL");
assert(metadataDemoHtml.includes("Post layout reference for published date, updated date, reading time, and tags."), "metadata demo should use reference-style public description");

const installPostHtml = await readFile("dist/posts/install-configure-papyrus/index.html", "utf8");
assert(installPostHtml.includes("email_user") && installPostHtml.includes("email_domain"), "install guide should document supported split email TOML fields");
assert(llmsFull.includes("minimumReleaseAge"), "public docs should document the pnpm mature-release gate");
assert(installPostHtml.includes('name="twitter:card" content="summary_large_image"'), "cover post should use a large social card");
assert(installPostHtml.includes('property="og:image" content="https://papyrus.marcelofelix.com/generated/social/posts/install-configure-papyrus.svg"'), "cover post should use its generated post social image");

const noCoverPostHtml = await readFile("dist/posts/hidden-post-demo/index.html", "utf8");
assert(noCoverPostHtml.includes('name="twitter:card" content="summary_large_image"'), "no-cover post should still use a large social card");
assert(noCoverPostHtml.includes('property="og:image" content="https://papyrus.marcelofelix.com/generated/social/posts/hidden-post-demo.svg"'), "no-cover post should use its generated post social image");

const imageEffectsSocial = await readFile("public/generated/social/posts/image-effects.svg", "utf8");
assert(imageEffectsSocial.includes('href="/images/papyrus-image-effects-demo.jpg"'), "cover posts should use the cover inside the generated social image");

const featuresHtml = await readFile("dist/collections/docs/features/index.html", "utf8");
for (const phrase of ["SEO and social metadata", "Base path deploys", "Search, tags, sitemap, and robots", "Plugin contract"]) {
  assert(featuresHtml.includes(phrase), `features docs should use concrete public docs heading: ${phrase}`);
}
assert(!featuresHtml.includes("category pages"), "features docs should not imply built-in category pages");

console.log("Verified public content avoids scaffold copy and exposes the current docs/profile/metadata surfaces.");
