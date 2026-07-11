#!/usr/bin/env node
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const root = resolve(new URL("../..", import.meta.url).pathname);
const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const failures = [];

function fail(message) {
  failures.push(message);
}

function requirePath(label, relativePath) {
  if (!existsSync(join(root, relativePath))) fail(`${label} points to missing path: ${relativePath}`);
}

async function walkDirs(dir, relativeDir = "") {
  const ignored = new Set([".git", "dist", "node_modules", ".astro", ".lighthouse"]);
  const forbiddenCopiedDirs = new Set(["astro-paper", "astropaper", "astro-pure", "astro_theme_pure", "pure-theme"]);
  const entries = await readdir(join(dir, relativeDir), { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (ignored.has(entry.name)) continue;

    const relativePath = relativeDir ? join(relativeDir, entry.name) : entry.name;
    const normalized = entry.name.toLowerCase().replace(/[_\s]/g, "-");
    if (forbiddenCopiedDirs.has(normalized)) {
      fail(`forbidden copied upstream theme directory: ${relativePath}`);
    }

    await walkDirs(dir, relativePath);
  }
}

if (packageJson.name !== "astro-theme-papyrus") fail(`package name is ${packageJson.name}, expected astro-theme-papyrus`);
if (!packageJson.dependencies?.["astro-pure"]) fail("astro-pure dependency is missing");
if (packageJson.dependencies?.["astro-paper"] || packageJson.devDependencies?.["astro-paper"]) {
  fail("astro-paper must not be a direct dependency");
}

await walkDirs(root);

const requiredExports = [
  ".",
  "./components",
  "./config",
  "./PaperBaseLayout.astro",
  "./PaperPostLayout.astro",
  "./PaperHeader.astro",
  "./PaperFooter.astro",
  "./PaperPostList.astro",
  "./runtime/PaperBackToTopRuntime.astro",
  "./runtime/PaperMediaRuntime.astro",
  "./runtime/PaperPostActionsRuntime.astro",
  "./paper.css",
  "./themes/pure.css",
  "./themes/catppuccin.css",
  "./themes/tokyo-night.css",
  "./themes/kanagawa.css",
  "./themes/rose-pine.css",
  "./themes/everforest.css",
  "./themes/dracula.css",
  "./themes/gruvbox.css",
  "./themes/nord.css",
  "./utils",
  "./pure",
  "./pure/advanced",
  "./pure/basic",
  "./pure/libs",
  "./pure/pages",
  "./pure/user",
  "./pure/utils",
  "./rehype-task-list-labels",
  "./shiki",
];

for (const exportName of requiredExports) {
  if (!packageJson.exports?.[exportName]) fail(`required export missing: ${exportName}`);
}

for (const [exportName, target] of Object.entries(packageJson.exports ?? {})) {
  if (typeof target !== "string") {
    fail(`export ${exportName} is not a string target`);
    continue;
  }
  requirePath(`export ${exportName}`, target);
}

for (const [binName, target] of Object.entries(packageJson.bin ?? {})) {
  if (binName.startsWith("papyrus-verify-") || binName === "papyrus-audit-status") {
    fail(`agent-only verifier must not be a public package bin: ${binName}`);
  }
  requirePath(`bin ${binName}`, target);
}

const tmp = await mkdtemp(join(tmpdir(), "papyrus-cover-"));
const cardCoverFont = [
  process.env.PAPYRUS_TEST_FONT,
  "/Users/marcelof/Library/Fonts/FiraCodeNerdFont-Regular.ttf",
  "/System/Library/Fonts/SFNS.ttf",
  "/System/Library/Fonts/Supplemental/Arial.ttf",
].filter(Boolean).find((fontPath) => existsSync(fontPath));

try {
  const sourcePost = join(tmp, "post.md");
  const generatedCover = join(tmp, "cover.svg");
  const generatedCardCover = join(tmp, "card-cover.svg");
  await writeFile(
    sourcePost,
    `---
title: "A long generated papyrus cover title that should wrap cleanly"
description: "Theme-aware cover description"
---
`,
    "utf8"
  );

  const coverResult = spawnSync(
    process.execPath,
    [join(root, "scripts/create-cover-svg.mjs"), sourcePost, generatedCover],
    { cwd: root, encoding: "utf8" }
  );

  if (coverResult.status !== 0) {
    fail(`create-cover-svg failed: ${coverResult.stderr || coverResult.stdout}`);
  } else {
    const svg = await readFile(generatedCover, "utf8");
    if (!svg.includes('viewBox="0 0 1200 630"')) fail("cover SVG does not use 1200x630 viewBox");
    if (!svg.includes("var(--paper-bg")) fail("cover SVG does not use --paper-bg token");
    if (!svg.includes("var(--paper-bg, #f9f5d7)")) fail("cover SVG does not use default theme background fallback");
    if (svg.includes("var(--paper-panel") || svg.includes('class="panel"')) {
      fail("cover SVG should use a single background color without an inner panel");
    }
    if (!svg.includes("var(--paper-accent")) fail("cover SVG does not use --paper-accent token");
    if (!svg.includes("var(--paper-accent, #d8a657)")) fail("cover SVG does not use default theme accent fallback");
    if (!svg.includes('class="brand-mark"')) fail("cover SVG should use the default Twinkling brand mark");
    if (!svg.includes('class="brand">papyrus</text>')) fail("cover SVG should use the default papyrus brand title");
    if (!svg.includes("Theme-aware cover description")) fail("cover SVG did not read frontmatter description");
    const titleLineCount = (svg.match(/class="title"/g) ?? []).length;
    if (titleLineCount < 2 || titleLineCount > 3) {
      fail(`cover SVG title wrapping produced ${titleLineCount} title lines, expected 2 or 3`);
    }
    const descLineCount = (svg.match(/class="desc"/g) ?? []).length;
    if (descLineCount < 1 || descLineCount > 3) {
      fail(`cover SVG description wrapping produced ${descLineCount} description lines, expected 1 to 3`);
    }
  }

  if (!cardCoverFont) {
    fail("no local font available for create-card-cover smoke test");
  } else {
    const cardCoverResult = spawnSync(
      process.execPath,
      [join(root, "scripts/create-card-cover.mjs"), sourcePost, generatedCardCover, cardCoverFont],
      { cwd: root, encoding: "utf8" }
    );

    if (cardCoverResult.status !== 0) {
      fail(`create-card-cover failed: ${cardCoverResult.stderr || cardCoverResult.stdout}`);
    } else {
      const cardSvg = await readFile(generatedCardCover, "utf8");
      if (!cardSvg.includes('viewBox="0 0 1200 630"')) fail("card cover SVG does not use 1200x630 viewBox");
      if (!cardSvg.includes('role="img"')) fail("card cover SVG is missing role=img");
      if (!cardSvg.includes("data-title-lines=")) fail("card cover SVG is missing title line metadata");
      if (!cardSvg.includes("var(--paper-bg")) fail("card cover SVG does not use --paper-bg token");
      if (!cardSvg.includes("var(--paper-bg, #f9f5d7)")) fail("card cover SVG does not use default theme background fallback");
      if (!cardSvg.includes("var(--paper-fg")) fail("card cover SVG does not use --paper-fg token");
      if (!cardSvg.includes("var(--paper-fg, #654735)")) fail("card cover SVG does not use default theme foreground fallback");
      if (!cardSvg.includes("var(--paper-accent")) fail("card cover SVG does not use --paper-accent token");
      if (!cardSvg.includes("var(--paper-accent, #d8a657)")) fail("card cover SVG does not use default theme accent fallback");
      if (!cardSvg.includes("var(--paper-muted")) fail("card cover SVG does not use --paper-muted token");
      if (!cardSvg.includes("var(--paper-muted, #928374)")) fail("card cover SVG does not use default theme muted fallback");
      if (!cardSvg.includes("var(--paper-border")) fail("card cover SVG does not use --paper-border token");
      if (!cardSvg.includes("var(--paper-border, #d5c4a1)")) fail("card cover SVG does not use default theme border fallback");
      for (const forbidden of ["#fafafa", "#18181b", "#2563eb", "#52525b", "#71717a", "#e4e4e7"]) {
        if (cardSvg.includes(`fill=\"${forbidden}\"`) || cardSvg.includes(`stroke=\"${forbidden}\"`)) {
          fail(`card cover SVG still contains hardcoded color attribute ${forbidden}`);
        }
      }
      const titleLines = Number(cardSvg.match(/data-title-lines="(\d+)"/)?.[1] ?? 0);
      if (titleLines < 2 || titleLines > 3) {
        fail(`card cover title wrapping produced ${titleLines} title lines, expected 2 or 3`);
      }
    }
  }
} finally {
  await rm(tmp, { force: true, recursive: true });
}

if (failures.length) {
  console.error("Package/cover verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Verified package exports, bin targets, Pure dependency boundary, and generated cover/card-cover SVGs.");
