#!/usr/bin/env node
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const guide = await readFile(".agents/package-guide.md", "utf8");
const guideLower = guide.toLowerCase();
const makefile = await readFile("Makefile", "utf8");
const packageJson = JSON.parse(await readFile("package.json", "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runPostDate(args) {
  return spawnSync(process.execPath, ["scripts/post-date.mjs", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
}

assert(packageJson.bin?.["papyrus-post-date"] === "./scripts/post-date.mjs", "papyrus-post-date bin missing");
assert(packageJson.scripts?.["post:date"] === "node scripts/post-date.mjs", "post:date package script missing");
assert(packageJson.scripts?.["verify:date"] === "node .agents/scripts/verify-date-workflow.mjs", "verify:date package script missing");
assert(makefile.includes("date-check:"), "Makefile missing date-check target");
assert(makefile.includes("date-touch:"), "Makefile missing date-touch target");
assert(makefile.includes("verify-date:"), "Makefile missing verify-date target");

for (const phrase of [
  "Date automation is opt-in",
  "papyrus-post-date check src/content/posts",
  "papyrus-post-date touch src/content/posts/my-post.md",
  "Do not install a package-managed git hook by default",
]) {
  assert(guide.includes(phrase), `guide missing date workflow phrase: ${phrase}`);
}

assert(
  guideLower.includes("consuming sites may wire") && guideLower.includes("ci or a local pre-commit hook"),
  "guide missing consuming-site CI/pre-commit hook guidance"
);

const tmp = await mkdtemp(join(tmpdir(), "papyrus-date-"));
try {
  const valid = join(tmp, "valid.md");
  const missing = join(tmp, "missing.md");
  const existingMod = join(tmp, "existing-mod.md");

  await writeFile(valid, "---\ntitle: Valid\npubDatetime: 2026-01-01T00:00:00.000Z\n---\n\n# Valid\n", "utf8");
  await writeFile(missing, "---\ntitle: Missing\n---\n\n# Missing\n", "utf8");
  await writeFile(existingMod, "---\ntitle: Existing\npubDatetime: 2026-01-01T00:00:00.000Z\nmodDatetime: 2026-01-02T00:00:00.000Z\n---\n\n# Existing\n", "utf8");

  const validCheck = runPostDate(["check", valid]);
  assert(validCheck.status === 0, `date check should pass for valid frontmatter: ${validCheck.stderr || validCheck.stdout}`);

  const missingCheck = runPostDate(["check", missing]);
  assert(missingCheck.status !== 0, "date check should fail when pubDatetime is missing");
  assert(missingCheck.stderr.includes("missing pubDatetime"), `missing pubDatetime error not reported: ${missingCheck.stderr}`);

  const touchMissing = runPostDate(["touch", missing]);
  assert(touchMissing.status === 0, `date touch should add missing dates: ${touchMissing.stderr || touchMissing.stdout}`);
  const touchedMissing = await readFile(missing, "utf8");
  assert(/^pubDatetime: \d{4}-\d{2}-\d{2}T/m.test(touchedMissing), "date touch should insert pubDatetime");
  assert(/^modDatetime: \d{4}-\d{2}-\d{2}T/m.test(touchedMissing), "date touch should insert modDatetime");

  const touchExisting = runPostDate(["touch", existingMod]);
  assert(touchExisting.status === 0, `date touch should update existing modDatetime: ${touchExisting.stderr || touchExisting.stdout}`);
  const touchedExisting = await readFile(existingMod, "utf8");
  assert(touchedExisting.includes("pubDatetime: 2026-01-01T00:00:00.000Z"), "date touch should preserve existing pubDatetime");
  assert(!touchedExisting.includes("modDatetime: 2026-01-02T00:00:00.000Z"), "date touch should replace existing modDatetime");
} finally {
  await rm(tmp, { recursive: true, force: true });
}

console.log("Verified post date check/touch workflow and opt-in hook guidance.");
