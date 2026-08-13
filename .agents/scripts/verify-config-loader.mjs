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
const installGuide = await readFile("src/content/posts/docs/start/02-install-configure-papyrus.md", "utf8");
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

assert(packageJson.exports?.["./config"] === "./src/config/index.ts", "package export ./config missing");
assert(packageJson.exports?.["./content"] === "./src/content.ts", "package export ./content missing");
assert(packageJson.exports?.["./integration"] === "./src/integration.ts", "package export ./integration missing");
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
assert(parsed.socialLinks[0]?.href === "https://github.com/marcelofpfelix/papyrus", "parsed social link should come from TOML");
assert(parsed.features.search === true && parsed.features.sourceActions === true, "parsed feature flags should merge with defaults");
assert(parsed.postCard.tags === false, "parsed post-card tags flag should come from TOML");
assert(parsed.postCard.readTime === false, "parsed post-card read time flag should come from TOML");
assert(parsed.postCard.updatedDateOnly === true, "parsed post-card updated-date flag should come from TOML");
assert(parsed.postCard.limit === 20, "parsed post-card limit should come from TOML");
assert(parsed.profile.images.effect === "tricolor", "parsed profile image effect should come from TOML");
assert(defaults.postCard.tags === false, "default post-card tags should be hidden");
assert(defaults.postCard.readTime === false, "default post-card read time should be hidden");
assert(defaults.postCard.freshIndicators === true, "default post-card fresh indicators should be enabled");
assert(defaults.postCard.freshIndicatorText === true, "default post-card fresh indicator text should be enabled");
assert(defaults.postCard.updatedDateOnly === true, "default post-card updated date only should be enabled");
assert(defaults.postCard.limit === 20, "default post-card limit should be 20");
assert(defaults.profile.images.effect === "none", "default profile image effect should be disabled");
for (const page of ["posts", "timeline", "tags", "search", "projects", "about"]) {
  assert(defaults.pages[page]?.description === false, `default ${page} page description should be hidden`);
}
const aboutOnly = configModule.resolvePapyrusConfig({ pages: { about: { content: "About body" } } });
assert(aboutOnly.pages.about?.description === false, "page defaults should merge with about content overrides");
assert(aboutOnly.pages.about?.content === "About body", "about content override should be preserved");
assert(aboutOnly.pages.posts?.description === false, "page defaults should survive partial page overrides");
const profileOnly = configModule.resolvePapyrusConfig({ profile: { images: { effect: "tricolor" } } });
assert(profileOnly.profile.images.effect === "tricolor", "profile image effect override should be preserved");
assert(parsedProjectConfig.projects.length === 1, "parsed project config should include one TOML project");
assert(parsedProjectConfig.projects[0]?.title === "Template project", "parsed project title should come from TOML");
assert(parsedProjectConfig.projects[0]?.links?.[0]?.text === "site-owner/template", "parsed project link text should come from TOML");
assert(parsedProjectConfig.projects[0]?.pinned === true, "parsed project pinned flag should come from TOML");
assert(loaded.title === parsed.title && loaded.nav.length === parsed.nav.length, "loadPapyrusConfig should load papyrus.config.toml by default");
assert(scriptConfig.title === parsed.title && scriptConfig.defaultThemeProfile === parsed.defaultThemeProfile, "script siteConfig should prefer papyrus.config.toml");

assert(demoNav.includes("../../papyrus.config.toml?raw"), "demo nav should load the root papyrus.config.toml fixture");
assert(demoNav.includes("parsePapyrusConfigToml"), "demo nav should parse TOML through the package loader");
assert(demoSite.includes("demoPapyrusConfig.postCard"), "demo site post-card defaults should come from parsed TOML");
assert(siteConfigSource.includes("papyrus.config.toml"), "site-config script should load papyrus.config.toml");
assert(!siteConfigSource.includes("src/site.config.ts"), "site-config script should not keep TS config compatibility");

for (const phrase of [
  "papyrus.config.toml",
  "loadPapyrusConfig",
  "papyrus-template",
  "astro-theme-papyrus/integration",
  "astro-theme-papyrus/content",
  "astro-theme-papyrus/config",
  "\"astro-theme-papyrus\": \"^0.2.1\"",
  "`src/pages` tree",
  "theme, feature flags, homepage counts, and post-card defaults",
]) {
  assert(installGuide.includes(phrase), `install guide missing config phrase: ${phrase}`);
}

if (failures.length) {
  console.error("Config loader verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Verified papyrus.config.toml loader, package export/bin wiring, demo config usage, and install docs.");
