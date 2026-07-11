#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { siteConfig } from "../../scripts/site-config.mjs";

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const configSource = await readFile("src/config/index.ts", "utf8");
const configToml = await readFile("paper.config.toml", "utf8");
const installGuide = await readFile("src/content/posts/install-configure-papyrus.md", "utf8");
const demoNav = await readFile("src/data/demo-nav.ts", "utf8");
const demoSite = await readFile("src/data/demo-site.ts", "utf8");
const siteConfigSource = await readFile("scripts/site-config.mjs", "utf8");

const configModule = await import("../../src/config/index.ts");
const parsed = configModule.parsePaperConfigToml(configToml);
const loaded = await configModule.loadPaperConfig();
const scriptConfig = await siteConfig();
const parsedProjectConfig = configModule.parsePaperConfigToml(`
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

for (const symbol of ["PaperSiteConfig", "definePaperConfig", "resolvePaperConfig", "parsePaperConfigToml", "loadPaperConfig"]) {
  assert(configSource.includes(symbol), `config loader missing ${symbol}`);
}

assert(parsed.title === "papyrus", "parsed title should come from paper.config.toml");
assert(parsed.site === "https://papyrus.marcelofelix.com", "parsed site URL should come from paper.config.toml");
assert(parsed.lang === "en", "parsed language should come from paper.config.toml");
assert(parsed.timezone === "Europe/Lisbon", "parsed timezone should come from paper.config.toml");
assert(parsed.defaultThemeProfile === "gruvbox", "parsed theme profile should come from paper.config.toml");
assert(parsed.defaultFontProfile === "readable", "parsed font profile should come from paper.config.toml");
assert(parsed.nav.length === 5 && parsed.nav[0].href === "/posts/", "parsed nav should contain five TOML links");
assert(parsed.socialLinks[0]?.href === "https://github.com/marcelofpfelix/papyrus", "parsed social link should come from TOML");
assert(parsed.features.search === true && parsed.features.sourceActions === true, "parsed feature flags should merge with defaults");
assert(parsed.postCard.tags === false, "parsed post-card tags flag should come from TOML");
assert(parsed.postCard.readTime === false, "parsed post-card read time flag should come from TOML");
assert(parsed.postCard.updatedDateOnly === true, "parsed post-card updated-date flag should come from TOML");
assert(parsed.postCard.limit === 20, "parsed post-card limit should come from TOML");
assert(parsedProjectConfig.projects.length === 1, "parsed project config should include one TOML project");
assert(parsedProjectConfig.projects[0]?.title === "Template project", "parsed project title should come from TOML");
assert(parsedProjectConfig.projects[0]?.links?.[0]?.text === "site-owner/template", "parsed project link text should come from TOML");
assert(parsedProjectConfig.projects[0]?.pinned === true, "parsed project pinned flag should come from TOML");
assert(loaded.title === parsed.title && loaded.nav.length === parsed.nav.length, "loadPaperConfig should load paper.config.toml by default");
assert(scriptConfig.title === parsed.title && scriptConfig.defaultThemeProfile === parsed.defaultThemeProfile, "script siteConfig should prefer paper.config.toml");

assert(demoNav.includes("../../paper.config.toml?raw"), "demo nav should load the root paper.config.toml fixture");
assert(demoNav.includes("parsePaperConfigToml"), "demo nav should parse TOML through the package loader");
assert(demoSite.includes("demoPaperConfig.postCard"), "demo site post-card defaults should come from parsed TOML");
assert(siteConfigSource.includes("paper.config.toml") && siteConfigSource.includes("Fall back to the legacy TS config"), "site-config script should prefer TOML and keep TS fallback");

for (const phrase of [
  "paper.config.toml",
  "loadPaperConfig",
  "papyrus-template",
  "astro-theme-papyrus/integration",
  "astro-theme-papyrus/content",
  "astro-theme-papyrus/config",
  "\"astro-theme-papyrus\": \"^0.1.0\"",
  "`src/pages` tree",
  "Everforest theme profile",
]) {
  assert(installGuide.includes(phrase), `install guide missing config phrase: ${phrase}`);
}

if (failures.length) {
  console.error("Config loader verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Verified paper.config.toml loader, package export/bin wiring, demo config usage, script fallback, and install docs.");
