---
title: Release checklist
description: Package metadata, verification, smoke install, and npm publishing checks for Papyrus releases.
slug: release-checklist
pubDatetime: 2026-07-14T08:30:00.000Z
category: Docs
tags:
  - papyrus
  - deploy
  - docs
---

Papyrus publishes as `astro-theme-papyrus`. Do not reserve or publish an empty package name.
A release must ship usable exports, docs, styles, scripts, and examples that
can be installed by another Astro site.

## Before publish

1. Update `CHANGELOG.md` with the target version and user-facing changes.
2. Confirm `package.json` has the real package name, repository, homepage,
   bugs URL, keywords, `license`, `files`, public `publishConfig`, exports, and
   bin entries.
3. Confirm `pnpm-workspace.yaml` keeps the mature-release install gate:
   `minimumReleaseAge: 10080` and `minimumReleaseAgeStrict: true`.
   This blocks registry packages published in the last seven days, including
   transitive dependencies.
4. Run the focused release gate:

   ```sh
   pnpm run verify:release
   ```

5. Run the broader package gate:

   ```sh
   pnpm run verify:package
   pnpm run verify:readme
   pnpm run build
   ```

6. For a commit/release gate only, run Lighthouse:

   ```sh
   pnpm run verify:lighthouse
   ```

7. Smoke install the packed tarball in a clean temporary Astro fixture before publishing.
   The fixture should import `astro-theme-papyrus/components`,
   `astro-theme-papyrus/config`, and `astro-theme-papyrus/papyrus.css`.
8. Publish only from an npm account with 2FA enabled. Keep
   `publishConfig.provenance` enabled so supported CI releases attach npm
   provenance.

## Pack check

`pnpm run verify:release` runs `npm pack --dry-run --json` with a temporary npm
cache, then checks that the tarball includes `README.md`, `LICENSE`,
`CHANGELOG.md`, public exports, scripts, examples, styles, and release docs.
It also packs a real tarball, installs it in a temporary Astro fixture, imports
Papyrus components/config/styles from that tarball, and runs `astro build`.
The temporary fixture also uses the seven-day pnpm mature-release gate so
release smoke installs do not accidentally accept freshly published registry
packages.
It does not publish, create a git tag, or mutate the npm registry.
