#!/usr/bin/env node
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const coveragePage = await readFile("src/pages/docs/feature-map.astro", "utf8");
const docsIndex = await readFile("src/pages/docs/index.astro", "utf8");
const demoPosts = await readFile("src/data/demo-posts.ts", "utf8");
const builtDocsIndex = await readFile("dist/docs/index.html", "utf8");
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const agents = await readFile("AGENTS.md", "utf8");

const routeSources = [
  ["/", "src/pages/index.astro"],
  ["/posts/install-configure-papyrus/", "src/content/posts/install-configure-papyrus.md"],
  ["/metadata-demo/", "src/pages/metadata-demo.astro"],
  ["/docs/code-demo/", "src/pages/docs/code-demo.md"],
  ["/posts/", "src/pages/posts/index.astro"],
  ["/search/", "src/pages/search.astro"],
  ["/profile/", "src/pages/profile/index.astro"],
  ["/profile/print/", "src/pages/profile/print.astro"],
  ["/docs/cv-demo/", "src/pages/docs/cv-demo.astro"],
  ["/docs/cv-data/", "src/pages/docs/cv-data.astro"],
  ["/projects/", "src/pages/projects.astro"],
  ["/docs/features/", "src/pages/docs/features.astro"],
  ["/docs/content-structure/", "src/pages/docs/content-structure.astro"],
  ["/docs/graph/", "src/pages/docs/graph.astro"],
  ["/docs/deploy/", "src/pages/docs/deploy.astro"],
  ["/docs/ai-mobile/", "src/pages/docs/ai-mobile.astro"],
];

const builtRoutes = [
  ["/", "dist/index.html"],
  ["/posts/install-configure-papyrus/", "dist/posts/install-configure-papyrus/index.html"],
  ["/metadata-demo/", "dist/metadata-demo/index.html"],
  ["/docs/code-demo/", "dist/docs/code-demo/index.html"],
  ["/posts/", "dist/posts/index.html"],
  ["/search/", "dist/search/index.html"],
  ["/profile/", "dist/profile/index.html"],
  ["/profile/print/", "dist/profile/print/index.html"],
  ["/docs/cv-demo/", "dist/docs/cv-demo/index.html"],
  ["/docs/cv-data/", "dist/docs/cv-data/index.html"],
  ["/projects/", "dist/projects/index.html"],
  ["/docs/features/", "dist/docs/features/index.html"],
  ["/docs/content-structure/", "dist/docs/content-structure/index.html"],
  ["/docs/graph/", "dist/docs/graph/index.html"],
  ["/docs/deploy/", "dist/docs/deploy/index.html"],
  ["/docs/ai-mobile/", "dist/docs/ai-mobile/index.html"],
  ["/docs/feature-map/", "dist/docs/feature-map/index.html"],
];

const expectedPublicRoutes = [
  ["/", "papyrus", "Reusable Astro theme package"],
  ["/404", "Page not found", "Find a matching Papyrus page"],
  ["/about/", "About", "Compact about page pattern"],
  ["/docs/", "Docs", "Package docs for installing"],
  ["/docs/ai-mobile/", "AI and mobile readiness", "AI metadata"],
  ["/docs/code-demo/", "Markdown code guide", "Pure-style Astro/Shiki"],
  ["/docs/content-structure/", "Generated content structure", "nested Markdown folders"],
  ["/docs/cv-data/", "CV data sources", "TOML or Astro content collection"],
  ["/docs/cv-demo/", "CV/profile components", "normalized TOML data source"],
  ["/docs/cv-demo/jekyll/", "Classic jekyllcv template", "jekyllcv-compatible"],
  ["/docs/cv-demo/print/", "Mira Lee", "Printable CV"],
  ["/docs/deploy/", "Deploy Papyrus", "Local preview"],
  ["/docs/feature-map/", "Feature map", "public Papyrus features"],
  ["/docs/features/", "Feature config", "feature toggles"],
  ["/docs/graph/", "Content graph", "generated AI metadata"],
  ["/metadata-demo/", "Post metadata display", "Post layout reference"],
  ["/posts/", "Posts", "list, tag, archive, RSS"],
  ["/posts/ai-first-metadata-demo/", "AI-first metadata", "llms.txt"],
  ["/posts/cv-profile/", "Profile and CV", "timeline views"],
  ["/posts/dark-mode-and-search/", "Dark mode and search", "search flow"],
  ["/posts/folder-tags-demo/", "Folder tags for nested posts", "stable slugs"],
  ["/posts/install-configure-papyrus/", "Install and configure Papyrus", "consuming-site guide"],
  ["/posts/markdown-feature-sample/", "Markdown authoring guide", "practical guide"],
  ["/posts/papyrus-package-shape/", "Papyrus package shape", "Package-boundary guide"],
  ["/posts/theme-profiles/", "Theme profiles", "Light/dark profiles"],
  ["/posts/timeline/", "Timeline", "Chronological archive"],
  ["/profile/", "Mira Lee", "public fixture"],
  ["/profile/print/", "Mira Lee", "Printable CV"],
  ["/profile/ast/", "Mira Lee", "ATS-friendly printable CV"],
  ["/projects/", "Projects", "Project list page"],
  ["/search/", "Search", "Static search"],
  ["/tag/", "Tags", "Browse Papyrus posts by tag"],
  ["/tag/ai/", "#ai", "Posts tagged ai"],
  ["/tag/astro/", "#astro", "Posts tagged astro"],
  ["/tag/changelog/", "#changelog", "Posts tagged changelog"],
  ["/tag/code/", "#code", "Posts tagged code"],
  ["/tag/content-model/", "#content-model", "Posts tagged content-model"],
  ["/tag/custom/", "#custom", "Posts tagged custom"],
  ["/tag/cv/", "#cv", "Posts tagged cv"],
  ["/tag/dark-mode/", "#dark-mode", "Posts tagged dark-mode"],
  ["/tag/docs/", "#docs", "Posts tagged docs"],
  ["/tag/authoring/", "#authoring", "Posts tagged authoring"],
  ["/tag/guides/", "#guides", "Posts tagged guides"],
  ["/tag/markdown/", "#markdown", "Posts tagged markdown"],
  ["/tag/metadata/", "#metadata", "Posts tagged metadata"],
  ["/tag/papyrus/", "#papyrus", "Posts tagged papyrus"],
  ["/tag/profile/", "#profile", "Posts tagged profile"],
  ["/tag/search/", "#search", "Posts tagged search"],
  ["/tag/theme/", "#theme", "Posts tagged theme"],
];

const requiredPhrases = [
  "Install and configure Papyrus",
  "Post metadata display",
  "Layout, header, footer, and theme controls",
  "Post layout and actions",
  "Markdown authoring guide",
  "source/copy/share actions",
  "Pure-style Astro/Shiki code blocks",
  "Posts index and tags",
  "Search and tag filters",
  "CV/profile templates",
  "CV data sources",
  "Projects and GitHub cards",
  "Feature flags and plugin contract",
  "Content structure helpers",
  "AI indexes and graph",
  "Deploy and local preview",
  "AI and mobile readiness",
];

for (const phrase of requiredPhrases) {
  assert(coveragePage.includes(phrase), `demo coverage page missing phrase: ${phrase}`);
}

for (const [route, source] of routeSources) {
  assert(coveragePage.includes(`href: "${route}"`), `feature map missing route ${route}`);
  assert(existsSync(source), `demo coverage route source missing for ${route}: ${source}`);
}

for (const [route, builtPath] of builtRoutes) {
  assert(existsSync(builtPath), `built demo route missing for ${route}: ${builtPath}`);
}

async function walkHtml(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "_astro" || entry.name === "pagefind") continue;
      files.push(...await walkHtml(path));
    } else if (entry.name.endsWith(".html")) {
      files.push(path);
    }
  }

  return files;
}

function routeFor(file) {
  return `/${file.replace(/^dist\//, "").replace(/index\.html$/, "").replace(/404\.html$/, "404")}`;
}

function textFromHtml(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
}

const actualRoutes = (await walkHtml("dist")).map(routeFor).sort();
const expectedRoutes = expectedPublicRoutes.map(([route]) => route).sort();
assert(JSON.stringify(actualRoutes) === JSON.stringify(expectedRoutes), `public route set changed.\nExpected:\n${expectedRoutes.join("\n")}\nActual:\n${actualRoutes.join("\n")}`);

for (const [route, heading, description] of expectedPublicRoutes) {
  const file = route === "/404" ? "dist/404.html" : route === "/" ? "dist/index.html" : `dist${route}index.html`;
  const html = textFromHtml(await readFile(file, "utf8"));
  assert(html.includes(heading), `${route} missing expected public heading/title text: ${heading}`);
  assert(html.includes(description), `${route} missing expected public description text: ${description}`);
}

assert(docsIndex.includes("Feature map"), "docs index missing Feature map link");
assert(docsIndex.includes("/docs/feature-map/"), "docs index missing feature map href");
assert(docsIndex.includes("Post metadata display"), "docs index missing metadata demo link");
assert(docsIndex.includes("/metadata-demo/"), "docs index missing metadata demo href");
assert(demoPosts.includes('slug: "ai-first-metadata-demo"'), "shared demo post data missing AI-first metadata post");
assert(demoPosts.includes('filePath: "src/content/posts/ai-first-demo.md"'), "shared demo post data should point AI-first metadata to its Markdown source");
assert(builtDocsIndex.includes("Install and configure Papyrus"), "built docs index missing install/configure post");
assert(builtDocsIndex.includes("/posts/install-configure-papyrus/"), "built docs index missing install/configure href");
assert(packageJson.scripts?.["verify:demo"] === "node .agents/scripts/verify-demo-coverage.mjs", "verify:demo package script missing");
assert(agents.includes("make verify-demo"), "AGENTS.md should document make verify-demo");

console.log("Verified package feature map, route sources, and built route outputs.");
