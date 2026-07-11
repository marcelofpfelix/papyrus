#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (!options.allowNonZero && result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout.trim();
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const roadmap = await readFile(".agents/status-roadmap.md", "utf8");
const agents = await readFile("AGENTS.md", "utf8");

const outdated = run("pnpm", ["outdated", "--format", "table"], { allowNonZero: true });
const outdatedLines = outdated.split("\n").filter((line) => line.includes("│") && !line.includes("Package") && !line.includes("─"));
assert(outdatedLines.length === 1, `expected exactly one outdated package, got:\n${outdated}`);
assert(outdated.includes("typescript") && outdated.includes("5.9.3") && outdated.includes("6.0.3"), `expected only TypeScript 5.9.3 -> 6.0.3 to be outdated, got:\n${outdated}`);

const latestTypescript = JSON.parse(run("pnpm", ["view", "typescript@latest", "version", "--json"]));
assert(latestTypescript === "6.0.3", `latest TypeScript was ${latestTypescript}, update the dependency note`);

const tsconfck = JSON.parse(run("pnpm", ["view", "tsconfck@latest", "version", "peerDependencies", "--json"]));
assert(tsconfck.version === "3.1.6", `latest tsconfck was ${tsconfck.version}, recheck TypeScript 6 compatibility`);
assert(tsconfck.peerDependencies?.typescript === "^5.0.0", `tsconfck TypeScript peer was ${tsconfck.peerDependencies?.typescript}, recheck TypeScript hold`);

const why = run("pnpm", ["why", "tsconfck"]);
assert(why.includes("astro-pure@1.4.6"), `tsconfck graph should include astro-pure@1.4.6:\n${why}`);
assert(why.includes("astro@6.1.8"), `tsconfck graph should include astro@6.1.8 via astro-pure:\n${why}`);

assert(packageJson.devDependencies?.typescript === "^5.9.3", "package.json should keep TypeScript at ^5.9.3 while tsconfck peers ^5");
assert(packageJson.devDependencies?.wrangler === "4.106.0", "wrangler should remain pinned at 4.106.0 for repeatable deploy commands");
assert(roadmap.includes("Package registry check on 2026-07-01"), "status-roadmap missing registry check date");
assert(roadmap.includes("Only TypeScript is behind latest"), "status-roadmap missing latest dependency summary");
assert(roadmap.includes("tsconfck@3.1.6"), "status-roadmap missing tsconfck blocker note");
assert(agents.includes("make verify-deps"), "AGENTS.md should document make verify-deps");

console.log("Verified dependency freshness and documented TypeScript 6 hold.");
