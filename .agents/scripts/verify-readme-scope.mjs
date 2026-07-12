#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const readme = await readFile("README.md", "utf8");
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const agents = await readFile("AGENTS.md", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const lines = readme.trimEnd().split("\n");
assert(lines.length <= 90, `README should stay short, found ${lines.length} lines`);

for (const heading of ["# astro-theme-papyrus", "## Demo", "## Start a Site", "## Features", "## Architecture", "## Documentation"]) {
  assert(readme.includes(heading), `README missing heading: ${heading}`);
}

for (const phrase of [
  "make dev",
  "http://localhost:4326/",
  "make serve",
  "http://192.168.1.102:4326/",
  "Public demo: `https://papyrus.marcelofelix.com/`",
  "Package docs live as a post collection",
  "Open `/collections/docs/` in the public Papyrus site",
  "pnpm create astro@latest -- --template marcelofpfelix/papyrus-template",
  "\"astro-theme-papyrus\": \"^0.2.0\"",
  "Use Papyrus when you want a small content site that feels finished on day one",
  "readable posts, useful docs, searchable archives, social previews, RSS",
  "`marcelofelix` is the real showcase site. It keeps its own content",
  "/collections/docs/code-demo/` and `/posts/markdown-feature-sample/` document authoring",
  "docs/guide.md",
  ".agents/status-roadmap.md",
  "scripts` contains package generators and user-facing CLI helpers",
  ".agents/scripts` contains repo-only verification helpers",
  "README intentionally stays short",
]) {
  assert(readme.includes(phrase), `README missing expected overview/docs phrase: ${phrase}`);
}

for (const forbidden of ["## Roadmap", "## Done", "## Partial", "## Request audit", "https://papyrus.pages.dev/", "| ID | Request / behavior | Status | Evidence | Next action |"] ) {
  assert(!readme.includes(forbidden), `README should not contain tracker/roadmap detail: ${forbidden}`);
}

assert(!readme.includes("Open `/docs/` in the example site"), "README should describe docs as the public Papyrus site, not an example site");
assert(!readme.includes("It should keep its own content") && !readme.includes("show authoring"), "README should use direct showcase and documentation wording");

assert(packageJson.scripts?.["verify:readme"] === "node .agents/scripts/verify-readme-scope.mjs", "verify:readme package script missing");
assert(agents.includes("make verify-readme"), "AGENTS.md should document make verify-readme");

console.log("Verified README stays short and points to demo/docs instead of duplicating roadmap detail.");
