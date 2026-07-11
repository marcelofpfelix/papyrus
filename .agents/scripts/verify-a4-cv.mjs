#!/usr/bin/env node
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path, { extname, join } from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const dist = path.join(root, "dist");
const outputDir = path.join(root, ".screenshots", "a4");

const checks = [
  {
    file: "src/pages/docs/cv-demo/print.astro",
    patterns: [
      /@page\s*{[\s\S]*size:\s*A4/i,
      /margin:\s*0/i,
      /paper-cv-print-shell/,
      /PaperCvA4Page/,
    ],
  },
  {
    file: "src/styles/paper.css",
    patterns: [
      /\.paper-cv-a4-page/,
      /width:\s*210mm/,
      /min-height:\s*297mm/,
      /break-inside:\s*avoid/,
      /@media\s+print/,
    ],
  },
  {
    file: "dist/docs/cv-demo/print/index.html",
    patterns: [
      /paper-cv-a4-page/,
      /Mira Lee/,
      /@page\s*{[^}]*size:\s*A4/i,
      /paper-cv-print-shell/,
    ],
  },
  {
    file: "dist/docs/cv-demo/jekyll/index.html",
    patterns: [
      /paper-jekyllcv-page/,
      /paper-jekyllcv-profile/,
      /paper-jekyllcv-section/,
      /paper-jekyllcv-footer/,
      /marcelofpfelix\/jekyllcv/,
      /Mira Lee/,
    ],
  },
];

const failures = [];

for (const check of checks) {
  const fullPath = path.join(root, check.file);
  let contents = "";

  try {
    contents = await readFile(fullPath, "utf8");
  } catch (error) {
    failures.push(`${check.file}: cannot read file`);
    continue;
  }

  check.patterns.forEach((pattern) => {
    if (!pattern.test(contents)) failures.push(`${check.file}: missing ${pattern}`);
  });
}

if (failures.length > 0) {
  console.error("A4 CV verification failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function contentType(filePath) {
  const types = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
  };

  return types[extname(filePath)] ?? "application/octet-stream";
}

async function fileForUrl(url) {
  const requestUrl = new URL(url, "http://127.0.0.1");
  const rawPath = decodeURIComponent(requestUrl.pathname);
  const candidates = rawPath.endsWith("/")
    ? [join(dist, rawPath, "index.html")]
    : [join(dist, rawPath), join(dist, rawPath, "index.html")];

  for (const candidate of candidates) {
    if (!candidate.startsWith(dist)) continue;
    if (!existsSync(candidate)) continue;
    const info = await stat(candidate);
    if (info.isFile()) return candidate;
  }

  return null;
}

async function startServer() {
  const server = createServer(async (request, response) => {
    try {
      const filePath = await fileForUrl(request.url ?? "/");
      if (!filePath) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      response.writeHead(200, { "content-type": contentType(filePath) });
      response.end(await readFile(filePath));
    } catch (error) {
      response.writeHead(500);
      response.end(String(error));
    }
  });

  await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not bind local A4 PDF server");
  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolveClose) => server.close(resolveClose)),
  };
}

function pdfMediaBox(pdf) {
  const text = pdf.toString("latin1");
  const match = text.match(/\/MediaBox\s*\[\s*0\s+0\s+([0-9.]+)\s+([0-9.]+)\s*\]/);
  if (!match) throw new Error("Generated PDF is missing a MediaBox");
  return {
    height: Number(match[2]),
    width: Number(match[1]),
  };
}

await mkdir(outputDir, { recursive: true });

const server = await startServer();
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });
  for (const route of [
    {
      fileName: "cv-demo-print.pdf",
      path: "/docs/cv-demo/print/",
      selector: ".paper-cv-a4-page",
    },
    {
      fileName: "cv-demo-jekyll.pdf",
      path: "/docs/cv-demo/jekyll/",
      selector: ".paper-jekyllcv-page",
    },
  ]) {
    await page.goto(`${server.origin}${route.path}`, { waitUntil: "networkidle" });
    await page.emulateMedia({ media: "print" });

    const pageBox = await page.locator(route.selector).first().boundingBox();
    assert(pageBox, `${route.selector} did not render before PDF generation`);

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });
    await writeFile(path.join(outputDir, route.fileName), pdf);

    const mediaBox = pdfMediaBox(pdf);
    assert(Math.abs(mediaBox.width - 595.28) < 2, `${route.fileName} width was ${mediaBox.width}pt, expected A4 width around 595.28pt`);
    assert(Math.abs(mediaBox.height - 841.89) < 2, `${route.fileName} height was ${mediaBox.height}pt, expected A4 height around 841.89pt`);
  }
} finally {
  if (browser) await browser.close();
  await server.close();
}

console.log("A4 CV verification passed with generated A4 PDF artifacts at .screenshots/a4/");
