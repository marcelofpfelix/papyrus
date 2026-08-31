#!/usr/bin/env node
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright";

const dist = join(process.cwd(), "dist");
const types = { ".css": "text/css", ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml" };

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
    const relative = normalize(pathname).replace(/^[/\\]+/, "");
    let file = join(dist, relative);
    const info = await stat(file).catch(() => null);
    if (!info || info.isDirectory()) file = join(file, "index.html");
    const body = await readFile(file);
    response.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const origin = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(`${origin}/posts/markdown-feature-sample/`, { waitUntil: "networkidle" });
  await page.locator("[data-papyrus-toc-toggle]").click();
  assert(await page.locator(".papyrus-pure-toc toc-heading").count() === 1, "post TOC did not render the Pure wrapper");
  assert(await page.locator(".papyrus-pure-toc .toc-item").count() > 1, "Pure TOC did not render article headings");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.65));
  await page.waitForTimeout(250);
  const topButton = page.locator("[data-papyrus-back-to-top]");
  assert(await topButton.count() === 1 && await topButton.isVisible(), "Pure back-to-top wrapper did not become visible");
  await topButton.click();
  await page.waitForFunction(() => window.scrollY < 20, null, { timeout: 3000 });
  assert(await page.evaluate(() => window.scrollY) < 20, "Pure back-to-top wrapper did not return to the top");

  await page.goto(`${origin}/graph/`, { waitUntil: "networkidle" });
  const graph = page.locator(".papyrus-site-graph svg");
  await graph.waitFor({ state: "visible" });
  const box = await graph.boundingBox();
  assert(box && box.width > 300 && box.height > 200, `Site Graph fallback is blank or incorrectly sized: ${JSON.stringify(box)}`);
  assert(await page.locator("[data-papyrus-graph-node]").count() > 10, "Site Graph fallback rendered too few nodes");
  assert(errors.length === 0, `Upstream wrapper page errors: ${errors.join(" | ")}`);

  console.log("Verified Pure TOC/back-to-top and the Site Graph Astro 7 fallback in Chromium.");
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
