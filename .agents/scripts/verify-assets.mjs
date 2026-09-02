#!/usr/bin/env node
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const publicDir = resolve("public");
const logoPath = join(publicDir, "logo.svg");
const faviconPath = join(publicDir, "favicon.svg");
const manifestPath = join(publicDir, "site.webmanifest");
const favicon32Path = join(publicDir, "favicon-32x32.png");
const appleTouchPath = join(publicDir, "apple-touch-icon.png");
const icon192Path = join(publicDir, "icon-192.png");
const icon512Path = join(publicDir, "icon-512.png");
const packageShapePath = join(publicDir, "images/papyrus-package-shape.svg");
const markdownCoverPath = join(publicDir, "demo/covers/markdown.svg");
const baseLayoutPath = resolve("src/layouts/PapyrusBaseLayout.astro");
const logoScriptPath = resolve("scripts/create-logo-svg.mjs");
const mobileIconScriptPath = resolve("scripts/create-mobile-icons.mjs");
const tmp = await mkdtemp(join(tmpdir(), "papyrus-assets-"));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function pngSize(buffer) {
  assert(buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "file is not a PNG");
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

try {
  const generatedLogo = join(tmp, "logo.svg");
  const generatedTerminalLogo = join(tmp, "terminal-logo.svg");
  const generatedManifest = join(tmp, "site.webmanifest");
  const generatedIconsDir = join(tmp, "icons");
  const generatedTerminalIconsDir = join(tmp, "terminal-icons");

  await execFileAsync("node", ["scripts/create-logo-svg.mjs", "--twinkle", generatedLogo], { cwd: root });
  await execFileAsync("node", ["scripts/create-logo-svg.mjs", "~ $", generatedTerminalLogo], { cwd: root });
  await execFileAsync("node", ["scripts/create-mobile-icons.mjs", "--twinkle", generatedIconsDir], { cwd: root });
  await execFileAsync("node", ["scripts/create-mobile-icons.mjs", "~ $", generatedTerminalIconsDir], { cwd: root });
  await execFileAsync("node", ["scripts/create-webmanifest.mjs", "papyrus", generatedManifest, "/logo.svg"], { cwd: root });

  const [logo, favicon, packageShape, markdownCover, expectedLogo, terminalLogo, manifestText, expectedManifestText, favicon32, appleTouch, icon192, icon512, expectedFavicon32, expectedAppleTouch, expectedIcon192, expectedIcon512, terminalIcon192, baseLayout, logoScript, mobileIconScript] = await Promise.all([
    readFile(logoPath, "utf8"),
    readFile(faviconPath, "utf8"),
    readFile(packageShapePath, "utf8"),
    readFile(markdownCoverPath, "utf8"),
    readFile(generatedLogo, "utf8"),
    readFile(generatedTerminalLogo, "utf8"),
    readFile(manifestPath, "utf8"),
    readFile(generatedManifest, "utf8"),
    readFile(favicon32Path),
    readFile(appleTouchPath),
    readFile(icon192Path),
    readFile(icon512Path),
    readFile(join(generatedIconsDir, "favicon-32x32.png")),
    readFile(join(generatedIconsDir, "apple-touch-icon.png")),
    readFile(join(generatedIconsDir, "icon-192.png")),
    readFile(join(generatedIconsDir, "icon-512.png")),
    readFile(join(generatedTerminalIconsDir, "icon-192.png")),
    readFile(baseLayoutPath, "utf8"),
    readFile(logoScriptPath, "utf8"),
    readFile(mobileIconScriptPath, "utf8"),
  ]);

  assert(logo === expectedLogo, "public/logo.svg does not match default Twinkling create-logo-svg output");
  assert(favicon === expectedLogo, "public/favicon.svg does not match generated logo output");
  assert(logo.includes('aria-label="Twinkling papyrus logo"'), "logo is missing the Twinkling accessible label");
  assert(logo.includes("m61.383 45.285"), "logo is missing the Twinkling path");
  assert(logo.includes("currentColor"), "logo does not use currentColor");
  assert(logo.includes("fill=\"var(--papyrus-bg, #f9f5d7)\""), "logo background does not use the default theme background fallback");
  assert(logo.includes("fill: var(--papyrus-fg, #654735)"), "logo foreground does not use the default theme foreground fallback");
  assert(logo.includes("var(--papyrus-accent"), "logo does not use the theme accent on hover");
  assert(packageShape.includes("var(--papyrus-bg") && packageShape.includes("var(--papyrus-fg") && packageShape.includes("var(--papyrus-accent"), "package-shape SVG should use Papyrus theme variables");
  assert(markdownCover.includes("var(--papyrus-bg") && markdownCover.includes("var(--papyrus-fg") && markdownCover.includes("var(--papyrus-accent"), "markdown cover SVG should use Papyrus theme variables");
  assert(logo.includes("@keyframes twinkle"), "Twinkling logo is missing twinkle keyframes");
  assert(logo.includes("animation: twinkle 2.6s ease-in-out infinite"), "Twinkling logo is missing twinkle animation");
  assert(logo.includes("prefers-reduced-motion: reduce"), "Twinkling logo is missing reduced-motion CSS");
  assert(!logo.includes("@keyframes blink"), "Twinkling logo should not include cursor blink CSS");
  assert(terminalLogo.includes('aria-label="~ $"'), "terminal override logo is missing escaped text label");
  assert(terminalLogo.includes("fill=\"var(--papyrus-bg, #f9f5d7)\""), "terminal override logo background does not use the default theme background fallback");
  assert(terminalLogo.includes("fill: var(--papyrus-fg, #654735)"), "terminal override logo foreground does not use the default theme foreground fallback");
  assert(terminalLogo.includes("@keyframes blink"), "terminal override logo is missing cursor blink CSS");
  assert(terminalLogo.includes("prefers-reduced-motion: reduce"), "terminal override logo is missing reduced-motion CSS");
  assert(favicon32.equals(expectedFavicon32), "public/favicon-32x32.png does not match create-mobile-icons output");
  assert(appleTouch.equals(expectedAppleTouch), "public/apple-touch-icon.png does not match create-mobile-icons output");
  assert(icon192.equals(expectedIcon192), "public/icon-192.png does not match create-mobile-icons output");
  assert(icon512.equals(expectedIcon512), "public/icon-512.png does not match create-mobile-icons output");
  assert(!icon192.equals(terminalIcon192), "default Twinkling mobile icon should differ from terminal override icon");
  assert(JSON.stringify(pngSize(favicon32)) === JSON.stringify({ width: 32, height: 32 }), "favicon-32x32.png is not 32x32");
  assert(JSON.stringify(pngSize(appleTouch)) === JSON.stringify({ width: 180, height: 180 }), "apple-touch-icon.png is not 180x180");
  assert(JSON.stringify(pngSize(icon192)) === JSON.stringify({ width: 192, height: 192 }), "icon-192.png is not 192x192");
  assert(JSON.stringify(pngSize(icon512)) === JSON.stringify({ width: 512, height: 512 }), "icon-512.png is not 512x512");

  const manifest = JSON.parse(manifestText);
  const expectedManifest = JSON.parse(expectedManifestText);
  assert(JSON.stringify(manifest) === JSON.stringify(expectedManifest), "site.webmanifest does not match create-webmanifest output");
  assert(Array.isArray(manifest.icons) && manifest.icons.length > 0, "manifest has no icons");
  assert(manifest.icons.some(icon => icon.src === "/logo.svg" && icon.type === "image/svg+xml"), "manifest does not reference /logo.svg as an SVG icon");
  assert(manifest.icons.some(icon => icon.src === "/icon-192.png" && icon.sizes === "192x192" && icon.type === "image/png"), "manifest does not reference /icon-192.png");
  assert(manifest.icons.some(icon => icon.src === "/icon-512.png" && icon.sizes === "512x512" && icon.type === "image/png"), "manifest does not reference /icon-512.png");
  assert(manifest.icons.some(icon => String(icon.purpose ?? "").includes("maskable")), "manifest has no maskable icon");
  assert(manifest.display === "standalone", "manifest display is not standalone");
  assert(baseLayout.includes('rel="apple-touch-icon"') && baseLayout.includes('getAssetPath("/apple-touch-icon.png")'), "base layout does not reference generated apple-touch-icon.png");
  assert(baseLayout.includes('rel="icon"') && baseLayout.includes('getAssetPath("/favicon-32x32.png")'), "base layout does not reference generated favicon-32x32.png");
  assert(logoScript.includes("themeTokens"), "create-logo-svg should read theme tokens");
  assert(mobileIconScript.includes("themeTokens") && mobileIconScript.includes("hexToRgba"), "create-mobile-icons should read theme tokens and convert them to PNG colors");

  console.log("Verified theme-colored Twinkling logo.svg/favicon.svg, PNG favicon/mobile icons, terminal override generation, and site.webmanifest generation.");
} finally {
  await rm(tmp, { recursive: true, force: true });
}
