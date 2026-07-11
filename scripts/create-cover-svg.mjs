#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { configuredBrand, siteConfig } from "./site-config.mjs";
import { themeTokens } from "./theme-colors.mjs";

const [input = "Papyrus", output = "public/images/cover.svg", subtitle = "generated cover"] = process.argv.slice(2);
const target = resolve(output);
const config = await siteConfig();
const tokens = await themeTokens();
const configured = configuredBrand(config);
const brandTitle = process.env.PAPYRUS_COVER_BRAND ?? process.env.PAPYRUS_SITE_TITLE ?? configured.title;
const brandMark = process.env.PAPYRUS_COVER_MARK ?? configured.mark;

async function textFromInput(value) {
  if (!/\.(md|mdx)$/i.test(value)) return { title: value, description: subtitle };

  const text = await readFile(value, "utf8");
  const title = text.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? value;
  const description = text.match(/^description:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? subtitle;
  return { title, description };
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrapWords(value, max = 28) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }

  if (line) lines.push(line);
  return lines.slice(0, 3);
}

const { title, description } = await textFromInput(input);
const titleLines = wrapWords(title, 26);
const descriptionLines = wrapWords(description, 58);
const titleSvg = titleLines
  .map((line, index) => `<text x="72" y="${190 + index * 70}" class="title">${escapeXml(line)}</text>`)
  .join("\n  ");
const descriptionSvg = descriptionLines
  .map((line, index) => `<text x="72" y="${470 + index * 38}" class="desc">${escapeXml(line)}</text>`)
  .join("\n  ");

function brandSvg() {
  if (brandMark === "terminal") {
    return `<text x="72" y="120" class="brand">${escapeXml(brandTitle)}</text>`;
  }

  return `<g class="brand-mark" transform="translate(72 70) scale(.52)">
    <path d="m61.383 45.285 10.68-14.574c0.36719-0.50391-0.19531-1.1562-0.74609-0.86328l-16.598 8.7695-4.1328-31.031c-0.089844-0.67969-1.0703-0.67969-1.1641 0l-4.1328 31.031-14.621-8.7578c-0.52344-0.3125-1.1172 0.28125-0.80469 0.80469l8.7578 14.621-31.031 4.1328c-0.67969 0.089843-0.67969 1.0703 0 1.1641l31.031 4.1328-8.7578 14.621c-0.3125 0.52344 0.28125 1.1172 0.80469 0.80469l14.621-8.7578 4.1328 31.031c0.089844 0.67969 1.0703 0.67969 1.1641 0l4.1328-31.031 14.621 8.7578c0.52344 0.3125 1.1172-0.28125 0.80469-0.80469l-8.7578-14.621 31.031-4.1328c0.67969-0.089843 0.67969-1.0703 0-1.1641l-31.031-4.1328z"/>
  </g>
  <text x="136" y="120" class="brand">${escapeXml(brandTitle)}</text>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(title)}">
  <style>
    rect.bg { fill: var(--paper-bg, ${tokens["--paper-bg"]}); }
    text { fill: var(--paper-fg, ${tokens["--paper-fg"]}); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .brand { fill: var(--paper-accent, ${tokens["--paper-accent"]}); font-size: 38px; font-weight: 700; }
    .brand-mark { fill: var(--paper-accent, ${tokens["--paper-accent"]}); }
    .title { font-size: 62px; font-weight: 800; letter-spacing: 0; }
    .desc { fill: var(--paper-muted, ${tokens["--paper-muted"]}); font-size: 30px; }
  </style>
  <rect class="bg" width="1200" height="630" rx="0"/>
  ${brandSvg()}
  ${titleSvg}
  ${descriptionSvg}
</svg>
`;

await mkdir(dirname(target), { recursive: true });
await writeFile(target, svg);
console.log(`Wrote ${target}`);
