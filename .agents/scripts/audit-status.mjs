#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const [auditPath = ".agents/request-audit.md"] = process.argv.slice(2);
const text = await readFile(auditPath, "utf8");
const statuses = new Map([
  ["Verified", 0],
  ["Partial", 0],
  ["Missing", 0],
  ["Unverified", 0],
  ["Deferred", 0],
]);
let total = 0;

for (const line of text.split("\n")) {
  const match = line.match(/^\| PP-[^|]+\|[^|]+\|\s*(Verified|Partial|Missing|Unverified|Deferred)\s*\|/);
  if (!match) continue;
  total += 1;
  statuses.set(match[1], (statuses.get(match[1]) ?? 0) + 1);
}

console.log(`Total: ${total}`);
for (const [status, count] of statuses) {
  console.log(`${status}: ${count}`);
}
