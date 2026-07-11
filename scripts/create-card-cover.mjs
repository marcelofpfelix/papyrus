#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import satori from "satori";
import { themeTokens } from "./theme-colors.mjs";

const args = process.argv.slice(2);
const input = args[0] ?? "Papyrus";
const output = args[1] ?? "public/images/card-cover.svg";
const fontPath = args[2];

if (!fontPath) {
  console.error("Usage: create-card-cover.mjs <title-or-post.md> <output.svg> <font.ttf|font.otf>");
  process.exit(1);
}

const target = resolve(output);
const tokens = await themeTokens();

async function frontmatterText(value) {
  if (!/\.(md|mdx)$/i.test(value)) return { title: value, description: "generated card cover" };

  const text = await readFile(value, "utf8");
  const title = text.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? value;
  const description = text.match(/^description:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? "generated card cover";
  return { title, description };
}

function element(type, props, ...children) {
  const flatChildren = children.flat();
  return { type, props: { ...props, children: flatChildren.length === 1 ? flatChildren[0] : flatChildren } };
}

const { title, description } = await frontmatterText(input);
const font = await readFile(resolve(fontPath));

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

let svg = await satori(
  element(
    "div",
    {
      style: {
        alignItems: "stretch",
        background: "#fafafa",
        color: "#18181b",
        display: "flex",
        flexDirection: "column",
        fontFamily: "PapyrusPure",
        height: "100%",
        justifyContent: "space-between",
        padding: "56px",
        width: "100%",
      },
    },
    element(
      "div",
      {
        style: {
          alignItems: "center",
          color: "#2563eb",
          display: "flex",
          fontSize: 40,
          fontWeight: 700,
          letterSpacing: 0,
        },
      },
      "~>"
    ),
    element(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          gap: 28,
        },
      },
      element(
        "div",
        {
          style: {
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.05,
            maxWidth: 920,
          },
        },
        title
      ),
      element(
        "div",
        {
          style: {
            color: "#52525b",
            fontSize: 32,
            lineHeight: 1.35,
            maxWidth: 900,
          },
        },
        description
      )
    ),
    element(
      "div",
      {
        style: {
          alignItems: "center",
          borderTop: "2px solid #e4e4e7",
          color: "#71717a",
          display: "flex",
          fontSize: 24,
          justifyContent: "space-between",
          paddingTop: 24,
        },
      },
      element("div", {}, "papyrus"),
      element("div", {}, "Astro blog cover")
    )
  ),
  {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: "PapyrusPure",
        data: font,
        weight: 400,
        style: "normal",
      },
    ],
  }
);

const titleLines = wrapWords(title, 30);
svg = svg
  .replace("<svg ", `<svg role="img" aria-label="${escapeXml(title)}" data-title-lines="${titleLines.length}" data-title-line-text="${escapeXml(titleLines.join(" | "))}" `)
  .replaceAll("#fafafa", `var(--papyrus-bg, ${tokens["--papyrus-bg"]})`)
  .replaceAll("#18181b", `var(--papyrus-fg, ${tokens["--papyrus-fg"]})`)
  .replaceAll("#2563eb", `var(--papyrus-accent, ${tokens["--papyrus-accent"]})`)
  .replaceAll("#52525b", `var(--papyrus-muted, ${tokens["--papyrus-muted"]})`)
  .replaceAll("#71717a", `var(--papyrus-muted, ${tokens["--papyrus-muted"]})`)
  .replaceAll("#e4e4e7", `var(--papyrus-border, ${tokens["--papyrus-border"]})`);

await mkdir(dirname(target), { recursive: true });
await writeFile(target, svg);
console.log(`Wrote ${target}`);
