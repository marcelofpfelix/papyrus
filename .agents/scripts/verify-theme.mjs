#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const provider = await readFile("src/components/PaperThemeProvider.astro", "utf8");
const paperCss = await readFile("src/styles/paper.css", "utf8");
const pureTheme = await readFile("src/styles/themes/pure.css", "utf8");
const catppuccinTheme = await readFile("src/styles/themes/catppuccin.css", "utf8");
const footer = await readFile("src/components/PaperFooter.astro", "utf8");
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
  assert(css.includes(`data-paper-theme="${name}"`), `${name} light selector missing`);
  assert(css.includes(`data-paper-theme="${name}"].dark`), `${name} dark selector missing`);
}

for (const [profile, file] of themeProfiles) {
  assert(provider.includes(`"${profile}"`), `theme provider missing ${profile} profile`);
  assert(footer.includes(`data-paper-theme-profile-value="${profile}"`), `footer missing ${profile} profile control`);
  assert(packageJson.exports?.[`./themes/${file}`] === `./src/styles/themes/${file}`, `package export missing ${file}`);
  assert(paperCss.includes(`@import "./themes/${file}"`), `paper.css missing ${file} import`);
}

for (const font of ["theme", "readable", "code"]) {
  assert(provider.includes(`"${font}"`), `theme provider missing ${font} font profile`);
}
assert(footer.includes("data-paper-font-profile-toggle"), "footer missing click-to-cycle font profile control");
assert(provider.includes("setFontProfile(undefined, true)"), "font profile toggle does not cycle on click");

assert(provider.includes('defaultThemeProfile = "gruvbox"'), "default theme profile is not gruvbox");
assert(provider.includes('defaultFontProfile = "readable"'), "default font profile is not readable");
assert(provider.includes("localStorage.getItem(PAPER_PROFILE_STORAGE_KEY) ?? PAPER_INLINE_DEFAULT_THEME_PROFILE"), "early stored theme profile does not use configurable default");
assert(provider.includes("localStorage.getItem(PAPER_FONT_STORAGE_KEY) ?? PAPER_INLINE_DEFAULT_FONT_PROFILE"), "early stored font profile does not use configurable default");
assert(provider.includes('localStorage.getItem("paper-theme") ?? PAPER_RUNTIME_DEFAULT_THEME_PROFILE'), "runtime stored theme profile does not use configurable default");
assert(provider.includes('localStorage.getItem("paper-font") ?? PAPER_RUNTIME_DEFAULT_FONT_PROFILE'), "runtime stored font profile does not use configurable default");
assert(provider.includes('paperPureApplyTheme(paperPureStoredMode() ?? "system", paperPureStoredProfile())'), "initial theme mode does not default to system");
assert(provider.includes('const themes = ["system", "dark", "light"]'), "mode cycle does not include system/light/dark");
assert(!/dyslexic|OpenDyslexic/i.test(`${provider}\n${paperCss}\n${footer}`), "dyslexic font option should not be present");
assert(packageJson.bin?.["papyrus-theme"] === "./scripts/theme-profile.mjs", "papyrus-theme bin is missing");
assert(packageJson.scripts?.theme === "node scripts/theme-profile.mjs", "theme script is missing");
assert(!/#[0-9a-f]{3,8}\b/i.test(themeScript), "theme-profile script must not hardcode color values");
assert(pureThemeProvider.includes("theme === 'dark' ? '#0B0B10' : '#FCFCFD'"), "Pure ThemeProvider page colors changed");
assert(pureThemeUtils.includes("targetTheme === 'dark' ? '#0B0B10' : '#FCFCFD'"), "Pure theme utility page colors changed");

for (const [profile] of themeProfiles) {
  const css = themeCssByProfile.get(profile);
  requireThemePair(css, profile);
  for (const token of [
    "--paper-bg",
    "--paper-fg",
    "--paper-muted",
    "--paper-panel",
    "--paper-border",
    "--paper-accent",
    "--paper-code-bg",
    "--paper-code-fg",
    "--paper-theme-color",
    "--paper-font-sans",
    "--paper-font-mono",
  ]) {
    requireToken(css, token);
  }
}

assert(catppuccinTheme.includes("--paper-accent: #7287fd"), "Catppuccin Latte accent is not lavender");
assert(catppuccinTheme.includes("--paper-accent: #b4befe"), "Catppuccin Mocha accent is not lavender");
assert(pureTheme.includes("--paper-bg: #fcfcfd"), "Pure light background should match Pure's #FCFCFD baseline");
assert(pureTheme.includes("--paper-theme-color: #fcfcfd"), "Pure light theme-color should match Pure's #FCFCFD baseline");
assert(pureTheme.includes("--paper-bg: #0b0b10"), "Pure dark background should match Pure's #0B0B10 baseline");
assert(pureTheme.includes("--paper-theme-color: #0b0b10"), "Pure dark theme-color should match Pure's #0B0B10 baseline");
assert(paperCss.includes(':root[data-paper-font="code"]'), "code font profile selector missing");
assert(paperCss.includes("--paper-font-sans: \"JetBrains Mono\""), "code font profile is not monospace-first");
assert(paperCss.includes("--paper-root-font-size: 94%"), "code font profile should visually scale mono UI text down");
assert(paperCss.includes("--paper-code-font-compensation: 1.0638298"), "code font profile should compensate Shiki code block size");
assert(paperCss.includes(':root[data-paper-font="readable"]'), "readable font profile selector missing");
assert(paperCss.includes('"Atkinson Hyperlegible"'), "readable font profile does not include Atkinson Hyperlegible");
assert(paperCss.includes('"Fira Code"'), "font profiles do not include Fira Code");

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

console.log("Verified theme defaults, Pure background baseline, theme token pairs, package exports, Catppuccin lavender accents, font profiles, and theme-profile script.");
