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
const generatedLightMask = join(root, "public/generated/dither/images/papyrus-image-effects-demo-light.png");
const generatedNoiseMask = join(root, "public/generated/dithernoise/images/papyrus-image-effects-demo.png");
const generatedNoiseLightMask = join(root, "public/generated/dithernoise/images/papyrus-image-effects-demo-light.png");

assert(post.includes(">original</figcaption>"), "demo post should render the original image example");
assert(post.includes("papyrus-image-effect-duotone"), "demo post should render a duotone example");
assert(post.includes("papyrus-image-effect-tritone"), "demo post should render a tritone example");
assert(post.includes("papyrus-image-effect-dither"), "demo post should render a dither example");
assert(post.includes("papyrus-image-effect-dithernoise"), "demo post should render a dithernoise example");
assert(post.includes('data-papyrus-dither-src="/images/papyrus-image-effects-demo.jpg"'), "demo post should expose dither source for mask generation");
assert(post.includes('data-papyrus-dithernoise-src="/images/papyrus-image-effects-demo.jpg"'), "demo post should expose dithernoise source for mask generation");
assert(post.includes("papyrus-image-effects-demo-light.png"), "demo post should reference the light dither mask");
assert(post.includes("cover_effect: dithernoise"), "demo post should document dithered frontmatter");
assert(post.includes('effect = "tritone"') && post.includes('avatar_effect = "dither"'), "demo post should document profile image configuration");
assert(css.includes(".papyrus-image-effect-duotone") && css.includes(".papyrus-image-effect-tritone") && css.includes(".papyrus-image-effect-dithernoise"), "CSS should include duotone, tritone, and dithernoise effect classes");
assert(css.includes("--papyrus-dither-mask-dark") && css.includes("--papyrus-dither-mask-light") && css.includes("var(--papyrus-accent)"), "dither CSS should color generated masks with theme variables");
assert(config.includes("isPapyrusImageEffect(value)"), "config loader should validate image effects through the shared guard");
assert(contentSchema.includes('"duotone"') && contentSchema.includes('"dithernoise"'), "content schema should accept all cover effects");
assert(packageJson.bin["papyrus-image-effects"] === "scripts/generate-image-effects.mjs", "package bin should expose image effects generator");
assert(packageJson.scripts["image:effects"] === "node scripts/generate-image-effects.mjs", "package script should expose image effects generator");
assert(packageJson.scripts.build.includes("pnpm run image:effects"), "build should generate image effect assets before Astro renders");

await access(demoImage);
execFileSync(process.execPath, ["scripts/generate-image-effects.mjs"], { cwd: root, stdio: "pipe" });
const mask = await stat(generatedMask);
assert(mask.size > 0, "dither mask should be generated and non-empty");
const lightMask = await stat(generatedLightMask);
assert(lightMask.size > 0, "light dither mask should be generated and non-empty");
const noiseMask = await stat(generatedNoiseMask);
assert(noiseMask.size > 0, "dithernoise mask should be generated and non-empty");
const noiseLightMask = await stat(generatedNoiseLightMask);
assert(noiseLightMask.size > 0, "light dithernoise mask should be generated and non-empty");

console.log("Verified theme-aware image effects.");
