#!/usr/bin/env node
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const root = resolve(new URL("../..", import.meta.url).pathname);
const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const readme = await readFile(join(root, "README.md"), "utf8");
const changelog = await readFile(join(root, "CHANGELOG.md"), "utf8");
const license = await readFile(join(root, "LICENSE"), "utf8");
const releaseDocs = await readFile(join(root, "src/content/posts/docs/deploy/31-release-checklist.md"), "utf8");
const releaseWorkflow = await readFile(join(root, ".github/workflows/release.yml"), "utf8");
const pnpmWorkspace = await readFile(join(root, "pnpm-workspace.yaml"), "utf8");
const smokeProfile = await readFile(join(root, "src/data/profile.toml"), "utf8");
const failures = [];
let packedTarball;

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function hasPath(paths, path) {
  return paths.includes(path);
}

function exactVersion(value) {
  return value?.replace(/^[~^]/, "");
}

assert(packageJson.name === "astro-papyrus", "package name must be astro-papyrus");
assert(packageJson.private === false, "package must not be private");
assert(/^\d+\.\d+\.\d+/.test(packageJson.version), "package version must be semver-like");
assert(
  packageJson.description === "Pure-backed Astro theme for blogs, docs, projects, profiles, search, RSS, and generated metadata.",
  "package description should describe the public Papyrus theme surface"
);
assert(packageJson.license === "MIT", "package license must be MIT");
assert(packageJson.homepage === "https://github.com/marcelofpfelix/papyrus#readme", "package homepage must point to the repo README");
assert(packageJson.repository?.url === "git+https://github.com/marcelofpfelix/papyrus.git", "package repository URL must point to papyrus");
assert(packageJson.bugs?.url === "https://github.com/marcelofpfelix/papyrus/issues", "package bugs URL must point to papyrus issues");
assert(packageJson.publishConfig?.access === "public", "publishConfig.access must be public");
assert(packageJson.publishConfig?.provenance === true, "publishConfig.provenance must stay enabled");
assert(!packageJson.scripts?.prepare, "Git consumers should use tracked lib files without running a prepare script");
assert(packageJson.scripts?.prepack === "pnpm run package:runtime", "npm packages should regenerate lib files during prepack");
assert(/^minimumReleaseAge:\s*10080$/m.test(pnpmWorkspace), "pnpm-workspace.yaml must reject packages newer than 7 days");
assert(/^minimumReleaseAgeStrict:\s*true$/m.test(pnpmWorkspace), "pnpm-workspace.yaml must keep minimumReleaseAge strict");

for (const keyword of ["astro", "astro-theme", "blog", "docs", "portfolio", "astro-pure"]) {
  assert(packageJson.keywords?.includes(keyword), `package keywords missing ${keyword}`);
}

for (const file of ["README.md", "LICENSE", "CHANGELOG.md", "src", "scripts", "examples", "public"]) {
  assert(packageJson.files?.includes(file), `package files missing ${file}`);
}

assert(packageJson.scripts?.["verify:release"] === "node .agents/scripts/verify-release-readiness.mjs", "verify:release script missing");
assert(!Object.keys(packageJson.bin ?? {}).some((name) => name.startsWith("papyrus-verify-")), "verifier scripts should stay agent-only, not public package bins");
assert(!packageJson.bin?.["papyrus-audit-status"], "audit status should stay agent-only, not a public package bin");
assert(existsSync(join(root, "LICENSE")), "LICENSE file missing");
assert(existsSync(join(root, "CHANGELOG.md")), "CHANGELOG.md file missing");
assert(!packageJson.files?.includes("docs"), "package files should not include deleted top-level docs folder");
assert(existsSync(join(root, "src/content/posts/docs/deploy/31-release-checklist.md")), "release checklist post missing");
assert(existsSync(join(root, ".github/workflows/release.yml")), "release workflow missing");

for (const phrase of [
  "\"astro-papyrus\": \"^0.2.2\"",
  "astro-papyrus/components",
  "astro-papyrus/utils",
  "astro-papyrus/papyrus.css",
]) {
  assert(readme.includes(phrase), `README missing install/import phrase: ${phrase}`);
}

for (const phrase of ["MIT License", "Permission is hereby granted", "Marcelo Felix"]) {
  assert(license.includes(phrase), `LICENSE missing phrase: ${phrase}`);
}

for (const phrase of ["## 0.2.0", "## 0.1.0", "astro-papyrus"]) {
  assert(changelog.includes(phrase), `CHANGELOG missing phrase: ${phrase}`);
}

for (const phrase of [
  "Do not reserve or publish an empty package name",
  "pnpm run verify:release",
  "pnpm run verify:package",
  "pnpm run verify:lighthouse",
  "Smoke install the packed tarball",
  "2FA enabled",
  "publishConfig.provenance",
  "npm pack --dry-run --json",
  "temporary Astro fixture",
  "Release Please",
  "Trusted Publishing",
  "pnpm publish --access public --provenance",
]) {
  assert(releaseDocs.includes(phrase), `release docs missing phrase: ${phrase}`);
}

for (const phrase of [
  "googleapis/release-please-action@v4",
  "release-type: node",
  "package-name: astro-papyrus",
  "id-token: write",
  "pnpm run verify:release",
  "pnpm publish --access public --provenance",
]) {
  assert(releaseWorkflow.includes(phrase), `release workflow missing phrase: ${phrase}`);
}

const npmCache = await mkdtemp(join(tmpdir(), "papyrus-npm-cache-"));
const packDir = await mkdtemp(join(tmpdir(), "papyrus-pack-"));
const smokeDir = await mkdtemp(join(tmpdir(), "papyrus-smoke-"));

try {
  const pack = spawnSync("npm", ["pack", "--dry-run", "--json"], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      npm_config_cache: npmCache,
    },
  });

  if (pack.status !== 0) {
    failures.push(`npm pack dry-run failed: ${pack.stderr || pack.stdout}`);
  } else {
    let parsed;
    try {
      parsed = JSON.parse(pack.stdout);
    } catch (error) {
      failures.push(`npm pack dry-run did not return JSON: ${error.message}`);
    }

    const entry = parsed?.[0];
    const packedPaths = entry?.files?.map((file) => file.path) ?? [];
    assert(entry?.name === "astro-papyrus", "packed package name is wrong");
    assert(entry?.filename?.startsWith("astro-papyrus-"), "packed filename is wrong");
    assert(entry?.entryCount > 0, "packed package should include files");

    for (const path of [
      "README.md",
      "LICENSE",
      "CHANGELOG.md",
      "src/content/posts/docs/deploy/31-release-checklist.md",
      "package.json",
      "lib/config/index.js",
      "lib/config/index.d.ts",
      "lib/integration.js",
      "lib/integration.d.ts",
      "lib/utils/features.js",
      "lib/utils/features.d.ts",
      "lib/utils/image-effects.js",
      "lib/utils/image-effects.d.ts",
      "src/index.ts",
      "src/components/PapyrusPostList.astro",
      "src/layouts/PapyrusPostLayout.astro",
      "src/styles/papyrus.css",
      "examples/papyrus-kbd-plugin/package.json",
      "public/llms.txt",
    ]) {
      assert(hasPath(packedPaths, path), `packed tarball missing ${path}`);
    }
    assert(!packedPaths.some((path) => path.startsWith(".agents/")), "packed tarball should not include agent-only files");
  }

  const realPack = spawnSync("npm", ["pack", "--pack-destination", packDir, "--json"], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      npm_config_cache: npmCache,
    },
  });

  if (realPack.status !== 0) {
    failures.push(`npm pack for smoke fixture failed: ${realPack.stderr || realPack.stdout}`);
  } else {
    try {
      const parsed = JSON.parse(realPack.stdout);
      packedTarball = join(packDir, parsed?.[0]?.filename ?? "");
    } catch (error) {
      failures.push(`npm pack for smoke fixture did not return JSON: ${error.message}`);
    }
  }

  if (packedTarball && existsSync(packedTarball)) {
    await mkdir(join(smokeDir, "src/content/posts"), { recursive: true });
    await mkdir(join(smokeDir, "src/data"), { recursive: true });
    await writeFile(join(smokeDir, "package.json"), `${JSON.stringify({
      name: "papyrus-release-smoke",
      version: "0.0.0",
      private: true,
      type: "module",
      scripts: {
        build: "astro build",
      },
      dependencies: {
        astro: exactVersion(packageJson.devDependencies?.astro),
        "astro-papyrus": `file:${packedTarball}`,
      },
    }, null, 2)}\n`);
    await writeFile(join(smokeDir, "pnpm-workspace.yaml"), `minimumReleaseAge: 10080
minimumReleaseAgeStrict: true
`);
    await writeFile(join(smokeDir, "astro.config.mjs"), `import { definePapyrusAstroConfig } from "astro-papyrus/astro";

export default await definePapyrusAstroConfig({ site: "https://example.test" });
`);
    await writeFile(join(smokeDir, "papyrus.config.toml"), `[site]
title = "Smoke site"
description = "Tarball install smoke test."
url = "https://example.test"

[[nav]]
href = "/posts/"
label = "Posts"

[[projects]]
title = "Smoke project"
description = "Project data supplied by the consumer."
href = "https://example.test/project"
`);
    await writeFile(join(smokeDir, "src/content.config.ts"), `export { collections } from "astro-papyrus/content";\n`);
    await writeFile(join(smokeDir, "src/content/posts/smoke.md"), `---
title: Packed package smoke post
description: Consumer content rendered through injected Papyrus routes.
date: 2026-01-01
tags:
  - smoke
---

This post came from the temporary packed-package consumer.
`);
    await writeFile(join(smokeDir, "src/data/profile.toml"), smokeProfile);

    const install = spawnSync("pnpm", ["install", "--ignore-scripts", "--reporter=append-only"], {
      cwd: smokeDir,
      encoding: "utf8",
      timeout: 120_000,
      env: {
        ...process.env,
        CI: "true",
      },
    });
    if (install.status !== 0) {
      failures.push(`smoke fixture install failed: ${install.stderr || install.stdout}`);
    } else {
      const build = spawnSync("pnpm", ["exec", "astro", "build"], {
        cwd: smokeDir,
        encoding: "utf8",
        timeout: 120_000,
        env: {
          ...process.env,
          CI: "true",
        },
      });
      if (build.status !== 0) {
        failures.push(`smoke fixture build failed: ${build.stderr || build.stdout}`);
      } else {
        for (const path of [
          "dist/index.html",
          "dist/posts/index.html",
          "dist/posts/smoke/index.html",
          "dist/projects/index.html",
          "dist/profile/index.html",
          "dist/profile/print/index.html",
          "dist/profile/ast/index.html",
          "dist/search/index.html",
          "dist/rss.xml",
          "dist/robots.txt",
        ]) {
          assert(existsSync(join(smokeDir, path)), `packed consumer build missing ${path}`);
        }
        const smokePost = await readFile(join(smokeDir, "dist/posts/smoke/index.html"), "utf8");
        assert(smokePost.includes("Packed package smoke post"), "packed consumer post route did not render local content");
        const smokeHome = await readFile(join(smokeDir, "dist/index.html"), "utf8");
        assert(smokeHome.includes("Smoke site"), "packed consumer home route did not read local TOML config");
      }
    }
  }
} finally {
  await rm(npmCache, { force: true, recursive: true });
  await rm(packDir, { force: true, recursive: true });
  await rm(smokeDir, { force: true, recursive: true });
}

if (failures.length) {
  console.error("Release readiness verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Verified release metadata, license/changelog/docs, package script/bin wiring, npm mature-release gate, npm pack contents, and an isolated tarball consumer with injected routes.");
