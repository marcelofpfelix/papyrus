#!/usr/bin/env node
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function routeFile(route) {
  if (route === "/") return "dist/index.html";
  if (route === "/404") return "dist/404.html";
  return `dist${route}index.html`;
}

function textFromHtml(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
}

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const agents = await readFile("AGENTS.md", "utf8");
const featureMap = await readFile("src/content/posts/docs/references/20-feature-map.md", "utf8");
const docsConfig = await readFile("src/content/posts/docs/docs.toml", "utf8");
const demoPosts = await readFile("src/data/demo-posts.ts", "utf8");

const routeSources = [
  ["/", "src/pages/index.astro"],
  ["/404", "src/template/pages/404.astro"],
  ["/about/", "src/pages/about.astro"],
  ["/collections/", "src/template/pages/collections.astro"],
  ["/collections/docs/", "src/content/posts/docs/docs.toml"],
  ["/collections/docs/code-demo/", "src/content/posts/docs/authoring/10-code-demo.md"],
  ["/collections/docs/feature-map/", "src/content/posts/docs/references/20-feature-map.md"],
  ["/collections/docs/install-configure-papyrus/", "src/content/posts/docs/start/02-install-configure-papyrus.md"],
  ["/collections/docs/papyrus-package-shape/", "src/content/posts/docs/references/24-papyrus-package-shape.md"],
  ["/metadata-demo/", "src/pages/metadata-demo.astro"],
  ["/posts/", "src/template/pages/posts/index.astro"],
  ["/posts/timeline/", "src/template/pages/posts/timeline.astro"],
  ["/profile/", "src/pages/profile/index.astro"],
  ["/profile/print/", "src/template/pages/profile/print.astro"],
  ["/profile/ast/", "src/template/pages/profile/ast.astro"],
  ["/projects/", "src/pages/projects.astro"],
  ["/search/", "src/template/pages/search.astro"],
  ["/tag/", "src/template/pages/tag/index.astro"],
];

const expectedPublicRoutes = [
  ["/", "papyrus", "Reusable Astro theme package"],
  ["/404", "Page not found", "The page may have moved"],
  ["/about/", "About", "A Papyrus about page should be short"],
  ["/collections/", "Collections", "Available collections"],
  ["/collections/docs/", "Papyrus docs", "Template-first docs"],
  ["/collections/docs/code-demo/", "Markdown code guide", "Pure-style Astro/Shiki"],
  ["/collections/docs/feature-map/", "Feature map", "Route-by-route guide"],
  ["/collections/docs/install-configure-papyrus/", "Install and configure Papyrus", "papyrus-template"],
  ["/collections/docs/papyrus-package-shape/", "Papyrus package shape", "Package-boundary guide"],
  ["/metadata-demo/", "Post metadata display", "Post layout reference"],
  ["/posts/", "Posts", "Timeline"],
  ["/posts/timeline/", "Timeline", "Theme-aware image effects"],
  ["/profile/", "Mira Lee", "Profile"],
  ["/profile/print/", "Mira Lee", "Printable CV"],
  ["/profile/ast/", "Mira Lee", "ATS-friendly printable CV"],
  ["/projects/", "Projects", "Project list page"],
  ["/search/", "Search", "#ai"],
  ["/tag/", "Tags", "#papyrus"],
];

for (const [route, source] of routeSources) {
  assert(existsSync(source), `demo coverage route source missing for ${route}: ${source}`);
}

for (const [route, heading, description] of expectedPublicRoutes) {
  const file = routeFile(route);
  assert(existsSync(file), `built demo route missing for ${route}: ${file}`);
  const html = textFromHtml(await readFile(file, "utf8"));
  assert(html.includes(heading), `${route} missing expected public heading/title text: ${heading}`);
  assert(html.includes(description), `${route} missing expected public description text: ${description}`);
}

for (const href of [
  "/collections/docs/install-configure-papyrus/",
  "/collections/docs/site-config/",
  "/collections/docs/markdown-feature-sample/",
  "/collections/docs/collections/",
  "/collections/docs/profile/",
  "/collections/docs/papyrus-package-shape/",
  "/collections/docs/deploy/",
]) {
  assert(featureMap.includes(href), `feature map missing current docs collection href: ${href}`);
}

assert(docsConfig.includes('name = "Papyrus docs"'), "docs collection config missing name");
assert(docsConfig.includes('name = "Start"'), "docs collection config missing Start section");
assert(docsConfig.includes('name = "Authoring"'), "docs collection config missing Authoring section");
assert(docsConfig.includes('name = "References"'), "docs collection config missing References section");
assert(docsConfig.includes('name = "Deploy"'), "docs collection config missing Deploy section");
assert(demoPosts.includes('slug: "ai-mobile"'), "shared demo post data missing AI/mobile metadata post");
assert(demoPosts.includes('filePath: "src/content/posts/docs/references/21-ai-mobile.md"'), "shared demo post data should point AI/mobile metadata to its Markdown source");
assert(packageJson.scripts?.["verify:demo"] === "node .agents/scripts/verify-demo-coverage.mjs", "verify:demo package script missing");
assert(agents.includes("make verify-demo"), "AGENTS.md should document make verify-demo");

console.log("Verified package demo route sources and representative built route outputs.");
