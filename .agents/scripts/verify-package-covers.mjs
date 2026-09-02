#!/usr/bin/env node
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { readPostCollectionMetadata } from "../../src/utils/collection-metadata.mjs";
import { socialContextForPost, socialSvg } from "../../scripts/generate-social-images.mjs";

const root = resolve(new URL("../..", import.meta.url).pathname);
const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const failures = [];

function fail(message) {
  failures.push(message);
}

function pngSize(buffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!buffer.subarray(0, 8).equals(signature)) return undefined;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function requirePath(label, relativePath) {
  if (!existsSync(join(root, relativePath))) fail(`${label} points to missing path: ${relativePath}`);
}

async function walkDirs(dir, relativeDir = "") {
  const ignored = new Set([".git", "dist", "node_modules", ".astro", ".lighthouse"]);
  const forbiddenCopiedDirs = new Set(["astro-papyrus", "astropapyrus", "astro-pure", "astro_theme_pure", "pure-theme"]);
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

if (packageJson.name !== "astro-papyrus") fail(`package name is ${packageJson.name}, expected astro-papyrus`);
if (!packageJson.dependencies?.["astro-pure"]) fail("astro-pure dependency is missing");
if (!packageJson.files?.includes("THIRD_PARTY_NOTICES.md")) {
  fail("package files must include THIRD_PARTY_NOTICES.md");
}
requirePath("third-party notices", "THIRD_PARTY_NOTICES.md");
if (packageJson.dependencies?.["astro-papyrus"] || packageJson.devDependencies?.["astro-papyrus"]) {
  fail("astro-papyrus must not be a direct dependency");
}

await walkDirs(root);

const requiredExports = [
  ".",
  "./components",
  "./config",
  "./PapyrusBaseLayout.astro",
  "./PapyrusPostLayout.astro",
  "./PapyrusHeader.astro",
  "./PapyrusFooter.astro",
  "./PapyrusPostList.astro",
  "./runtime/PapyrusBackToTopRuntime.astro",
  "./runtime/PapyrusMediaRuntime.astro",
  "./runtime/PapyrusPostActionsRuntime.astro",
  "./papyrus.css",
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
  "./plugins",
  "./PapyrusSiteGraph.astro",
  "./rehype-task-list-labels",
  "./shiki",
  "./template/pages/security.txt.ts",
  "./template/pages/profile.keys.ts",
  "./template/pages/profile.gpg.ts",
];

for (const exportName of requiredExports) {
  if (!packageJson.exports?.[exportName]) fail(`required export missing: ${exportName}`);
}

for (const [exportName, target] of Object.entries(packageJson.exports ?? {})) {
  const targets = typeof target === "string" ? [target] : Object.values(target ?? {});
  if (targets.length === 0 || targets.some((value) => typeof value !== "string")) {
    fail(`export ${exportName} has an invalid target`);
    continue;
  }
  for (const exportTarget of targets) requirePath(`export ${exportName}`, exportTarget);
}

for (const [binName, target] of Object.entries(packageJson.bin ?? {})) {
  if (binName.startsWith("papyrus-verify-") || binName === "papyrus-audit-status") {
    fail(`agent-only verifier must not be a public package bin: ${binName}`);
  }
  requirePath(`bin ${binName}`, target);
}

const tmp = await mkdtemp(join(tmpdir(), "papyrus-cover-"));
const coverTestDir = join(root, "public/.agent-cover-test");
const cardCoverFont = [
  process.env.PAPYRUS_TEST_FONT,
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
  "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
  "/Users/marcelof/Library/Fonts/FiraCodeNerdFont-Regular.ttf",
  "/System/Library/Fonts/SFNS.ttf",
  "/System/Library/Fonts/Supplemental/Arial.ttf",
].filter(Boolean).find((fontPath) => existsSync(fontPath));

try {
  const sourcePost = join(tmp, "post.md");
  const socialPostsDir = join(tmp, "posts");
  const socialOutDir = join(tmp, "social");
  const generatedCover = join(coverTestDir, "cover.svg");
  const generatedCardCover = join(tmp, "card-cover.svg");
  const generatedSocialHome = join(socialOutDir, "home.png");
  const generatedSocialPost = join(socialOutDir, "posts", "auto-social.png");
  const generatedDraftSocialPost = join(socialOutDir, "posts", "draft-social.png");
  await writeFile(
    sourcePost,
    `---
title: "A long generated papyrus cover title that should wrap cleanly"
description: "Theme-aware cover description"
cover: /.agent-cover-test/cover.svg
---
`,
    "utf8"
  );
  const socialPost = join(socialPostsDir, "guides", "basics", "auto-social.md");
  await mkdir(join(socialPostsDir, "guides", "basics"), { recursive: true });
  await writeFile(
    socialPost,
    `---
title: "Auto social card"
description: "Post-specific generated sharing image"
slug: auto-social
date: 2026-08-17
cover: /images/package-cover.jpg
tags:
  - astro
  - papyrus
  - docs
  - ignored-fourth-tag
---
`,
    "utf8"
  );
  await writeFile(
    join(socialPostsDir, "guides", "guides.toml"),
    `name = "Guides"
description = "Ordered guides"

[[sections]]
name = "Basics"
description = "Start here"
`,
    "utf8"
  );
  await writeFile(
    join(socialPostsDir, "draft-social.md"),
    `---
title: "Draft social card"
description: "Draft metadata must not become a public image"
date: 2026-09-02
draft: true
---
`,
    "utf8"
  );
  await mkdir(join(socialOutDir, "posts"), { recursive: true });
  await writeFile(generatedDraftSocialPost, "stale draft image", "utf8");
  await writeFile(generatedDraftSocialPost.replace(/\.png$/, ".svg"), "stale draft image", "utf8");

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
    if (!svg.includes("var(--papyrus-bg")) fail("cover SVG does not use --papyrus-bg token");
    if (!svg.includes("var(--papyrus-bg, #f9f5d7)")) fail("cover SVG does not use default theme background fallback");
    if (svg.includes("var(--papyrus-panel") || svg.includes('class="panel"')) {
      fail("cover SVG should use a single background color without an inner panel");
    }
    if (!svg.includes("var(--papyrus-accent")) fail("cover SVG does not use --papyrus-accent token");
    if (!svg.includes("var(--papyrus-accent, #d8a657)")) fail("cover SVG does not use default theme accent fallback");
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
      if (!cardSvg.includes("var(--papyrus-bg")) fail("card cover SVG does not use --papyrus-bg token");
      if (!cardSvg.includes("var(--papyrus-bg, #f9f5d7)")) fail("card cover SVG does not use default theme background fallback");
      if (!cardSvg.includes("var(--papyrus-fg")) fail("card cover SVG does not use --papyrus-fg token");
      if (!cardSvg.includes("var(--papyrus-fg, #654735)")) fail("card cover SVG does not use default theme foreground fallback");
      if (!cardSvg.includes("var(--papyrus-accent")) fail("card cover SVG does not use --papyrus-accent token");
      if (!cardSvg.includes("var(--papyrus-accent, #d8a657)")) fail("card cover SVG does not use default theme accent fallback");
      if (!cardSvg.includes("var(--papyrus-muted")) fail("card cover SVG does not use --papyrus-muted token");
      if (!cardSvg.includes("var(--papyrus-muted, #928374)")) fail("card cover SVG does not use default theme muted fallback");
      if (!cardSvg.includes("var(--papyrus-border")) fail("card cover SVG does not use --papyrus-border token");
      if (!cardSvg.includes("var(--papyrus-border, #d5c4a1)")) fail("card cover SVG does not use default theme border fallback");
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

  const socialResult = spawnSync(
    process.execPath,
    [join(root, "scripts/generate-social-images.mjs"), socialPostsDir, socialOutDir],
    { cwd: root, encoding: "utf8" }
  );
  if (socialResult.status !== 0) {
    fail(`generate-social-images failed: ${socialResult.stderr || socialResult.stdout}`);
  } else {
    const homeSocial = await readFile(generatedSocialHome);
    const postSocial = await readFile(generatedSocialPost);
    for (const [label, png] of [["home", homeSocial], ["post", postSocial]]) {
      const size = pngSize(png);
      if (!size || size.width !== 1200 || size.height !== 630) fail(`${label} social card is not a 1200x630 PNG`);
    }
    if (homeSocial.equals(postSocial)) fail("post social card should differ from the homepage card");
    if (existsSync(generatedDraftSocialPost) || existsSync(generatedDraftSocialPost.replace(/\.png$/, ".svg"))) {
      fail("draft social cards and stale draft social images should not be generated");
    }

    const collectionMetadata = await readPostCollectionMetadata(socialPostsDir);
    const socialContext = socialContextForPost(socialPost, socialPostsDir, collectionMetadata);
    if (socialContext !== "Guides / Basics") fail(`social card collection context was ${socialContext}`);
    const taxonomySvg = socialSvg({
      title: "Taxonomy card",
      description: "Social taxonomy fixture",
      brandTitle: "papyrus",
      brandMark: "twinkle",
      label: "Papyrus",
      tokens: {
        "--papyrus-bg": "#ffffff",
        "--papyrus-fg": "#111111",
        "--papyrus-muted": "#666666",
        "--papyrus-accent": "#008080",
      },
      context: socialContext,
      tags: ["Astro", "papyrus", "astro", "docs", "ignored-fourth-tag"],
    });
    if (!taxonomySvg.includes('class="context">Guides / Basics</text>')) fail("social card SVG is missing collection and section context");
    if (!taxonomySvg.includes('class="tags">#Astro #papyrus #docs</text>')) fail("social card SVG does not deduplicate and cap tags");
    if (taxonomySvg.includes("ignored-fourth-tag")) fail("social card SVG rendered more than three tags");

    const longContext = "A collection context that is intentionally much longer than the available social card line";
    const boundedSvg = socialSvg({
      title: "Bounded card",
      description: "Bounded metadata fixture",
      brandTitle: "papyrus",
      brandMark: "twinkle",
      label: "Papyrus",
      tokens: {
        "--papyrus-bg": "#ffffff",
        "--papyrus-fg": "#111111",
        "--papyrus-muted": "#666666",
        "--papyrus-accent": "#008080",
      },
      context: longContext,
    });
    if (boundedSvg.includes(longContext) || !boundedSvg.includes('class="context">A collection context')) fail("social card context was not truncated");
  }

  const orphanPost = join(tmp, "orphan.md");
  const orphanCover = join(coverTestDir, "orphan.svg");
  await mkdir(coverTestDir, { recursive: true });
  await writeFile(orphanCover, "<svg></svg>\n", "utf8");
  await writeFile(
    orphanPost,
    `---
title: "Post without a configured cover"
description: "No cover should be generated."
---
`,
    "utf8"
  );
  const orphanResult = spawnSync(
    process.execPath,
    [join(root, "scripts/create-cover-svg.mjs"), orphanPost, orphanCover],
    { cwd: root, encoding: "utf8" }
  );
  if (orphanResult.status !== 0) {
    fail(`create-cover-svg no-cover skip failed: ${orphanResult.stderr || orphanResult.stdout}`);
  }
  if (existsSync(orphanCover)) {
    fail("create-cover-svg should remove an orphan target when frontmatter has no matching cover");
  }
  if (!orphanResult.stdout.includes("frontmatter has no cover")) {
    fail("create-cover-svg should explain skipped no-cover generation");
  }
} finally {
  await rm(tmp, { force: true, recursive: true });
  await rm(coverTestDir, { force: true, recursive: true });
}

if (failures.length) {
  console.error("Package/cover verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Verified package exports, bin targets, Pure dependency boundary, and generated cover/card-cover/social images.");
