import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { siteConfig } from "./site-config.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const tokenFallbacks = {
  "--paper-bg": "#f9f5d7",
  "--paper-fg": "#654735",
  "--paper-muted": "#928374",
  "--paper-panel": "#f2e5bc",
  "--paper-border": "#d5c4a1",
  "--paper-accent": "#d8a657",
};

export async function themeTokens(profile = process.env.PAPYRUS_THEME, mode = process.env.PAPYRUS_THEME_MODE ?? "light") {
  const config = await siteConfig();
  profile = profile ?? config.defaultThemeProfile ?? "gruvbox";
  const file = resolve(packageRoot, "src/styles/themes", `${profile}.css`);
  const css = await readFile(file, "utf8");
  const selector = mode === "dark"
    ? new RegExp(`(?:html|:root)\\[data-paper-theme="${profile}"\\]\\.dark\\s*\\{([\\s\\S]*?)\\}`, "m")
    : new RegExp(`:root\\[data-paper-theme="${profile}"\\]\\s*\\{([\\s\\S]*?)\\}`, "m");
  const block = css.match(selector)?.[1] ?? "";
  const tokens = { ...tokenFallbacks };

  for (const token of Object.keys(tokens)) {
    const value = block.match(new RegExp(`${token}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`))?.[1];
    if (value) tokens[token] = value;
  }

  return tokens;
}

export function hexToRgba(value) {
  const hex = value.replace(/^#/, "");
  const expanded = hex.length === 3
    ? [...hex].map((char) => `${char}${char}`).join("")
    : hex.padEnd(6, "f").slice(0, 6);
  return [
    Number.parseInt(expanded.slice(0, 2), 16),
    Number.parseInt(expanded.slice(2, 4), 16),
    Number.parseInt(expanded.slice(4, 6), 16),
    255,
  ];
}
