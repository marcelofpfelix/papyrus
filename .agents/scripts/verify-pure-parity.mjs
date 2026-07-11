#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const doc = await readFile(".agents/pure-parity.md", "utf8");
const agents = await readFile("AGENTS.md", "utf8");
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const astroConfig = await readFile("astro.config.mjs", "utf8");
const shikiExport = await readFile("src/shiki/index.mjs", "utf8");
const shikiCustom = await readFile("src/shiki/shiki-custom-transformers.mjs", "utf8");
const shikiOfficial = await readFile("src/shiki/shiki-official/transformers.mjs", "utf8");
const purePackageJson = JSON.parse(await readFile("node_modules/astro-pure/package.json", "utf8"));
const pureAside = await readFile("node_modules/astro-pure/components/user/Aside.astro", "utf8");
const pureGithubCard = await readFile("node_modules/astro-pure/components/advanced/GithubCard.astro", "utf8");
const pureHeader = await readFile("node_modules/astro-pure/components/basic/Header.astro", "utf8");
const pureIntegration = await readFile("node_modules/astro-pure/index.ts", "utf8");
const purePostPreview = await readFile("node_modules/astro-pure/components/pages/PostPreview.astro", "utf8");
const pureTheme = await readFile("node_modules/astro-pure/utils/theme.ts", "utf8");
const pureTimeline = await readFile("node_modules/astro-pure/components/user/Timeline.astro", "utf8");
const paperFooter = await readFile("src/components/PaperFooter.astro", "utf8");
const paperGithubCard = await readFile("src/components/PaperGithubCard.astro", "utf8");
const paperPostList = await readFile("src/components/PaperPostList.astro", "utf8");
const paperPostLayout = await readFile("src/layouts/PaperPostLayout.astro", "utf8");
const paperPostsIndex = await readFile("src/pages/posts/index.astro", "utf8");
const paperThemeProvider = await readFile("src/components/PaperThemeProvider.astro", "utf8");
const paperTimeline = await readFile("src/components/PaperTimeline.astro", "utf8");
const paperBackToTopRuntime = await readFile("src/components/runtime/PaperBackToTopRuntime.astro", "utf8");
const paperMediaRuntime = await readFile("src/components/runtime/PaperMediaRuntime.astro", "utf8");
const paperPostActionsRuntime = await readFile("src/components/runtime/PaperPostActionsRuntime.astro", "utf8");
const profilePage = await readFile("src/pages/profile/index.astro", "utf8");
const codeDemo = await readFile("src/pages/docs/code-demo.md", "utf8");
const paperCss = await readFile("src/styles/paper.css", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const requiredFeatures = [
  "Theme controls",
  "Code blocks",
  "Timeline/profile",
  "GitHub repository preview",
  "Posts index",
  "Markdown styles",
];

for (const feature of requiredFeatures) {
  assert(doc.includes(`| ${feature} |`), `pure parity checklist missing feature area: ${feature}`);
}

const requiredPhrases = [
  "Pure reference to inspect first",
  "papyrus owner",
  "Current status",
  "Next evidence",
  "Screenshot or DOM/CSS comparison",
  "A broad build, link check, or script existence check is not enough",
  "node_modules/astro-pure/components/basic/Header.astro",
  "node_modules/astro-pure/components/pages/PostPreview.astro",
];

for (const phrase of requiredPhrases) {
  assert(doc.includes(phrase), `pure parity checklist missing required phrase: ${phrase}`);
}

assert(agents.includes("make verify-pure-parity"), "AGENTS.md should document the Pure parity verifier");
assert(packageJson.scripts?.["verify:pure-parity"] === "node .agents/scripts/verify-pure-parity.mjs", "verify:pure-parity script missing");

for (const exportName of [
  "./pure",
  "./pure/user",
  "./pure/advanced",
  "./pure/pages",
  "./pure/basic",
  "./pure/utils",
  "./pure/libs",
  "./runtime/PaperBackToTopRuntime.astro",
  "./runtime/PaperMediaRuntime.astro",
  "./runtime/PaperPostActionsRuntime.astro",
]) {
  assert(packageJson.exports?.[exportName], `papyrus missing required public export: ${exportName}`);
}

for (const sourceExport of ["./user", "./advanced", "./components/pages", "./components/basic", "./utils", "./libs"]) {
  assert(purePackageJson.exports?.[sourceExport], `Pure public export missing or changed: ${sourceExport}`);
}

assert(!purePackageJson.exports?.["./plugins"], "Pure now exposes ./plugins; revisit PP-149 and replace local helpers where compatible");
assert(!purePackageJson.exports?.["./plugins/remark-plugins"], "Pure now exposes plugin subpaths; revisit PP-149 and replace local helpers where compatible");
for (const phrase of ["remarkAddZoomable", "remarkReadingTime", "rehypeExternalLinks", "rehypeTable", "rehypeImageCaption"]) {
  assert(pureIntegration.includes(phrase), `Pure integration no longer wires expected markdown helper: ${phrase}`);
}

for (const phrase of [
  "id='toggleDarkMode'",
  "localStorage.getItem('theme') || 'system'",
  "setTheme(undefined, true)",
  "darkModeBtn.dataset.theme = newTheme",
  "Icon class='system",
  "Icon class='light hidden",
  "Icon class='dark hidden",
  "#toggleDarkMode",
  "&[data-theme='dark']",
  "&[data-theme='light']",
]) {
  assert(pureHeader.includes(phrase), `Pure Header theme control reference changed or missing expected shape: ${phrase}`);
}

for (const phrase of [
  "const themes = ['system', 'dark', 'light']",
  "localStorage.setItem('theme', theme)",
  "document.documentElement.classList.toggle('dark'",
  "meta[name=\"theme-color\"]",
]) {
  assert(pureTheme.includes(phrase), `Pure theme utility reference changed or missing expected lifecycle: ${phrase}`);
}

for (const phrase of [
  "data-paper-theme-toggle",
  "paper-theme-mode-button",
  "paper-mode-icon paper-mode-system",
  "paper-mode-icon paper-mode-light",
  "paper-mode-icon paper-mode-dark",
  "data-paper-theme-profile-value=\"pure\"",
  "data-paper-theme-profile-value=\"catppuccin\"",
  "data-paper-theme-profile-value=\"tokyo-night\"",
  "data-paper-theme-profile-value=\"kanagawa\"",
  "data-paper-theme-profile-value=\"rose-pine\"",
  "data-paper-theme-profile-value=\"everforest\"",
  "data-paper-theme-profile-value=\"dracula\"",
  "data-paper-theme-profile-value=\"gruvbox\"",
  "data-paper-theme-profile-value=\"nord\"",
  "data-paper-font-profile-toggle",
]) {
  assert(paperFooter.includes(phrase), `PaperFooter missing adapted Pure-like theme control markup: ${phrase}`);
}

for (const phrase of [
  "const themes = [\"system\", \"dark\", \"light\"]",
  "localStorage.setItem(\"paper-mode\", theme)",
  "button.dataset.theme = mode",
  "button.setAttribute(\"aria-label\", `Color mode: ${mode}`)",
  "setTheme(undefined, true)",
  "syncThemeControls()",
  "button.closest(\"details\")?.removeAttribute(\"open\")",
]) {
  assert(paperThemeProvider.includes(phrase), `PaperThemeProvider missing adapted Pure-like theme lifecycle: ${phrase}`);
}

for (const phrase of [
  ".paper-theme-mode-button .paper-mode-icon",
  "display: none",
  ".paper-theme-mode-button[data-theme=\"system\"] .paper-mode-system",
  ".paper-theme-mode-button[data-theme=\"light\"] .paper-mode-light",
  ".paper-theme-mode-button[data-theme=\"dark\"] .paper-mode-dark",
  "display: block",
]) {
  assert(paperCss.includes(phrase), `paper theme control CSS missing adapted Pure-like icon behavior: ${phrase}`);
}

for (const phrase of [
  "class='aside my-3 overflow-hidden rounded-xl border'",
  "border-l-8 border-primary",
  "bg-primary",
  "flex items-center gap-x-2 font-medium text-primary",
  "<Icon name={icons[type]} />",
  "aside-content",
  "margin-top: 0",
  "margin-bottom: 0",
]) {
  assert(pureAside.includes(phrase), `Pure Aside reference changed or missing expected shape: ${phrase}`);
}

for (const phrase of [
  "interface Props",
  "events: TimelineEvent[]",
  "events.map((event, index)",
  "event.date",
  "set:html={event.content}",
  "index !== events.length - 1",
]) {
  assert(pureTimeline.includes(phrase), `Pure Timeline reference changed or missing expected shape: ${phrase}`);
}

for (const phrase of [
  "export interface TimelineEvent",
  "events: TimelineEvent[]",
  "events.map((event, index)",
  "event.date",
  "set:html={event.content}",
  "index !== events.length - 1",
]) {
  assert(paperTimeline.includes(phrase), `PaperTimeline missing adapted Pure-like timeline behavior: ${phrase}`);
}

for (const phrase of [
  "const repo = repoRaw.replace(/^https:\\/\\/github\\.com\\//, '')",
  "<github-card",
  "data-repo={repo}",
  "fetch(`https://api.github.com/repos/${repo}`",
  "stargazers_count",
  "forks",
  "license",
  "owner.avatar_url",
]) {
  assert(pureGithubCard.includes(phrase), `Pure GithubCard reference changed or missing expected shape: ${phrase}`);
}

for (const phrase of [
  "const repo = repoRaw.replace(/^https:\\/\\/github\\.com\\//, \"\")",
  "class:list={[\"paper-github-preview\", fetchMetadata && \"loading\"]}",
  "data-repo={repo}",
  "fetch(`https://api.github.com/repos/${repo}`",
  "data-gh-stars",
  "data-gh-forks",
  "data-gh-license",
  "data-gh-avatar",
]) {
  assert(paperGithubCard.includes(phrase), `PaperGithubCard missing adapted Pure-like GitHub preview behavior: ${phrase}`);
}

for (const phrase of [
  "PaperCvActions",
  "PaperCvLinks",
  "PaperTimeline",
  "PaperGithubCard",
  "profileVersionLinks",
  "cv-template-tabs",
  "cv-template-panels",
  "cv-skill-tags",
]) {
  assert(profilePage.includes(phrase), `profile page missing Pure-style/shared component usage: ${phrase}`);
}

for (const phrase of [
  "type Props<T extends CollectionKey>",
  "detailed?: boolean",
  "data.updatedDate ?? data.publishDate",
  "href={`/blog/${id}`}",
  "data.heroImage",
  "data.description",
  "remarkPluginFrontmatter.minutesRead",
  "data.tags.map",
  "cn('post-preview', className)",
]) {
  assert(purePostPreview.includes(phrase), `Pure PostPreview reference changed or missing expected shape: ${phrase}`);
}

for (const phrase of [
  "interface PostItem",
  "view?: \"list\" | \"compact\" | \"cards\"",
  "postHref(post, basePath)",
  "post.data.cover",
  "paper-post-title",
  "paper-post-description",
  "paper-post-meta",
  "post.data.modDatetime",
  "post.data.pinned",
  "postTags(post).map",
  "href={tagHref(tag)}",
]) {
  assert(paperPostList.includes(phrase), `PaperPostList missing adapted Pure-like post preview behavior: ${phrase}`);
}

for (const phrase of [
  "hiddenPosts(demoPosts)",
  "publishedPosts(demoPosts)",
  "sortPostsWithPinned(publishedPosts(demoPosts))",
  "view=\"list\"",
  "withBase(\"/posts/timeline/\")",
  "withBase(\"/tag/\")",
  "withBase(\"/search/?archive=hidden\")",
]) {
  assert(paperPostsIndex.includes(phrase), `posts index missing adapted Pure-like index behavior: ${phrase}`);
}

assert(!paperPostsIndex.includes('data-posts-view="compact"'), "posts index should not render the compact post-list option directly");
assert(!paperPostsIndex.includes('data-posts-view="cards"'), "posts index should not render the cards post-list option directly");

const packageShapePost = await readFile("src/content/posts/papyrus-package-shape.md", "utf8");
for (const phrase of [
  "PaperPostList posts={posts} view=\"list\"",
  "PaperPostList posts={posts} view=\"compact\"",
  "PaperPostList posts={posts} view=\"cards\"",
]) {
  assert(packageShapePost.includes(phrase), `package shape post missing post-list view documentation: ${phrase}`);
}

assert(paperCss.includes('@import "rehype-callouts/theme/obsidian"'), "paper.css should import the rehype-callouts Obsidian theme");
assert(JSON.stringify(packageJson).includes('"rehype-callouts"'), "package should depend on rehype-callouts");
assert(astroConfig.includes("rehypeCallouts") && astroConfig.includes("rehypePlugins: [rehypeCallouts"), "Astro config should wire rehype-callouts as a rehype plugin");
assert(!astroConfig.includes("remarkGithubAlerts"), "Astro config should not use the old custom GitHub alert plugin");
assert(doc.includes("AstroPaper v6.1") && doc.includes("rehype-callouts") && doc.includes("Obsidian theme CSS"), "pure parity doc should record the AstroPaper callout decision");
assert(
  doc.includes("Theme controls are adapted from Pure") && doc.includes("three-icon mode button"),
  "pure parity doc should record the adapted Pure theme-control comparison boundary",
);
assert(
  doc.includes("PaperPostList") && doc.includes("local implementation rather than a wrapper") && doc.includes("Pure `PostPreview`"),
  "pure parity doc should record the stricter Pure posts-index wrapper task",
);
assert(
  doc.includes("PaperTimeline") && doc.includes("PaperGithubCard") && doc.includes("local implementations rather than wrappers"),
  "pure parity doc should record the stricter Pure timeline/profile wrapper task",
);
assert(
  doc.includes("Pure public exports") && doc.includes("astro-theme-papyrus/pure") && doc.includes("pass-through exports"),
  "pure parity doc should record Pure public pass-through export task",
);
assert(
  doc.includes("Upstream Pure app Shiki setup") && doc.includes("Pure's transformer order") && doc.includes("line-number/title/language/copy/diff/highlight/collapse"),
  "pure parity doc should record the upstream Pure Shiki transformer boundary",
);
assert(
  astroConfig.includes('theme: "css-variables"') &&
    astroConfig.includes("transformerNotationDiff()") &&
    astroConfig.includes("transformerNotationHighlight()") &&
    astroConfig.includes("transformerRemoveNotationEscape()") &&
    astroConfig.includes("updateStyle()") &&
    astroConfig.includes("addTitle()") &&
    astroConfig.includes("addLanguage()") &&
    astroConfig.includes("addCopyButton(2000)") &&
    astroConfig.includes("addCollapse(15)") &&
    !astroConfig.includes("rehypePaperCode") &&
    !astroConfig.includes("remarkCodeMeta"),
  "astro config should follow upstream Pure's css-variables Shiki transformer setup without old code wrappers",
);
assert(
  !existsSync("src/markdown/rehype-paper-code.mjs") &&
    !existsSync("src/markdown/remark-code-meta.mjs") &&
    !existsSync("src/components/runtime/PaperCodeRuntime.astro") &&
    !packageJson.exports?.["./runtime/PaperCodeRuntime.astro"] &&
    !packageJson.exports?.["./rehype-paper-code"] &&
    !packageJson.exports?.["./remark-code-meta"],
  "papyrus should not ship local code-block wrappers or code-copy runtime when following Pure behavior",
);
assert(
  packageJson.exports?.["./shiki"] === "./src/shiki/index.mjs" &&
    shikiExport.includes("addCopyButton") &&
    shikiCustom.includes("navigator.clipboard.writeText(this.dataset.code)") &&
    shikiCustom.includes("this.classList.add('copied')") &&
    shikiCustom.includes("this.parentElement.classList.toggle('collapsed')") &&
    shikiOfficial.includes("transformerNotationDiff") &&
    shikiOfficial.includes("transformerNotationHighlight") &&
    shikiOfficial.includes("transformerRemoveNotationEscape"),
  "papyrus should expose the copied upstream Pure Shiki transformer helpers",
);
assert(
  codeDemo.includes('```rust title="src/main.rs"') &&
    codeDemo.includes("/* [!code ++] */") &&
    codeDemo.includes("/* [!code --] */") &&
    codeDemo.includes("// [!code highlight]") &&
    codeDemo.includes('```c title="highlight.c"'),
  "code demo should include Pure Shiki title, diff, and highlight notation examples",
);
assert(
  paperCss.includes(".astro-code .line") &&
    paperCss.includes("counter-reset: step") &&
    paperCss.includes("content: counter(step)") &&
    paperCss.includes(".astro-code .language") &&
    paperCss.includes(".astro-code button.copy") &&
    paperCss.includes("button.copy.copied") &&
    paperCss.includes("opacity: 1 !important") &&
    paperCss.includes(".astro-code .diff.add") &&
    paperCss.includes(".astro-code .highlighted") &&
    paperCss.includes(".astro-code.collapsed"),
  "paper.css should include copied Pure Shiki line-number/title/language/copy/diff/highlight/collapse styling",
);
assert(
  doc.includes("Pure `astro-pure/advanced` `GithubCard`") && doc.includes("Pure `astro-pure/advanced` `LinkPreview`"),
  "pure parity doc should record Pure advanced component wrapper tasks",
);
assert(
  doc.includes("## Pure wrapper decisions") &&
    doc.includes("Direct pass-through via `astro-theme-papyrus/pure/user`") &&
    doc.includes("Pure's component remains available through `astro-theme-papyrus/pure/advanced`") &&
    doc.includes("Pure page components remain available through `astro-theme-papyrus/pure/pages`") &&
    doc.includes("Use split Paper runtime components"),
  "pure parity doc should record component-by-component Pure wrapper decisions",
);
for (const phrase of [
  "PaperBackToTopRuntime",
  "PaperMediaRuntime",
  "PaperPostActionsRuntime",
  "resolvedFeatures.artifactLinks",
  "resolvedFeatures.imageZoom",
  "resolvedFeatures.mermaid",
]) {
  assert(paperPostLayout.includes(phrase), `PaperPostLayout missing split optional runtime wiring: ${phrase}`);
}
for (const forbidden of [
  "function copyTextForCode",
  "function hydrateArtifactLinks",
  "function bindImageZoom",
  "function mermaidThemeConfig",
  "document.querySelectorAll<HTMLButtonElement>(\"[data-paper-share]\")",
]) {
  assert(!paperPostLayout.includes(forbidden), `PaperPostLayout still owns runtime behavior that should be extracted: ${forbidden}`);
}
for (const phrase of ["data-paper-back-to-top", "window.scrollY > 500", "window.scrollTo"]) {
  assert(paperBackToTopRuntime.includes(phrase), `PaperBackToTopRuntime missing behavior: ${phrase}`);
}
for (const phrase of ["artifactLinksEnabled", "imageZoomEnabled", "mermaidEnabled", "hydrateArtifactLinks", "renderPaperMermaidDiagrams", "bindImageZoom"]) {
  assert(paperMediaRuntime.includes(phrase), `PaperMediaRuntime missing optional media behavior: ${phrase}`);
}
for (const phrase of ["data-paper-share", "data-paper-copy-source", "data-paper-copy-citation", "setActionButtonState"]) {
  assert(paperPostActionsRuntime.includes(phrase), `PaperPostActionsRuntime missing post action behavior: ${phrase}`);
}
assert(
  doc.includes("Pure markdown plugins are integration-private") && doc.includes("not deep-imported"),
  "pure parity doc should record the safe boundary for Pure private markdown plugins",
);

console.log("Verified Pure parity checklist coverage, verifier wiring, adapted Pure theme controls, stricter Pure wrapper/export tasks, Pure Shiki marker task, and AstroPaper/rehype-callouts source comparison.");
