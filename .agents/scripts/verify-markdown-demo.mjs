#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(new URL("../..", import.meta.url).pathname);
const failures = [];
const codeDemoRoute = "/collections/docs/code-demo/";
const codeDemoSource = "src/content/posts/docs/authoring/10-code-demo.md";

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

const codeDemo = await text(codeDemoSource);
const markdownGuide = await text("src/content/posts/docs/authoring/12-markdown-feature-sample.md");
const markdownConfig = await text("src/markdown/config.mjs");
const publicPost = await text("public/demo/post-demo.md");
const excalidrawFixture = JSON.parse(await text("public/demo/sketch.excalidraw"));
const featureCoverage = JSON.parse(await text(".agents/fixtures/markdown-feature-coverage.json"));

includes(markdownConfig, "remarkArtifactLinks", "artifact-link remark plugin");
includes(markdownConfig, "rehypeCallouts", "rehype-callouts plugin");
includes(markdownConfig, "rehype-callouts", "AstroPapyrus-style callouts dependency import");
includes(markdownConfig, "remarkMermaidBlocks", "Mermaid fence remark plugin");
includes(markdownConfig, "shikiConfig", "Astro Shiki config");
includes(markdownConfig, 'theme: "css-variables"', "Pure-style css-variables Shiki theme");
includes(markdownConfig, "transformerNotationDiff()", "Pure-style Shiki diff transformer");
includes(markdownConfig, "transformerNotationHighlight()", "Pure-style Shiki highlight transformer");
includes(markdownConfig, "transformerRemoveNotationEscape()", "Pure-style Shiki escape transformer");
includes(markdownConfig, "updateStyle()", "Pure-style Shiki wrapper transformer");
includes(markdownConfig, "addTitle()", "Pure-style Shiki title transformer");
includes(markdownConfig, "addLanguage()", "Pure-style Shiki language transformer");
includes(markdownConfig, "addCopyButton(options.copyDuration ?? 2000)", "Pure-style Shiki copy transformer");
includes(markdownConfig, "addCollapse(options.collapseLines ?? 15)", "Pure-style Shiki collapse transformer");
includes(markdownConfig, "../shiki/index.mjs", "local Pure Shiki transformer copy");
excludes(markdownConfig, "@shikijs/transformers", "direct custom Shiki transformer package");
excludes(markdownConfig, "remarkCodeMeta", "custom code metadata wrapper");
excludes(markdownConfig, "rehypePapyrusCode", "custom code block wrapper");

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

for (const [needle, label] of [
  ["## Theme-aware SVGs", "theme-aware SVG authoring section"],
  ["currentColor", "currentColor SVG guidance"],
  ["var(--papyrus-panel)", "Papyrus panel token SVG example"],
  ["var(--papyrus-accent)", "Papyrus accent token SVG example"],
  ["Papyrus does not recolor arbitrary uploaded SVG files", "external SVG limitation"],
  ['aria-label="Theme-aware mark"', "rendered inline SVG example"],
]) {
  includes(markdownGuide, needle, label);
}

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

  if (item.route !== codeDemoRoute) fail(`${feature} coverage should point at ${codeDemoRoute}`);
  if (item.source !== codeDemoSource) fail(`${feature} coverage should point at code-demo source`);
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
