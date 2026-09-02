#!/usr/bin/env node
import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { mkdir, readFile, readdir } from "node:fs/promises";
import { dirname, extname, join, normalize, relative, resolve } from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const root = resolve(new URL("../..", import.meta.url).pathname);
const dist = join(root, "dist");
const reportDir = join(root, ".lighthouse");
const port = Number(process.env.LIGHTHOUSE_PORT ?? 4177);
const minScore = Number(process.env.LIGHTHOUSE_MIN_SCORE ?? 100);
const concurrency = Math.min(8, Math.max(1, Number.parseInt(process.env.LIGHTHOUSE_CONCURRENCY ?? "4", 10) || 4));
const origin = `http://127.0.0.1:${port}`;
const systemChromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const chromePath = process.env.CHROME_PATH
  ?? (existsSync(systemChromePath) ? systemChromePath : chromium.executablePath());
const excludedRoutePattern = process.env.LIGHTHOUSE_EXCLUDE_PATTERN
  ? new RegExp(process.env.LIGHTHOUSE_EXCLUDE_PATTERN, "i")
  : undefined;

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function staticPath(requestUrl) {
  const url = new URL(requestUrl ?? "/", origin);
  let pathname = url.pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return { filePath: join(dist, "404.html"), status: 404 };
  }
  const normalized = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(dist, normalized);
  if (!filePath.startsWith(dist)) return { filePath: join(dist, "404.html"), status: 404 };
  if (existsSync(filePath) && !filePath.endsWith("/")) return { filePath, status: 200 };
  const indexPath = join(filePath, "index.html");
  return existsSync(indexPath)
    ? { filePath: indexPath, status: 200 }
    : { filePath: join(dist, "404.html"), status: 404 };
}

async function startServer() {
  const server = createServer((request, response) => {
    const { filePath, status } = staticPath(request.url);
    if (!existsSync(filePath)) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(status, {
      "cache-control": "no-store",
      "content-type": contentTypes[extname(filePath)] ?? "application/octet-stream",
    });
    createReadStream(filePath).pipe(response);
  });

  await new Promise((resolveListen) => server.listen(port, "127.0.0.1", resolveListen));
  return server;
}

function routeReportPath(route) {
  const slug = route === "/"
    ? "home"
    : route.replace(/^\/|\/$/g, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return join(reportDir, `papyrus-${slug}.json`);
}

async function collectRoutes() {
  if (process.env.LIGHTHOUSE_ROUTES) {
    return process.env.LIGHTHOUSE_ROUTES
      .split(",")
      .map(route => route.trim())
      .filter(Boolean)
      .map(route => route.startsWith("/") ? route : `/${route}`);
  }

  const routes = [];
  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(path);
        continue;
      }
      if (entry.name !== "index.html") continue;
      const html = await readFile(path, "utf8");
      if (/<meta\b(?=[^>]*\bname=["']robots["'])(?=[^>]*\bcontent=["'][^"']*\bnoindex\b)[^>]*>/i.test(html)) continue;

      const directoryRoute = relative(dist, dirname(path)).split("/").filter(Boolean).join("/");
      const route = directoryRoute ? `/${directoryRoute}/` : "/";
      if (!excludedRoutePattern?.test(route)) routes.push(route);
    }
  }

  await walk(dist);
  if (existsSync(join(dist, "404.html")) && !excludedRoutePattern?.test("/404.html")) {
    routes.push("/404.html");
  }
  return routes.sort((a, b) => a.localeCompare(b));
}

function runLighthouse(route, reportPath) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(
      "pnpm",
      [
        "exec",
        "lighthouse",
        `${origin}${route}`,
        "--quiet",
        "--output=json",
        `--output-path=${reportPath}`,
        "--throttling-method=provided",
        "--chrome-flags=--headless=new --no-sandbox --disable-gpu",
      ],
      {
        cwd: root,
        env: {
          ...process.env,
          CHROME_PATH: chromePath,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", rejectRun);
    child.on("close", (code) => {
      if (code === 0) resolveRun({ stdout, stderr });
      else rejectRun(new Error(stderr || stdout || `lighthouse exited with ${code}`));
    });
  });
}

function formatScore(score) {
  return Math.round((score ?? 0) * 100);
}

function chunkDiagnosis(report) {
  const scriptBytes = report.audits?.["script-treemap-data"]?.details?.nodes
    ?.filter((node) => node.resourceType === "script")
    ?.reduce((total, node) => total + (node.transferSize ?? 0), 0) ?? 0;
  const unusedJs = report.audits?.["unused-javascript"]?.numericValue ?? 0;
  const totalBlockingTime = report.audits?.["total-blocking-time"]?.numericValue ?? 0;
  const diagnostics = [];

  if (scriptBytes > 500_000) diagnostics.push(`JavaScript transfer is ${Math.round(scriptBytes / 1024)} KiB; this aligns with the current Vite large-chunk warning.`);
  if (unusedJs > 100_000) diagnostics.push(`Unused JavaScript estimate is ${Math.round(unusedJs / 1024)} KiB.`);
  if (totalBlockingTime > 200) diagnostics.push(`Total blocking time is ${Math.round(totalBlockingTime)} ms.`);
  if (!diagnostics.length) diagnostics.push("No large JavaScript or blocking-time issue was flagged in the Lighthouse report.");

  return diagnostics;
}

function lowerScoringAudits(report) {
  return Object.entries(report.audits)
    .filter(([, audit]) => typeof audit.score === "number" && audit.score < 1 && audit.scoreDisplayMode !== "notApplicable")
    .map(([id, audit]) => ({
      id,
      score: audit.score,
      title: audit.title,
      displayValue: audit.displayValue ?? "",
    }))
    .slice(0, 12);
}

assert(existsSync(join(dist, "index.html")), "dist/index.html is missing. Run `make build` first.");
await mkdir(reportDir, { recursive: true });

const routes = await collectRoutes();
assert(routes.length > 0, "No Lighthouse routes found.");
console.log(`Lighthouse Chrome: ${chromePath}`);
console.log(`Lighthouse routes: ${routes.join(", ")}`);
console.log(`Lighthouse concurrency: ${concurrency}`);

const server = await startServer();
try {
  async function verifyRoute(route) {
    const reportPath = routeReportPath(route);
    await runLighthouse(route, reportPath);
    const report = JSON.parse(await readFile(reportPath, "utf8"));
    const scores = Object.fromEntries(
      Object.entries(report.categories).map(([key, category]) => [key, formatScore(category.score)]),
    );

    console.log(`Lighthouse report (${route}): ${reportPath}`);
    console.log(`Scores (${route}): performance ${scores.performance}, accessibility ${scores.accessibility}, best-practices ${scores["best-practices"]}, seo ${scores.seo}`);
    for (const line of chunkDiagnosis(report)) console.log(`Diagnosis (${route}): ${line}`);
    for (const audit of lowerScoringAudits(report)) {
      console.log(`Audit below 100 (${route}): ${audit.id} (${audit.title})${audit.displayValue ? ` - ${audit.displayValue}` : ""}`);
    }

    for (const [category, score] of Object.entries(scores)) {
      assert(score >= minScore, `${route} ${category} score ${score} is below LIGHTHOUSE_MIN_SCORE=${minScore}`);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, routes.length) }, async (_, worker) => {
    for (let index = worker; index < routes.length; index += concurrency) {
      await verifyRoute(routes[index]);
    }
  }));
} finally {
  await new Promise((resolveClose) => server.close(resolveClose));
}
