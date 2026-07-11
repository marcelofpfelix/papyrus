#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(new URL("../..", import.meta.url).pathname);
const failures = [];

function fail(message) {
  failures.push(message);
}

async function text(relativePath) {
  return readFile(join(root, relativePath), "utf8");
}

function includes(source, needle, label) {
  if (!source.includes(needle)) fail(`missing ${label}: ${needle}`);
}

function excludes(source, needle, label) {
  if (source.includes(needle)) fail(`unexpected ${label}: ${needle}`);
}

function exists(relativePath) {
  if (!existsSync(join(root, relativePath))) fail(`missing file: ${relativePath}`);
}

const codeDemo = await text("src/pages/docs/code-demo.md");
const astroConfig = await text("astro.config.mjs");
const publicPost = await text("public/demo/post-demo.md");
const excalidrawFixture = JSON.parse(await text("public/demo/sketch.excalidraw"));
const featureCoverage = JSON.parse(await text(".agents/fixtures/markdown-feature-coverage.json"));

includes(astroConfig, "remarkArtifactLinks", "artifact-link remark plugin");
includes(astroConfig, "rehypeCallouts", "rehype-callouts plugin");
includes(astroConfig, "rehype-callouts", "AstroPaper-style callouts dependency import");
includes(astroConfig, "remarkMermaidBlocks", "Mermaid fence remark plugin");
includes(astroConfig, "shikiConfig", "Astro Shiki config");
includes(astroConfig, 'theme: "css-variables"', "Pure-style css-variables Shiki theme");
includes(astroConfig, "transformerNotationDiff()", "Pure-style Shiki diff transformer");
includes(astroConfig, "transformerNotationHighlight()", "Pure-style Shiki highlight transformer");
includes(astroConfig, "transformerRemoveNotationEscape()", "Pure-style Shiki escape transformer");
includes(astroConfig, "updateStyle()", "Pure-style Shiki wrapper transformer");
includes(astroConfig, "addTitle()", "Pure-style Shiki title transformer");
includes(astroConfig, "addLanguage()", "Pure-style Shiki language transformer");
includes(astroConfig, "addCopyButton(2000)", "Pure-style Shiki copy transformer");
includes(astroConfig, "addCollapse(15)", "Pure-style Shiki collapse transformer");
includes(astroConfig, "./src/shiki/index.mjs", "local Pure Shiki transformer copy");
excludes(astroConfig, "@shikijs/transformers", "direct custom Shiki transformer package");
excludes(astroConfig, "remarkCodeMeta", "custom code metadata wrapper");
excludes(astroConfig, "rehypePaperCode", "custom code block wrapper");

const codeDemoChecks = [
  ['```rust title="src/main.rs"', "Rust titled code fence"],
  ['```css title="diff.css"', "CSS titled diff-notation fence"],
  ['/* [!code --] */', "removed-line Shiki notation"],
  ['/* [!code ++] */', "added-line Shiki notation"],
  ['```c title="highlight.c"', "C titled highlight fence"],
  ["// [!code highlight]", "highlight Shiki notation"],
  ["```console", "console fence"],
  ['```rust title="src/server.rs"', "collapsible Rust code fence"],
  ["> [!WARNING]- Collapsed warning", "collapsed Obsidian callout"],
  ["> [!TIP]+ Expanded tip", "expanded collapsible Obsidian callout"],
  ["> [!NOTE]", "GitHub note alert syntax"],
  ["> [!TIP]", "GitHub tip alert syntax"],
  ["> [!IMPORTANT]", "GitHub important alert syntax"],
  ["> [!WARNING]", "GitHub warning alert syntax"],
  ["> [!CAUTION]", "GitHub caution alert syntax"],
  ["- [x] Keep feature walkthroughs explicit", "checked task list item"],
  ["- [ ] Document the source files beside rendered artifacts", "unchecked task list item"],
  ["https://github.com/marcelofpfelix/papyrus", "autolink sample"],
  ["`inline code`", "inline code sample"],
  ["~~strikethrough~~", "strikethrough sample"],
  ["| Feature | Expected behavior |", "markdown table"],
  ["```mermaid", "Mermaid fence"],
  ["/demo/demo-profile-avatar.svg", "demo SVG image"],
  ["/demo/theme-flow.mmd", "Mermaid artifact link"],
  ["/demo/call-flow.puml", "PlantUML artifact link"],
  ["/demo/sketch.excalidraw", "Excalidraw artifact link"],
  ["## Fallback rendering", "fallback rendering section"],
  ["PlantUML inline rendering | Keep as a file link", "PlantUML fallback label"],
  ["Excalidraw inline rendering | Keep as a file link", "Excalidraw fallback label"],
  ["Wiki links like `[[topic]]` | Keep as plain text", "wiki-link fallback label"],
  ["Footnotes like `[^1]` | Render when a consuming site adds", "footnote fallback label"],
];

for (const [needle, label] of codeDemoChecks) includes(codeDemo, needle, label);

const requiredFeatures = [
  "rust-code",
  "diff-code",
  "console-code",
  "highlight-code",
  "collapsible-code",
  "obsidian-callouts",
  "task-list",
  "table",
  "mermaid-fence",
  "image-zoom",
  "artifact-links",
  "unsupported-github-edge-cases",
];

for (const feature of requiredFeatures) {
  const item = featureCoverage.find((entry) => entry.feature === feature);
  if (!item) {
    fail(`missing markdown feature coverage entry: ${feature}`);
    continue;
  }

  if (item.route !== "/docs/code-demo/") fail(`${feature} coverage should point at /docs/code-demo/`);
  if (item.source !== "src/pages/docs/code-demo.md") fail(`${feature} coverage should point at code-demo source`);
  if (!item.sourceNeedle || !codeDemo.includes(item.sourceNeedle)) fail(`${feature} sourceNeedle not found in code demo`);
  if (!item.selector) fail(`${feature} coverage missing rendered selector`);
  if (!Array.isArray(item.screenshots) || item.screenshots.length !== 3) fail(`${feature} coverage should map to desktop/tablet/mobile screenshots`);
  for (const screenshot of item.screenshots ?? []) {
    if (!screenshot.startsWith(".screenshots/responsive/code-demo-")) fail(`${feature} screenshot path should point at responsive code-demo output: ${screenshot}`);
  }
}

includes(publicPost, "```console", "public copy-source console fence");
includes(publicPost, "tags: [authoring, markdown, theme]", "public post source authoring tags");
excludes(publicPost, "tags: [examples", "generic examples tag in public post source");
if (!Array.isArray(excalidrawFixture.elements) || excalidrawFixture.elements.length < 3) {
  fail("Excalidraw fixture should include visible public artifact elements");
}
if (excalidrawFixture.source !== "papyrus public artifact fixture") {
  fail("Excalidraw fixture should identify itself as a public artifact fixture");
}
exists("public/demo/post-demo.md");
exists("public/demo/theme-flow.mmd");
exists("public/demo/call-flow.puml");
exists("public/demo/sketch.excalidraw");
exists("public/demo/demo-profile-avatar.svg");
exists(".agents/fixtures/markdown-feature-coverage.json");

if (failures.length) {
  console.error("Markdown demo coverage verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Verified markdown demo source coverage, feature mapping, screenshot references, and markdown helper wiring.");
