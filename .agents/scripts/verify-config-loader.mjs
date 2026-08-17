#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { siteConfig } from "../../scripts/site-config.mjs";

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const configSource = await readFile("src/config/index.ts", "utf8");
const configToml = await readFile("papyrus.config.toml", "utf8");
const baseLayout = await readFile("src/layouts/PapyrusBaseLayout.astro", "utf8");
const postLayout = await readFile("src/layouts/PapyrusPostLayout.astro", "utf8");
const giscusComponent = await readFile("src/components/PapyrusGiscusComments.astro", "utf8");
const papyrusCss = await readFile("src/styles/papyrus.css", "utf8");
const installGuide = await readFile("src/content/posts/docs/start/02-install-configure-papyrus.md", "utf8");
const siteConfigGuide = await readFile("src/content/posts/docs/start/03-site-config.md", "utf8");
const themeSpec = await readFile("src/content/posts/docs/references/27-theme-spec.md", "utf8");
const demoNav = await readFile("src/data/demo-nav.ts", "utf8");
const demoSite = await readFile("src/data/demo-site.ts", "utf8");
const siteConfigSource = await readFile("scripts/site-config.mjs", "utf8");

const configModule = await import("../../src/config/index.ts");
const defaults = configModule.resolvePapyrusConfig();
const parsed = configModule.parsePapyrusConfigToml(configToml);
const loaded = await configModule.loadPapyrusConfig();
const scriptConfig = await siteConfig();
const parsedProjectConfig = configModule.parsePapyrusConfigToml(`
[[project]]
title = "Template project"
description = "Project configured from TOML."
href = "/projects/template/"
image = "/images/template.svg"
repo = "https://github.com/site-owner/template"
pinned = true
status = "active"

  [[project.links]]
  href = "https://github.com/site-owner/template"
  label = "repo"
  text = "site-owner/template"
`);
const parsedOpsConfig = configModule.parsePapyrusConfigToml(`
[seo]
google_verification = "google-token"

[verification]
bing = "bing-token"
yandex = "yandex-token"

[[verification_meta]]
name = "p:domain_verify"
content = "pinterest-token"

	[analytics]
	enabled = true
	provider = "plausible"
	domain = "site.test"
	include_in_dev = false

	[comments]
	enabled = true
	provider = "giscus"
	repo = "site-owner/site-repo"
	repo_id = "R_test"
	category = "Announcements"
	category_id = "DIC_test"
	mapping = "pathname"
	term = "custom-discussion-term"
	number = 42
	description = "Comments for a custom discussion."
	back_link = "https://site.test/posts/custom/"
	strict = false
	reactions_enabled = true
	emit_metadata = false
	input_position = "bottom"
	theme = "preferred_color_scheme"
	light_theme = "light"
	dark_theme = "dark_dimmed"
	lang = "en"
	loading = "lazy"
	
	[[head.meta]]
name = "fediverse:creator"
content = "@site@example.social"

[[head.link]]
rel = "me"
href = "https://example.social/@site"

[[head.script]]
src = "https://example.test/script.js"
defer = true

[security_txt]
contact = ["mailto:security@example.com", "https://site.test/security"]
preferred_languages = "en, pt"
policy = "https://site.test/security-policy"
`);

assert(packageJson.exports?.["./config"] === "./src/config/index.mjs", "package export ./config missing");
assert(packageJson.exports?.["./content"] === "./src/content.ts", "package export ./content missing");
assert(packageJson.exports?.["./integration"] === "./src/integration.mjs", "package export ./integration missing");
assert(packageJson.scripts?.["verify:config"] === "node .agents/scripts/verify-config-loader.mjs", "verify:config script missing");

for (const symbol of ["PapyrusSiteConfig", "definePapyrusConfig", "resolvePapyrusConfig", "parsePapyrusConfigToml", "loadPapyrusConfig"]) {
  assert(configSource.includes(symbol), `config loader missing ${symbol}`);
}

assert(parsed.title === "papyrus", "parsed title should come from papyrus.config.toml");
assert(parsed.site === "https://papyrus.marcelofelix.com", "parsed site URL should come from papyrus.config.toml");
assert(parsed.lang === "en", "parsed language should come from papyrus.config.toml");
assert(parsed.timezone === "Europe/Lisbon", "parsed timezone should come from papyrus.config.toml");
assert(parsed.defaultThemeProfile === "gruvbox", "parsed theme profile should come from papyrus.config.toml");
assert(parsed.defaultFontProfile === "readable", "parsed font profile should come from papyrus.config.toml");
assert(parsed.nav.length === 5 && parsed.nav[0].href === "/posts/", "parsed nav should contain five TOML links");
assert(parsed.footerLinks.length === 1 && parsed.footerLinks[0]?.href === "/collections/docs/", "parsed footer links should come from TOML");
assert(parsed.socialLinks[0]?.href === "https://github.com/marcelofpfelix/papyrus", "parsed social link should come from TOML");
assert(parsed.features.search === true && parsed.features.sourceActions === true, "parsed feature flags should merge with defaults");
assert(parsed.postCard.tags === false, "parsed post-card tags flag should come from TOML");
assert(parsed.postCard.readTime === false, "parsed post-card read time flag should come from TOML");
assert(parsed.postCard.updatedDateOnly === true, "parsed post-card updated-date flag should come from TOML");
assert(parsed.postCard.limit === 20, "parsed post-card limit should come from TOML");
assert(parsed.profile.images.effect === "tritone", "parsed profile image effect should come from TOML");
assert(parsed.markdown.linkStyle === "accent-hover-underline", "parsed markdown link style should come from TOML");
assert(parsed.markdown.headingStyle === "plain", "parsed markdown heading style should come from TOML");
assert(parsed.markdown.markerStyle === "accent", "parsed markdown marker style should come from TOML");
assert(parsed.markdown.blockquoteStyle === "accent-bar", "parsed markdown blockquote style should come from TOML");
assert(parsed.markdown.tableStyle === "horizontal", "parsed markdown table style should come from TOML");
assert(parsed.markdown.tableHeaderStyle === "muted", "parsed markdown table header style should come from TOML");
assert(parsed.markdown.inlineCodeStyle === "panel", "parsed markdown inline code style should come from TOML");
assert(defaults.postCard.tags === false, "default post-card tags should be hidden");
assert(defaults.postCard.readTime === false, "default post-card read time should be hidden");
assert(defaults.postCard.freshIndicators === true, "default post-card fresh indicators should be enabled");
assert(defaults.postCard.freshIndicatorText === true, "default post-card fresh indicator text should be enabled");
assert(defaults.postCard.updatedDateOnly === true, "default post-card updated date only should be enabled");
assert(defaults.postCard.limit === 20, "default post-card limit should be 20");
assert(defaults.profile.images.effect === "none", "default profile image effect should be disabled");
assert(defaults.markdown.linkStyle === "accent-hover-underline", "default markdown link style should use accent hover underline");
assert(defaults.markdown.headingStyle === "plain", "default markdown heading style should be plain");
assert(defaults.markdown.markerStyle === "accent", "default markdown marker style should be accent");
assert(defaults.markdown.blockquoteStyle === "accent-bar", "default markdown blockquote style should use accent bar");
assert(defaults.markdown.tableStyle === "horizontal", "default markdown table style should be horizontal");
assert(defaults.markdown.tableHeaderStyle === "muted", "default markdown table header style should be muted");
assert(defaults.markdown.inlineCodeStyle === "panel", "default markdown inline code style should use panel");
assert(defaults.verification.length === 0, "default verification meta should be empty");
assert(defaults.analytics.enabled === false, "default analytics should be disabled");
assert(defaults.analytics.includeInDev === false, "default analytics should not load in dev");
assert(defaults.comments.enabled === false, "default comments should be disabled");
assert(defaults.comments.provider === "giscus", "default comments provider should be giscus");
assert(defaults.comments.category === "Announcements", "default comments category should be Announcements");
assert(defaults.comments.mapping === "pathname", "default comments mapping should use pathname");
assert(defaults.comments.lightTheme === "papyrus", "default comments light theme should be papyrus");
assert(defaults.comments.darkTheme === "papyrus", "default comments dark theme should be papyrus");
assert(defaults.head.meta.length === 0 && defaults.head.links.length === 0 && defaults.head.scripts.length === 0, "default head entries should be empty");
assert(defaults.footerLinks.length === 0, "default footer links should be empty");
assert(defaults.securityTxt.contacts.length === 0, "default security.txt contacts should be empty");
for (const page of ["posts", "timeline", "tags", "search", "projects", "about"]) {
  assert(defaults.pages[page]?.description === false, `default ${page} page description should be hidden`);
}
const aboutOnly = configModule.resolvePapyrusConfig({ pages: { about: { content: "About body" } } });
assert(aboutOnly.pages.about?.description === false, "page defaults should merge with about content overrides");
assert(aboutOnly.pages.about?.content === "About body", "about content override should be preserved");
assert(aboutOnly.pages.posts?.description === false, "page defaults should survive partial page overrides");
const profileOnly = configModule.resolvePapyrusConfig({ profile: { images: { effect: "tritone" } } });
assert(profileOnly.profile.images.effect === "tritone", "profile image effect override should be preserved");
const ditherProfile = configModule.resolvePapyrusConfig({ profile: { images: { effect: "dither" } } });
assert(ditherProfile.profile.images.effect === "dither", "profile image dither effect override should be preserved");
const markdownOverride = configModule.resolvePapyrusConfig({ markdown: { linkStyle: "underline", tableStyle: "grid", inlineCodeStyle: "accent-soft" } });
assert(markdownOverride.markdown.linkStyle === "underline", "markdown link style override should be preserved");
assert(markdownOverride.markdown.tableStyle === "grid", "markdown table style override should be preserved");
assert(markdownOverride.markdown.inlineCodeStyle === "accent-soft", "markdown inline code style override should be preserved");
assert(parsedProjectConfig.projects.length === 1, "parsed project config should include one TOML project");
assert(parsedProjectConfig.projects[0]?.title === "Template project", "parsed project title should come from TOML");
assert(parsedProjectConfig.projects[0]?.links?.[0]?.text === "site-owner/template", "parsed project link text should come from TOML");
assert(parsedProjectConfig.projects[0]?.pinned === true, "parsed project pinned flag should come from TOML");
assert(parsedOpsConfig.verification.some(item => item.name === "google-site-verification" && item.content === "google-token"), "Google verification shorthand should become meta config");
assert(parsedOpsConfig.verification.some(item => item.name === "msvalidate.01" && item.content === "bing-token"), "Bing verification should become msvalidate.01");
assert(parsedOpsConfig.verification.some(item => item.name === "yandex-site-verification" && item.content === "yandex-token"), "Yandex verification should become provider meta");
assert(parsedOpsConfig.verification.some(item => item.name === "p:domain_verify" && item.content === "pinterest-token"), "generic verification_meta should be parsed");
assert(parsedOpsConfig.analytics.enabled === true, "analytics enabled flag should parse");
assert(parsedOpsConfig.analytics.provider === "plausible", "analytics provider should parse");
assert(parsedOpsConfig.analytics.domain === "site.test", "analytics domain should parse");
assert(parsedOpsConfig.analytics.includeInDev === false, "analytics include_in_dev should parse");
assert(parsedOpsConfig.comments.enabled === true, "comments enabled flag should parse");
assert(parsedOpsConfig.comments.provider === "giscus", "comments provider should parse");
assert(parsedOpsConfig.comments.repo === "site-owner/site-repo", "comments repo should parse");
assert(parsedOpsConfig.comments.repoId === "R_test", "comments repo_id should parse");
assert(parsedOpsConfig.comments.category === "Announcements", "comments category should parse");
assert(parsedOpsConfig.comments.categoryId === "DIC_test", "comments category_id should parse");
assert(parsedOpsConfig.comments.mapping === "pathname", "comments mapping should parse");
assert(parsedOpsConfig.comments.term === "custom-discussion-term", "comments term should parse");
assert(parsedOpsConfig.comments.number === 42, "comments number should parse");
assert(parsedOpsConfig.comments.description === "Comments for a custom discussion.", "comments description should parse");
assert(parsedOpsConfig.comments.backLink === "https://site.test/posts/custom/", "comments back_link should parse");
assert(parsedOpsConfig.comments.strict === false, "comments strict flag should parse");
assert(parsedOpsConfig.comments.reactionsEnabled === true, "comments reactions_enabled should parse");
assert(parsedOpsConfig.comments.emitMetadata === false, "comments emit_metadata should parse");
assert(parsedOpsConfig.comments.inputPosition === "bottom", "comments input_position should parse");
assert(parsedOpsConfig.comments.theme === "preferred_color_scheme", "comments theme should parse");
assert(parsedOpsConfig.comments.lightTheme === "light", "comments light_theme should parse");
assert(parsedOpsConfig.comments.darkTheme === "dark_dimmed", "comments dark_theme should parse");
assert(parsedOpsConfig.comments.lang === "en", "comments lang should parse");
assert(parsedOpsConfig.comments.loading === "lazy", "comments loading should parse");
assert(parsedOpsConfig.head.meta[0]?.name === "fediverse:creator", "head meta entries should parse");
assert(parsedOpsConfig.head.links[0]?.rel === "me", "head link entries should parse");
assert(parsedOpsConfig.head.scripts[0]?.defer === true, "head script entries should parse defer");
assert(parsedOpsConfig.securityTxt.contacts.length === 2, "security.txt contacts should parse");
assert(parsedOpsConfig.securityTxt.preferredLanguages === "en, pt", "security.txt preferred languages should parse");
assert(parsedOpsConfig.securityTxt.policy === "https://site.test/security-policy", "security.txt policy should parse");
assert(loaded.title === parsed.title && loaded.nav.length === parsed.nav.length, "loadPapyrusConfig should load papyrus.config.toml by default");
assert(loaded.footerLinks.length === parsed.footerLinks.length, "loadPapyrusConfig should load footer links from papyrus.config.toml");
assert(scriptConfig.title === parsed.title && scriptConfig.defaultThemeProfile === parsed.defaultThemeProfile, "script siteConfig should prefer papyrus.config.toml");
assert(baseLayout.includes("configuredSite.footerLinks"), "base layout should use configured footer links when no page override is provided");
assert(postLayout.includes("PapyrusGiscusComments"), "post layout should render configured Giscus comments");
assert(postLayout.includes("configuredSite.comments"), "post layout should read comments from site config");
assert(giscusComponent.includes("data-loading={loading}"), "Giscus component should support lazy loading config");
assert(giscusComponent.includes("data-strict={strict ? \"1\" : \"0\"}"), "Giscus component should support strict mapping config");
assert(giscusComponent.includes("data-term={term}"), "Giscus component should support specific mapping terms");
assert(giscusComponent.includes("data-number={number}"), "Giscus component should support discussion number mapping");
assert(giscusComponent.includes("data-back-link={backLink}"), "Giscus component should support explicit back links");
assert(giscusComponent.includes("emitMetadata = false"), "Giscus component should default metadata emission off");
assert(giscusComponent.includes("papyrus:theme-change"), "Giscus component should sync with Papyrus theme changes");
assert(giscusComponent.includes("setConfig: { theme }"), "Giscus component should update the iframe theme through setConfig");
for (const attr of [
  "data-papyrus-markdown-link-style",
  "data-papyrus-markdown-heading-style",
  "data-papyrus-markdown-marker-style",
  "data-papyrus-markdown-blockquote-style",
  "data-papyrus-markdown-table-style",
  "data-papyrus-markdown-table-header-style",
  "data-papyrus-markdown-inline-code-style",
]) {
  assert(baseLayout.includes(attr), `base layout missing markdown style attribute: ${attr}`);
  assert(papyrusCss.includes(attr), `papyrus CSS missing markdown style selector: ${attr}`);
}

assert(demoNav.includes("../../papyrus.config.toml?raw"), "demo nav should load the root papyrus.config.toml fixture");
assert(demoNav.includes("parsePapyrusConfigToml"), "demo nav should parse TOML through the package loader");
assert(demoSite.includes("demoPapyrusConfig.postCard"), "demo site post-card defaults should come from parsed TOML");
assert(siteConfigSource.includes("papyrus.config.toml"), "site-config script should load papyrus.config.toml");
assert(!siteConfigSource.includes("src/site.config.ts"), "site-config script should not keep TS config compatibility");

for (const phrase of [
  "papyrus.config.toml",
  "loadPapyrusConfig",
  "papyrus-template",
  "astro-papyrus/astro",
  "astro-papyrus/content",
  "astro-papyrus/config",
  "\"astro-papyrus\": \"^0.2.2\"",
  "`src/pages` tree",
  "theme, feature flags, homepage counts, and post-card defaults",
]) {
  assert(installGuide.includes(phrase), `install guide missing config phrase: ${phrase}`);
}

for (const phrase of [
	  "verification_meta",
	  "[analytics]",
	  "provider = \"plausible\"",
	  "[comments]",
	  "repo_id",
	  "category_id",
	  "Announcements",
	  "light_theme",
	  "dark_theme",
	  "giscus.json",
	  "defaultCommentOrder",
	  "back_link",
	  "include_in_dev",
  "[head]",
  "[[footer]]",
  "[security_txt]",
  "[markdown]",
  "accent-hover-underline",
  "inline_code_style",
  "no contact",
]) {
  assert(siteConfigGuide.includes(phrase), `site config guide missing phrase: ${phrase}`);
}

for (const phrase of [
  "Markdown prose styling SHOULD be configurable",
  "Footer extension points MUST stay constrained",
  "[[footer]]",
  "link_style",
  "inline_code_style",
  "per-heading-level controls",
]) {
  assert(themeSpec.includes(phrase), `theme spec missing markdown styling phrase: ${phrase}`);
}

if (failures.length) {
  console.error("Config loader verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Verified papyrus.config.toml loader, package export/bin wiring, demo config usage, and install docs.");
