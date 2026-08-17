#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative } from "node:path";

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const help = args.includes("--help") || args.includes("-h");
const positional = args.filter(arg => !arg.startsWith("--"));
const [inputDir = "public", outputDir = "public/generated/artifacts"] = positional;

const renderers = {
  ".puml": "plantuml",
  ".plantuml": "plantuml",
  ".excalidraw": "excalidraw",
};

function usage() {
  return `papyrus-artifacts [input-dir] [output-dir] [--strict]

Scans for .puml, .plantuml, and .excalidraw files and writes matching SVG files
under the output directory.

Renderers are optional:
- PlantUML: install a local plantuml command.
- Excalidraw: install excalidraw_export or excalidraw-to-svg.

Without --strict, files without an available renderer are skipped with a note.`;
}

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  }));
  return files.flat();
}

function commandAvailable(command) {
  const result = spawnSync(command, ["--help"], { encoding: "utf8" });
  return !result.error || result.error.code !== "ENOENT";
}

async function renderPlantuml(source, target) {
  const input = await readFile(source, "utf8");
  const result = spawnSync("plantuml", ["-tsvg", "-pipe"], { input, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || "plantuml failed");
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, result.stdout);
}

async function renderExcalidraw(source, target) {
  await mkdir(dirname(target), { recursive: true });

  if (commandAvailable("excalidraw_export")) {
    const result = spawnSync("excalidraw_export", ["--input", source, "--output", target], { encoding: "utf8" });
    if (result.status !== 0) throw new Error(result.stderr || result.stdout || "excalidraw_export failed");
    return;
  }

  if (commandAvailable("excalidraw-to-svg")) {
    const result = spawnSync("excalidraw-to-svg", [source, target], { encoding: "utf8" });
    if (result.status !== 0) throw new Error(result.stderr || result.stdout || "excalidraw-to-svg failed");
    return;
  }

  throw new Error("install excalidraw_export or excalidraw-to-svg");
}

async function copyMermaid(source, target) {
  await mkdir(dirname(target), { recursive: true });
  await cp(source, target);
}

if (help) {
  console.log(usage());
  process.exit(0);
}

const files = await listFiles(inputDir);
const artifacts = files.filter(file => renderers[extname(file).toLowerCase()]);
let rendered = 0;
let skipped = 0;

for (const source of artifacts) {
  const extension = extname(source).toLowerCase();
  const relativePath = relative(inputDir, source).replace(new RegExp(`${extension}$`), ".svg");
  const target = join(outputDir, relativePath);
  const type = renderers[extension];

  try {
    if (type === "plantuml") {
      if (!commandAvailable("plantuml")) throw new Error("install plantuml");
      await renderPlantuml(source, target);
    } else if (type === "excalidraw") {
      await renderExcalidraw(source, target);
    } else {
      await copyMermaid(source, target);
    }
    rendered += 1;
    console.log(`rendered ${source} -> ${target}`);
  } catch (error) {
    skipped += 1;
    const message = error instanceof Error ? error.message : String(error);
    if (strict) throw new Error(`${source}: ${message}`);
    console.warn(`skipped ${source}: ${message}`);
  }
}

console.log(`Artifact render complete: ${rendered} rendered, ${skipped} skipped.`);
