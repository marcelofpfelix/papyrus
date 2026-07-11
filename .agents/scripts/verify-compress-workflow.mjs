#!/usr/bin/env node
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const guide = await readFile("docs/guide.md", "utf8");
const makefile = await readFile("Makefile", "utf8");
const packageJson = JSON.parse(await readFile("package.json", "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(packageJson.bin?.["papyrus-compress"] === "./scripts/compress-images.mjs", "papyrus-compress bin missing");
assert(packageJson.scripts?.compress === "node scripts/compress-images.mjs", "compress package script missing");
assert(packageJson.scripts?.["verify:compress"] === "node .agents/scripts/verify-compress-workflow.mjs", "verify:compress package script missing");
assert(makefile.includes("compress-images:"), "Makefile missing compress-images target");
assert(makefile.includes("pnpm run compress -- public/images"), "compress-images target should run package compressor against public/images");
assert(makefile.includes("verify-compress:"), "Makefile missing verify-compress target");

for (const phrase of [
  "Image compression is deliberate, not part of `make build`",
  "Run it before committing or releasing when source images change",
  "pnpm add -D sharp",
  "make compress-images",
  "papyrus-compress --optional public/images",
]) {
  assert(guide.includes(phrase), `guide missing compression workflow phrase: ${phrase}`);
}

const tmp = await mkdtemp(join(tmpdir(), "papyrus-compress-"));
try {
  const result = spawnSync(process.execPath, ["scripts/compress-images.mjs", "--optional", tmp], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  assert(result.status === 0, `optional compression smoke test failed: ${result.stderr || result.stdout}`);
  assert(
    result.stdout.includes("Saved 0 bytes across 0 image(s).") || result.stderr.includes("Skipping optional image compression"),
    `optional compression smoke test returned unexpected output: stdout=${result.stdout} stderr=${result.stderr}`
  );
} finally {
  await rm(tmp, { recursive: true, force: true });
}

console.log("Verified local image compression workflow, docs, and optional smoke test.");
