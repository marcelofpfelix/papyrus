#!/usr/bin/env node
import { validateBuiltLinks } from "../src/plugins/link-validator.mjs";

const [dist = "dist", base = "/"] = process.argv.slice(2);
const result = await validateBuiltLinks(dist, { base });

if (result.broken.length > 0) {
  console.error(`Broken internal links: ${result.broken.length}`);
  for (const item of result.broken) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`Checked ${result.checkedFiles.length} built files; no broken internal links found.`);
