#!/usr/bin/env node
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { mkdir, readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";

const root = resolve(new URL("../..", import.meta.url).pathname);
const dist = join(root, "dist");
const outputDir = join(root, ".screenshots", "responsive");

const routes = [
  { name: "home", path: "/", required: [".papyrus-header", ".papyrus-footer", ".papyrus-post-list"] },
  { name: "posts", path: "/posts/", required: [".papyrus-header", ".papyrus-footer", ".papyrus-post-list"] },
  { name: "code-demo", path: "/collections/docs/code-demo/", required: [".papyrus-header", ".papyrus-footer", ".astro-code"] },
  { name: "cv-profile", path: "/posts/cv-profile/", required: [".papyrus-header", ".papyrus-footer", ".papyrus-link-preview"] },
  { name: "cv-demo", path: "/docs/cv-demo/", required: [".papyrus-header", ".papyrus-footer", ".papyrus-cv-controls", ".papyrus-cv"] },
];

const viewports = [
  { name: "desktop", width: 1440, height: 1000, touch: false },
  { name: "tablet", width: 768, height: 1024, touch: true },
  { name: "mobile", width: 390, height: 844, touch: true },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function contentType(filePath) {
  const types = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".md": "text/markdown; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".mmd": "text/plain; charset=utf-8",
    ".puml": "text/plain; charset=utf-8",
    ".svg": "image/svg+xml",
    ".txt": "text/plain; charset=utf-8",
    ".webmanifest": "application/manifest+json; charset=utf-8",
    ".xml": "application/xml; charset=utf-8",
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
  if (!address || typeof address === "string") throw new Error("Could not bind local screenshot server");
  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolveClose) => server.close(resolveClose)),
  };
}

function screenshotName(routeName, viewportName) {
  return `${routeName}-${viewportName}.png`;
}

async function pageState(page, requiredSelectors) {
  return page.evaluate((selectors) => {
    const main = document.querySelector("main");
    const body = document.body;
    const html = document.documentElement;
    const controls = Array.from(document.querySelectorAll([
      ".papyrus-header a",
      ".papyrus-header button",
      ".papyrus-header summary",
      ".papyrus-footer button",
      ".papyrus-footer summary",
      ".papyrus-mobile-nav a",
      ".papyrus-post-tools button",
      ".papyrus-share-button",
      ".papyrus-cv-controls button",
    ].join(", ")));
    const smallTargets = controls
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const label = element.getAttribute("aria-label")
          ?? element.getAttribute("title")
          ?? element.textContent?.replace(/\s+/g, " ").trim()
          ?? element.tagName.toLowerCase();
        return { label, width: rect.width, height: rect.height, visible: rect.width > 0 && rect.height > 0 };
      })
      .filter((target) => target.visible && (target.width < 40 || target.height < 40));

    return {
      bodyTextLength: body.innerText.trim().length,
      headerVisible: Boolean(document.querySelector(".papyrus-header")?.getBoundingClientRect().height),
      footerVisible: Boolean(document.querySelector(".papyrus-footer")?.getBoundingClientRect().height),
      mainVisible: Boolean(main?.getBoundingClientRect().height),
      missingSelectors: selectors.filter((selector) => !document.querySelector(selector)),
      overflowX: Math.max(body.scrollWidth, html.scrollWidth) - window.innerWidth,
      smallTargets: smallTargets.slice(0, 8),
    };
  }, requiredSelectors);
}

assert(existsSync(join(dist, "index.html")), "dist/index.html is missing. Run `make build` first.");
await mkdir(outputDir, { recursive: true });

const server = await startServer();
const browser = await chromium.launch();
const written = [];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      deviceScaleFactor: 1,
      hasTouch: viewport.touch,
      isMobile: viewport.width < 500,
      viewport: { width: viewport.width, height: viewport.height },
    });
    const page = await context.newPage();

    for (const route of routes) {
      const url = `${server.origin}${route.path}`;
      await page.goto(url, { waitUntil: "networkidle" });
      const state = await pageState(page, route.required);

      assert(state.bodyTextLength > 100, `${route.name} ${viewport.name} rendered too little text`);
      assert(state.headerVisible, `${route.name} ${viewport.name} missing visible header`);
      assert(state.footerVisible, `${route.name} ${viewport.name} missing visible footer`);
      assert(state.mainVisible, `${route.name} ${viewport.name} missing visible main content`);
      assert(state.missingSelectors.length === 0, `${route.name} ${viewport.name} missing selectors: ${state.missingSelectors.join(", ")}`);
      assert(state.overflowX <= 2, `${route.name} ${viewport.name} has horizontal overflow ${state.overflowX}px`);
      if (viewport.touch) {
        assert(state.smallTargets.length === 0, `${route.name} ${viewport.name} has small touch targets: ${JSON.stringify(state.smallTargets)}`);
      }

      const file = join(outputDir, screenshotName(route.name, viewport.name));
      await page.screenshot({ path: file, fullPage: true });
      written.push(file.replace(`${root}/`, ""));
    }

    await context.close();
  }
} finally {
  await browser.close();
  await server.close();
}

console.log(`Wrote ${written.length} responsive screenshots to ${outputDir.replace(`${root}/`, "")}`);
for (const file of written) console.log(`Screenshot: ${file}`);
