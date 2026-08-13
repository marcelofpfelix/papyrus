#!/usr/bin/env node
import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const post = await readFile(join(root, "src/content/posts/image-effects.md"), "utf8");
const css = await readFile(join(root, "src/styles/papyrus.css"), "utf8");
const config = await readFile(join(root, "src/config/index.ts"), "utf8");
const contentSchema = await readFile(join(root, "src/content.config.ts"), "utf8");
const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const demoImage = join(root, "public/images/papyrus-image-effects-demo.jpg");
const generatedMask = join(root, "public/generated/dither/images/papyrus-image-effects-demo.png");

assert(post.includes("papyrus-image-effect-tritone"), "demo post should render a tritone example");
assert(post.includes("papyrus-image-effect-dither"), "demo post should render a dither example");
assert(post.includes('data-papyrus-dither-src="/images/papyrus-image-effects-demo.jpg"'), "demo post should expose dither source for mask generation");
assert(post.includes("cover_effect: dither"), "demo post should document dither frontmatter");
assert(post.includes('effect = "tritone"') && post.includes('avatar_effect = "dither"'), "demo post should document profile image configuration");
assert(css.includes(".papyrus-image-effect-tritone") && css.includes(".papyrus-image-effect-dither"), "CSS should include tritone and dither effect classes");
assert(css.includes("--papyrus-dither-mask") && css.includes("var(--papyrus-accent)"), "dither CSS should color generated masks with theme variables");
assert(config.includes('value === "dither"') || config.includes("isPapyrusImageEffect(value)"), "config loader should accept dither");
assert(contentSchema.includes('"dither"'), "content schema should accept dither cover effects");
assert(packageJson.bin["papyrus-image-effects"] === "scripts/generate-image-effects.mjs", "package bin should expose image effects generator");
assert(packageJson.scripts["image:effects"] === "node scripts/generate-image-effects.mjs", "package script should expose image effects generator");
assert(packageJson.scripts.build.includes("pnpm run image:effects"), "build should generate image effect assets before Astro renders");

await access(demoImage);
execFileSync(process.execPath, ["scripts/generate-image-effects.mjs"], { cwd: root, stdio: "pipe" });
const mask = await stat(generatedMask);
assert(mask.size > 0, "dither mask should be generated and non-empty");

console.log("Verified tritone and dither image effects.");
