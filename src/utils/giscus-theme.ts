import catppuccinCss from "../styles/themes/catppuccin.css?raw";
import draculaCss from "../styles/themes/dracula.css?raw";
import everforestCss from "../styles/themes/everforest.css?raw";
import gruvboxCss from "../styles/themes/gruvbox.css?raw";
import kanagawaCss from "../styles/themes/kanagawa.css?raw";
import nordCss from "../styles/themes/nord.css?raw";
import pureCss from "../styles/themes/pure.css?raw";
import rosePineCss from "../styles/themes/rose-pine.css?raw";
import tokyoNightCss from "../styles/themes/tokyo-night.css?raw";
import { papyrusThemeProfiles, type PapyrusThemeProfile } from "./theme-profiles";

export const papyrusGiscusThemeModes = ["light", "dark"] as const;

export const papyrusGiscusThemeProfiles = papyrusThemeProfiles;

export type PapyrusGiscusThemeProfile = PapyrusThemeProfile;
export type PapyrusGiscusThemeMode = typeof papyrusGiscusThemeModes[number];

type PapyrusThemeTokens = {
  bg: string;
  fg: string;
  muted: string;
  panel: string;
  border: string;
  accent: string;
  codeBg: string;
  codeFg: string;
};

const papyrusThemeCss: Record<PapyrusGiscusThemeProfile, string> = {
  pure: pureCss,
  catppuccin: catppuccinCss,
  "tokyo-night": tokyoNightCss,
  kanagawa: kanagawaCss,
  "rose-pine": rosePineCss,
  everforest: everforestCss,
  dracula: draculaCss,
  gruvbox: gruvboxCss,
  nord: nordCss,
};

function isThemeProfile(value: string): value is PapyrusGiscusThemeProfile {
  return papyrusGiscusThemeProfiles.includes(value as PapyrusGiscusThemeProfile);
}

function isThemeMode(value: string): value is PapyrusGiscusThemeMode {
  return papyrusGiscusThemeModes.includes(value as PapyrusGiscusThemeMode);
}

function tokenName(name: string): keyof PapyrusThemeTokens | undefined {
  switch (name) {
    case "bg": return "bg";
    case "fg": return "fg";
    case "muted": return "muted";
    case "panel": return "panel";
    case "border": return "border";
    case "accent": return "accent";
    case "code-bg": return "codeBg";
    case "code-fg": return "codeFg";
    default: return undefined;
  }
}

function extractTokens(css: string, mode: PapyrusGiscusThemeMode): PapyrusThemeTokens {
  const darkIndex = css.search(/(?:^|\n)[^{}]*\.dark[^{}]*\{/);
  const block = mode === "dark" && darkIndex !== -1
    ? css.slice(darkIndex)
    : css.slice(0, darkIndex === -1 ? undefined : darkIndex);
  const tokens: Partial<PapyrusThemeTokens> = {};

  for (const match of block.matchAll(/--papyrus-([a-z-]+):\s*([^;]+);/g)) {
    const key = tokenName(match[1]);
    if (key) tokens[key] = match[2].trim();
  }

  const required: Array<keyof PapyrusThemeTokens> = ["bg", "fg", "muted", "panel", "border", "accent", "codeBg", "codeFg"];
  const missing = required.filter(key => !tokens[key]);
  if (missing.length > 0) {
    throw new Error(`Missing Papyrus theme tokens: ${missing.join(", ")}`);
  }

  return tokens as PapyrusThemeTokens;
}

function alpha(hex: string, opacity: number): string {
  const normalized = hex.trim();
  const match = normalized.match(/^#([0-9a-f]{6})$/i);
  if (!match) return normalized;
  const value = match[1];
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgb(${r} ${g} ${b} / ${opacity})`;
}

export function papyrusGiscusThemeCss(profile: string, mode: string): string | undefined {
  if (!isThemeProfile(profile) || !isThemeMode(mode)) return undefined;

  const tokens = extractTokens(papyrusThemeCss[profile], mode);
  const buttonText = mode === "dark" ? tokens.bg : "#ffffff";
  const danger = mode === "dark" ? "#ff7b72" : "#cf222e";
  const attention = mode === "dark" ? "#d29922" : "#9a6700";
  const success = mode === "dark" ? "#3fb950" : "#1a7f37";

  return `/*! Papyrus Giscus theme: ${profile} ${mode} */
main {
  --color-prettylights-syntax-comment: ${tokens.muted};
  --color-prettylights-syntax-constant: ${tokens.accent};
  --color-prettylights-syntax-entity: ${tokens.accent};
  --color-prettylights-syntax-storage-modifier-import: ${tokens.fg};
  --color-prettylights-syntax-entity-tag: ${success};
  --color-prettylights-syntax-keyword: ${danger};
  --color-prettylights-syntax-string: ${tokens.accent};
  --color-prettylights-syntax-variable: ${attention};
  --color-prettylights-syntax-brackethighlighter-unmatched: ${danger};
  --color-prettylights-syntax-invalid-illegal-text: ${tokens.fg};
  --color-prettylights-syntax-invalid-illegal-bg: ${alpha(danger, 0.24)};
  --color-prettylights-syntax-carriage-return-text: ${tokens.fg};
  --color-prettylights-syntax-carriage-return-bg: ${alpha(danger, 0.32)};
  --color-prettylights-syntax-string-regexp: ${success};
  --color-prettylights-syntax-markup-list: ${attention};
  --color-prettylights-syntax-markup-heading: ${tokens.accent};
  --color-prettylights-syntax-markup-italic: ${tokens.fg};
  --color-prettylights-syntax-markup-bold: ${tokens.fg};
  --color-prettylights-syntax-markup-deleted-text: ${danger};
  --color-prettylights-syntax-markup-deleted-bg: ${alpha(danger, 0.16)};
  --color-prettylights-syntax-markup-inserted-text: ${success};
  --color-prettylights-syntax-markup-inserted-bg: ${alpha(success, 0.16)};
  --color-prettylights-syntax-markup-changed-text: ${attention};
  --color-prettylights-syntax-markup-changed-bg: ${alpha(attention, 0.16)};
  --color-prettylights-syntax-markup-ignored-text: ${tokens.muted};
  --color-prettylights-syntax-markup-ignored-bg: ${alpha(tokens.accent, 0.24)};
  --color-prettylights-syntax-meta-diff-range: ${tokens.accent};
  --color-prettylights-syntax-brackethighlighter-angle: ${tokens.muted};
  --color-prettylights-syntax-sublimelinter-gutter-mark: ${tokens.border};
  --color-prettylights-syntax-constant-other-reference-link: ${tokens.accent};
  --color-btn-text: ${tokens.fg};
  --color-btn-bg: ${tokens.panel};
  --color-btn-border: ${tokens.border};
  --color-btn-shadow: 0 0 transparent;
  --color-btn-inset-shadow: 0 0 transparent;
  --color-btn-hover-bg: ${tokens.codeBg};
  --color-btn-hover-border: ${tokens.accent};
  --color-btn-active-bg: ${tokens.codeBg};
  --color-btn-active-border: ${tokens.accent};
  --color-btn-selected-bg: ${tokens.codeBg};
  --color-btn-primary-text: ${buttonText};
  --color-btn-primary-bg: ${tokens.accent};
  --color-btn-primary-border: ${tokens.accent};
  --color-btn-primary-shadow: 0 0 transparent;
  --color-btn-primary-inset-shadow: 0 0 transparent;
  --color-btn-primary-hover-bg: ${tokens.fg};
  --color-btn-primary-hover-border: ${tokens.fg};
  --color-btn-primary-selected-bg: ${tokens.accent};
  --color-btn-primary-selected-shadow: 0 0 transparent;
  --color-btn-primary-disabled-text: ${alpha(buttonText, 0.64)};
  --color-btn-primary-disabled-bg: ${alpha(tokens.accent, 0.48)};
  --color-btn-primary-disabled-border: ${alpha(tokens.accent, 0.48)};
  --color-action-list-item-default-hover-bg: ${alpha(tokens.accent, 0.12)};
  --color-segmented-control-bg: ${tokens.panel};
  --color-segmented-control-button-bg: ${tokens.bg};
  --color-segmented-control-button-selected-border: ${tokens.border};
  --color-fg-default: ${tokens.fg};
  --color-fg-muted: ${tokens.muted};
  --color-fg-subtle: ${tokens.muted};
  --color-canvas-default: ${tokens.bg};
  --color-canvas-overlay: ${tokens.panel};
  --color-canvas-inset: ${tokens.codeBg};
  --color-canvas-subtle: ${tokens.panel};
  --color-border-default: ${tokens.border};
  --color-border-muted: ${tokens.border};
  --color-neutral-muted: ${alpha(tokens.muted, 0.2)};
  --color-accent-fg: ${tokens.accent};
  --color-accent-emphasis: ${tokens.accent};
  --color-accent-muted: ${alpha(tokens.accent, 0.4)};
  --color-accent-subtle: ${alpha(tokens.accent, 0.1)};
  --color-success-fg: ${success};
  --color-attention-fg: ${attention};
  --color-attention-muted: ${alpha(attention, 0.4)};
  --color-attention-subtle: ${alpha(attention, 0.15)};
  --color-danger-fg: ${danger};
  --color-danger-muted: ${alpha(danger, 0.4)};
  --color-danger-subtle: ${alpha(danger, 0.1)};
  --color-primer-shadow-inset: 0 0 transparent;
  --color-scale-gray-1: ${tokens.panel};
  --color-scale-gray-7: ${tokens.panel};
  --color-scale-blue-1: ${alpha(tokens.accent, 0.3)};
  --color-scale-blue-8: ${alpha(tokens.accent, 0.3)};
  --color-social-reaction-bg-hover: var(--color-scale-gray-1);
  --color-social-reaction-bg-reacted-hover: var(--color-scale-blue-1);
}

main .gsc-loading-image {
  background-image: none;
}

.gsc-main,
.gsc-comment-box,
.gsc-comment-box-tabs,
.gsc-comment-box-textarea,
.gsc-comment-box-bottom,
.gsc-reactions-menu {
  background-color: ${tokens.bg};
}

.gsc-comment-box,
.gsc-comment-box-textarea,
.gsc-reactions-menu {
  border-color: ${tokens.border};
}
`;
}
