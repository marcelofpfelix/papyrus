#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { configuredBrand, siteConfig } from "./site-config.mjs";
import { themeTokens } from "./theme-colors.mjs";

const args = process.argv.slice(2);
const twinkleMode = args[0] === "--twinkle";
const config = await siteConfig();
const configured = configuredBrand(config);
const positional = twinkleMode ? args.slice(1) : args;
const [text, output = "public/logo.svg"] = twinkleMode
  ? [undefined, positional[0]]
  : positional.length === 1 && /\.svg$/i.test(positional[0])
    ? [configured.mark === "terminal" ? configured.title : undefined, positional[0]]
    : positional.length > 0
      ? positional
      : [configured.mark === "terminal" ? configured.title : undefined, "public/logo.svg"];
const target = resolve(output);
const tokens = await themeTokens();

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function terminalLogo(value) {
  const escapedText = escapeXml(value);
  const width = Math.max(96, value.length * 34);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 96" role="img" aria-label="${escapedText}">
  <style>
    text { fill: var(--papyrus-fg, ${tokens["--papyrus-fg"]}); font: 700 48px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .cursor { animation: blink 1.1s steps(1, end) infinite; }
    svg:hover text { fill: var(--papyrus-accent, currentColor); }
    @keyframes blink { 50% { opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { .cursor { animation: none; } }
  </style>
  <rect width="100%" height="100%" fill="var(--papyrus-bg, ${tokens["--papyrus-bg"]})"/>
  <text x="12" y="62">${escapedText}<tspan class="cursor">_</tspan></text>
</svg>
`;
}

function twinkleLogo() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-5 -10 110 110" role="img" aria-label="Twinkling papyrus logo">
  <style>
    path {
      animation: twinkle 2.6s ease-in-out infinite;
      fill: var(--papyrus-fg, ${tokens["--papyrus-fg"]});
      transform-box: fill-box;
      transform-origin: center;
    }
    svg:hover path { fill: var(--papyrus-accent, currentColor); }
    @keyframes twinkle {
      0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
      45% { opacity: .72; transform: scale(.92) rotate(-7deg); }
      70% { opacity: 1; transform: scale(1.08) rotate(7deg); }
    }
    @media (prefers-reduced-motion: reduce) { path { animation: none; } }
  </style>
  <rect x="-5" y="-10" width="110" height="110" fill="var(--papyrus-bg, ${tokens["--papyrus-bg"]})"/>
  <path d="m61.383 45.285 10.68-14.574c0.36719-0.50391-0.19531-1.1562-0.74609-0.86328l-16.598 8.7695-4.1328-31.031c-0.089844-0.67969-1.0703-0.67969-1.1641 0l-4.1328 31.031-14.621-8.7578c-0.52344-0.3125-1.1172 0.28125-0.80469 0.80469l8.7578 14.621-31.031 4.1328c-0.67969 0.089843-0.67969 1.0703 0 1.1641l31.031 4.1328-8.7578 14.621c-0.3125 0.52344 0.28125 1.1172 0.80469 0.80469l14.621-8.7578 4.1328 31.031c0.089844 0.67969 1.0703 0.67969 1.1641 0l4.1328-31.031 14.621 8.7578c0.52344 0.3125 1.1172-0.28125 0.80469-0.80469l-8.7578-14.621 31.031-4.1328c0.67969-0.089843 0.67969-1.0703 0-1.1641l-31.031-4.1328z"/>
</svg>
`;
}

const svg = text ? terminalLogo(text) : twinkleLogo();

await mkdir(dirname(target), { recursive: true });
await writeFile(target, svg);
console.log(`Wrote ${target}`);
