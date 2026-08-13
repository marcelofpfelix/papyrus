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
const features = await readFile(join(root, "src/utils/features.ts"), "utf8");
const mediaRuntime = await readFile(join(root, "src/components/runtime/PapyrusMediaRuntime.astro"), "utf8");
const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const demoImage = join(root, "public/images/papyrus-image-effects-demo.jpg");
const demoVideo = join(root, "public/media/papyrus-image-effects-demo.mp4");
const generatedMask = join(root, "public/generated/dither/v1/images/papyrus-image-effects-demo/dark.png");
const generatedLightMask = join(root, "public/generated/dither/v1/images/papyrus-image-effects-demo/light.png");
const generatedNoiseDir = join(root, "public/generated/dithernoise/v2/images/papyrus-image-effects-demo");

assert(post.includes(">original</figcaption>"), "demo post should render the original image example");
assert(post.includes("papyrus-image-effect-duotone"), "demo post should render a duotone example");
assert(post.includes("papyrus-image-effect-tritone"), "demo post should render a tritone example");
assert(post.includes("papyrus-image-effect-dither"), "demo post should render a dither example");
assert(post.includes("papyrus-image-effect-dithernoise"), "demo post should render a dithernoise example");
assert(post.includes("data-papyrus-video-dither-src"), "demo post should render a Markdown-safe dithered video example");
assert(post.includes('data-papyrus-dither-src="/images/papyrus-image-effects-demo.jpg"'), "demo post should expose dither source for mask generation");
assert(post.includes('data-papyrus-dithernoise-src="/images/papyrus-image-effects-demo.jpg"'), "demo post should expose dithernoise source for mask generation");
assert(post.includes("generated/dither/v1/images/papyrus-image-effects-demo/light.png"), "demo post should reference the light dither mask");
assert(post.includes("generated/dithernoise/v2/images/papyrus-image-effects-demo/light-4.png"), "demo post should reference the animated noise mask frames");
assert(post.includes("cover_effect: dithernoise"), "demo post should document dithered frontmatter");
assert(post.includes('effect = "tritone"') && post.includes('avatar_effect = "dither"'), "demo post should document profile image configuration");
assert(css.includes(".papyrus-image-effect-duotone") && css.includes(".papyrus-image-effect-tritone") && css.includes(".papyrus-image-effect-dithernoise"), "CSS should include duotone, tritone, and dithernoise effect classes");
assert(css.includes("--papyrus-dither-mask-dark") && css.includes("--papyrus-dither-mask-light") && css.includes("var(--papyrus-accent)"), "dither CSS should color generated masks with theme variables");
assert(css.includes("--papyrus-active-dither-mask-4") && css.includes("papyrusDitherNoiseFrames"), "dithernoise CSS should swap between generated noise masks");
assert(css.includes(".papyrus-video-dither-frame") && css.includes(".papyrus-video-dither-canvas"), "CSS should include dithered video canvas styles");
assert(features.includes("videoDither?: boolean") && features.includes("videoDither: true"), "feature flags should expose dithered video runtime control");
assert(mediaRuntime.includes("videoDither") && mediaRuntime.includes("papyrus-video-effect-dither") && mediaRuntime.includes("data-papyrus-video-dither-src"), "media runtime should opt into dithered video by class or Markdown-safe placeholder");
assert(mediaRuntime.includes("getContext(\"webgl\"") && mediaRuntime.includes("IntersectionObserver") && mediaRuntime.includes("prefers-reduced-motion"), "video dither should be WebGL progressive enhancement with visibility and motion gates");
assert(config.includes("isPapyrusImageEffect(value)"), "config loader should validate image effects through the shared guard");
assert(contentSchema.includes('"duotone"') && contentSchema.includes('"dithernoise"'), "content schema should accept all cover effects");
assert(packageJson.bin["papyrus-image-effects"] === "scripts/generate-image-effects.mjs", "package bin should expose image effects generator");
assert(packageJson.scripts["image:effects"] === "node scripts/generate-image-effects.mjs", "package script should expose image effects generator");
assert(packageJson.scripts.build.includes("pnpm run image:effects"), "build should generate image effect assets before Astro renders");

await access(demoImage);
await access(demoVideo);
execFileSync(process.execPath, ["scripts/generate-image-effects.mjs"], { cwd: root, stdio: "pipe" });
const mask = await stat(generatedMask);
assert(mask.size > 0, "dither mask should be generated and non-empty");
const lightMask = await stat(generatedLightMask);
assert(lightMask.size > 0, "light dither mask should be generated and non-empty");
for (let frame = 1; frame <= 4; frame += 1) {
  const noiseMask = await stat(join(generatedNoiseDir, `dark-${frame}.png`));
  assert(noiseMask.size > 0, `dark dithernoise frame ${frame} should be generated and non-empty`);
  const noiseLightMask = await stat(join(generatedNoiseDir, `light-${frame}.png`));
  assert(noiseLightMask.size > 0, `light dithernoise frame ${frame} should be generated and non-empty`);
}

console.log("Verified theme-aware image effects.");
