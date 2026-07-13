#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const requiredTokens = [
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
];

const args = process.argv.slice(2).filter((arg) => arg !== "--");
const [command = "validate", requestedName] = args;
const themesDir = resolve(root, "src/styles/themes");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function extractProfileName(css, file) {
  const match = css.match(/data-papyrus-theme="([^"]+)"/);
  if (!match) fail(`${file} does not declare data-papyrus-theme`);
  return match[1];
}

function validateTheme(css, file, name) {
  const missing = [];
  if (!css.includes(`data-papyrus-theme="${name}"`)) missing.push(`light selector for ${name}`);
  if (!css.includes(`data-papyrus-theme="${name}"].dark`)) missing.push(`dark selector for ${name}`);
  for (const token of requiredTokens) {
    if (!css.includes(token)) missing.push(token);
  }
  return missing.map((item) => `${file}: missing ${item}`);
}

async function loadThemes() {
  const entries = await readdir(themesDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".css"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  return Promise.all(
    files.map(async (file) => {
      const css = await readFile(join(themesDir, file), "utf8");
      const name = extractProfileName(css, file);
      return { css, file, name };
    })
  );
}

const themes = await loadThemes();
const selected = requestedName ? themes.filter((theme) => theme.name === requestedName) : themes;

if (requestedName && selected.length === 0) {
  fail(`Unknown theme profile: ${requestedName}`);
}

if (command === "list") {
  for (const theme of themes) console.log(`${theme.name}\t${theme.file}`);
} else if (command === "show") {
  for (const theme of selected) console.log(`${theme.name}: ${join("src/styles/themes", theme.file)}`);
} else if (command === "validate") {
  const failures = selected.flatMap((theme) => validateTheme(theme.css, theme.file, theme.name));
  if (failures.length) {
    console.error("Theme profile validation failed:");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log(`Verified ${selected.length} theme profile${selected.length === 1 ? "" : "s"} from src/styles/themes.`);
} else {
  fail(`Usage: theme-profile.mjs [list|show|validate] [profile]`);
}
