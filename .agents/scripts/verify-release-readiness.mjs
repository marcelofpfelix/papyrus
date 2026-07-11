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
const releaseDocs = await readFile(join(root, "docs/release.md"), "utf8");
const pnpmWorkspace = await readFile(join(root, "pnpm-workspace.yaml"), "utf8");
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

assert(packageJson.name === "astro-theme-papyrus", "package name must be astro-theme-papyrus");
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
assert(/^minimumReleaseAge:\s*10080$/m.test(pnpmWorkspace), "pnpm-workspace.yaml must reject packages newer than 7 days");
assert(/^minimumReleaseAgeStrict:\s*true$/m.test(pnpmWorkspace), "pnpm-workspace.yaml must keep minimumReleaseAge strict");

for (const keyword of ["astro", "astro-theme", "blog", "docs", "portfolio", "astro-pure"]) {
  assert(packageJson.keywords?.includes(keyword), `package keywords missing ${keyword}`);
}

for (const file of ["README.md", "LICENSE", "CHANGELOG.md", "src", "scripts", "examples", "public", "docs"]) {
  assert(packageJson.files?.includes(file), `package files missing ${file}`);
}

assert(packageJson.scripts?.["verify:release"] === "node .agents/scripts/verify-release-readiness.mjs", "verify:release script missing");
assert(!Object.keys(packageJson.bin ?? {}).some((name) => name.startsWith("papyrus-verify-")), "verifier scripts should stay agent-only, not public package bins");
assert(!packageJson.bin?.["papyrus-audit-status"], "audit status should stay agent-only, not a public package bin");
assert(existsSync(join(root, "LICENSE")), "LICENSE file missing");
assert(existsSync(join(root, "CHANGELOG.md")), "CHANGELOG.md file missing");
assert(existsSync(join(root, "docs/release.md")), "docs/release.md file missing");

for (const phrase of [
  "\"astro-theme-papyrus\": \"^0.2.0\"",
  "astro-theme-papyrus/components",
  "astro-theme-papyrus/utils",
  "astro-theme-papyrus/paper.css",
]) {
  assert(readme.includes(phrase), `README missing install/import phrase: ${phrase}`);
}

for (const phrase of ["MIT License", "Permission is hereby granted", "Marcelo Felix"]) {
  assert(license.includes(phrase), `LICENSE missing phrase: ${phrase}`);
}

for (const phrase of ["## 0.2.0", "## 0.1.0", "astro-theme-papyrus"]) {
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
]) {
  assert(releaseDocs.includes(phrase), `release docs missing phrase: ${phrase}`);
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
    assert(entry?.name === "astro-theme-papyrus", "packed package name is wrong");
    assert(entry?.filename?.startsWith("astro-theme-papyrus-"), "packed filename is wrong");
    assert(entry?.entryCount > 0, "packed package should include files");

    for (const path of [
      "README.md",
      "LICENSE",
      "CHANGELOG.md",
      "docs/release.md",
      "package.json",
      "src/index.ts",
      "src/components/PaperPostList.astro",
      "src/layouts/PaperPostLayout.astro",
      "src/styles/paper.css",
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
    await mkdir(join(smokeDir, "src/pages"), { recursive: true });
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
        "astro-theme-papyrus": `file:${packedTarball}`,
      },
    }, null, 2)}\n`);
    await writeFile(join(smokeDir, "pnpm-workspace.yaml"), `minimumReleaseAge: 10080
minimumReleaseAgeStrict: true
`);
    await writeFile(join(smokeDir, "astro.config.mjs"), `import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://example.test",
});
`);
    await writeFile(join(smokeDir, "paper.config.toml"), `[site]
title = "Smoke site"
description = "Tarball install smoke test."

[[nav]]
href = "/"
label = "Home"
`);
    await writeFile(join(smokeDir, "src/pages/index.astro"), `---
import { PaperBaseLayout, PaperPostList } from "astro-theme-papyrus/components";
import { loadPaperConfig } from "astro-theme-papyrus/config";
import "astro-theme-papyrus/paper.css";

const config = await loadPaperConfig();
---

<PaperBaseLayout title={config.title} description={config.description} nav={config.nav}>
  <section class="paper-hero">
    <h1>{config.title}</h1>
    <p class="paper-description">{config.description}</p>
  </section>
  <PaperPostList posts={[]} />
</PaperBaseLayout>
`);

    const install = spawnSync("pnpm", ["install", "--ignore-scripts"], {
      cwd: smokeDir,
      encoding: "utf8",
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
        env: {
          ...process.env,
          CI: "true",
        },
      });
      if (build.status !== 0) {
        failures.push(`smoke fixture build failed: ${build.stderr || build.stdout}`);
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

console.log("Verified release metadata, license/changelog/docs, package script/bin wiring, npm mature-release gate, npm pack contents, and tarball smoke install.");
