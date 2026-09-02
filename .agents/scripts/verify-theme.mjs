#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const provider = await readFile("src/components/PapyrusThemeProvider.astro", "utf8");
const bootstrap = await readFile("src/components/PapyrusThemeBootstrap.astro", "utf8");
const baseLayout = await readFile("src/layouts/PapyrusBaseLayout.astro", "utf8");
const papyrusCss = await readFile("src/styles/papyrus.css", "utf8");
const pureTheme = await readFile("src/styles/themes/pure.css", "utf8");
const catppuccinTheme = await readFile("src/styles/themes/catppuccin.css", "utf8");
const footer = await readFile("src/components/PapyrusFooter.astro", "utf8");
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const themeScript = await readFile("scripts/theme-profile.mjs", "utf8");
const pureThemeProvider = await readFile("node_modules/astro-pure/components/basic/ThemeProvider.astro", "utf8");
const pureThemeUtils = await readFile("node_modules/astro-pure/utils/theme.ts", "utf8");
const themeProfiles = [
  ["pure", "pure.css"],
  ["catppuccin", "catppuccin.css"],
  ["tokyo-night", "tokyo-night.css"],
  ["kanagawa", "kanagawa.css"],
  ["rose-pine", "rose-pine.css"],
  ["everforest", "everforest.css"],
  ["dracula", "dracula.css"],
  ["gruvbox", "gruvbox.css"],
  ["nord", "nord.css"],
];
const themeCssByProfile = new Map(await Promise.all(themeProfiles.map(async ([profile, file]) => [
  profile,
  await readFile(`src/styles/themes/${file}`, "utf8"),
])));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function requireToken(css, token) {
  assert(css.includes(token), `missing token ${token}`);
}

function requireThemePair(css, name) {
  assert(css.includes(`data-papyrus-theme="${name}"`), `${name} light selector missing`);
  assert(css.includes(`data-papyrus-theme="${name}"].dark`), `${name} dark selector missing`);
}

for (const [profile, file] of themeProfiles) {
  assert(provider.includes(`"${profile}"`), `theme provider missing ${profile} profile`);
  assert(footer.includes(`data-papyrus-theme-profile-value="${profile}"`), `footer missing ${profile} profile control`);
  assert(packageJson.exports?.[`./themes/${file}`] === `./src/styles/themes/${file}`, `package export missing ${file}`);
  assert(papyrusCss.includes(`@import "./themes/${file}"`), `papyrus.css missing ${file} import`);
}

for (const font of ["theme", "readable", "code"]) {
  assert(provider.includes(`"${font}"`), `theme provider missing ${font} font profile`);
}
assert(footer.includes("data-papyrus-font-profile-toggle"), "footer missing click-to-cycle font profile control");
assert(provider.includes("setFontProfile(undefined, true)"), "font profile toggle does not cycle on click");

assert(provider.includes('defaultThemeProfile = "gruvbox"'), "default theme profile is not gruvbox");
assert(provider.includes('defaultFontProfile = "readable"'), "default font profile is not readable");
assert(bootstrap.includes('read("papyrus-theme")') && bootstrap.includes(": defaultTheme"), "early stored theme profile does not use configurable default");
assert(bootstrap.includes('read("papyrus-font")') && bootstrap.includes(": defaultFont"), "early stored font profile does not use configurable default");
assert(provider.includes('readThemeStorage("papyrus-theme") ?? PAPYRUS_RUNTIME_DEFAULT_THEME_PROFILE'), "runtime stored theme profile does not use configurable default");
assert(provider.includes('readThemeStorage("papyrus-font") ?? PAPYRUS_RUNTIME_DEFAULT_FONT_PROFILE'), "runtime stored font profile does not use configurable default");
assert(bootstrap.includes('read("papyrus-mode") ?? read("theme") ?? "system"'), "initial theme mode does not default to system");
assert(bootstrap.includes("try {\n      return localStorage.getItem(key);"), "theme bootstrap does not tolerate inaccessible storage");
assert(baseLayout.includes("data-papyrus-theme={defaultThemeProfile}"), "initial HTML does not declare the configured theme profile");
assert(baseLayout.includes("data-papyrus-font={defaultFontProfile}"), "initial HTML does not declare the configured font profile");
assert(baseLayout.indexOf('<meta charset="utf-8"') < baseLayout.indexOf("<PapyrusThemeBootstrap"), "charset must precede the theme bootstrap");
assert(baseLayout.indexOf("<PapyrusThemeBootstrap") < baseLayout.indexOf('<meta name="viewport"'), "theme bootstrap must run before render-affecting head content");
assert(baseLayout.indexOf("<PapyrusThemeProvider") > baseLayout.indexOf("<title>"), "full theme control runtime should remain outside the critical bootstrap path");
assert(bootstrap.length < 2400, `theme bootstrap is too large (${bootstrap.length} bytes)`);
assert(provider.includes('const themes = ["system", "dark", "light"]'), "mode cycle does not include system/light/dark");
assert(!/dyslexic|OpenDyslexic/i.test(`${provider}\n${papyrusCss}\n${footer}`), "dyslexic font option should not be present");
assert(packageJson.bin?.["papyrus-theme"] === "scripts/theme-profile.mjs", "papyrus-theme bin is missing");
assert(packageJson.scripts?.theme === "node scripts/theme-profile.mjs", "theme script is missing");
assert(!/#[0-9a-f]{3,8}\b/i.test(themeScript), "theme-profile script must not hardcode color values");
assert(pureThemeProvider.includes("theme === 'dark' ? '#0B0B10' : '#FCFCFD'"), "Pure ThemeProvider page colors changed");
assert(pureThemeUtils.includes("targetTheme === 'dark' ? '#0B0B10' : '#FCFCFD'"), "Pure theme utility page colors changed");

for (const [profile] of themeProfiles) {
  const css = themeCssByProfile.get(profile);
  requireThemePair(css, profile);
  for (const token of [
    "--papyrus-bg",
    "--papyrus-fg",
    "--papyrus-muted",
    "--papyrus-panel",
    "--papyrus-border",
    "--papyrus-accent",
    "--papyrus-code-bg",
    "--papyrus-code-fg",
    "--papyrus-theme-color",
    "--papyrus-font-sans",
    "--papyrus-font-mono",
  ]) {
    requireToken(css, token);
  }
}

assert(catppuccinTheme.includes("--papyrus-accent: #8839ef"), "Catppuccin Latte accent is not mauve");
assert(catppuccinTheme.includes("--papyrus-accent: #b4befe"), "Catppuccin Mocha accent is not lavender");
assert(pureTheme.includes("--papyrus-bg: #fcfcfd"), "Pure light background should match Pure's #FCFCFD baseline");
assert(pureTheme.includes("--papyrus-theme-color: #fcfcfd"), "Pure light theme-color should match Pure's #FCFCFD baseline");
assert(pureTheme.includes("--papyrus-bg: #0b0b10"), "Pure dark background should match Pure's #0B0B10 baseline");
assert(pureTheme.includes("--papyrus-theme-color: #0b0b10"), "Pure dark theme-color should match Pure's #0B0B10 baseline");
assert(papyrusCss.includes(':root[data-papyrus-font="code"]'), "code font profile selector missing");
assert(papyrusCss.includes("--papyrus-font-sans: \"JetBrains Mono\""), "code font profile is not monospace-first");
assert(papyrusCss.includes("--papyrus-root-font-size: 94%"), "code font profile should visually scale mono UI text down");
assert(papyrusCss.includes("--papyrus-code-font-compensation: 1.0638298"), "code font profile should compensate Shiki code block size");
assert(papyrusCss.includes(':root[data-papyrus-font="readable"]'), "readable font profile selector missing");
assert(papyrusCss.includes('"Atkinson Hyperlegible"'), "readable font profile does not include Atkinson Hyperlegible");
assert(papyrusCss.includes('"Fira Code"'), "font profiles do not include Fira Code");

const themeValidation = spawnSync(process.execPath, ["scripts/theme-profile.mjs", "validate"], {
  encoding: "utf8",
});

assert(themeValidation.status === 0, `theme-profile validate failed: ${themeValidation.stderr || themeValidation.stdout}`);

const themeList = spawnSync(process.execPath, ["scripts/theme-profile.mjs", "list"], {
  encoding: "utf8",
});

assert(themeList.status === 0, `theme-profile list failed: ${themeList.stderr || themeList.stdout}`);
for (const [profile, file] of themeProfiles) {
  assert(themeList.stdout.includes(`${profile}\t${file}`), `theme-profile list missing ${profile}`);
}

console.log("Verified pre-paint theme bootstrap, theme defaults/token pairs, package exports, font profiles, and theme-profile script.");
