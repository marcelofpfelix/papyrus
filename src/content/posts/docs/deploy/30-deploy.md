---
title: Deploy Papyrus
description: Static hosting, build settings, metadata URLs, and base-path notes for a Papyrus site.
slug: deploy
pubDatetime: 2026-07-01T15:00:00.000Z
category: Docs
tags:
  - deploy
  - docs
  - astro
---

Papyrus builds static Astro output. Publish the generated `dist` directory to
any static host.

## Local preview

Use the local development server while editing content, routes, and theme
configuration. For a production-shaped preview, build first and serve the
generated output.

```console
pnpm install
pnpm dev
pnpm build
pnpm preview
```

For a static preview of the built package demo, use the package Makefile:

```sh
make serve
```

The default preview URL is printed by the command.

## Docker preview

The Dockerfile is for repeatable local static preview of the package demo. It
does not deploy anything.

```sh
make docker-build
make docker-run
```

Open `http://localhost:4327/`, then stop the container:

```sh
make docker-stop
```

## Static hosting

The deployment artifact is the Astro `dist` directory. Cloudflare Pages,
Netlify, Vercel static output, GitHub Pages, and any static file server can host
it as long as the configured site URL matches the final domain.

- Set the production site URL before generating sitemap, robots, RSS, social metadata, and AI indexes.
- Keep secret lookup and host-specific deploy wrappers outside the reusable theme package.
- Check `/robots.txt`, `/sitemap-index.xml`, `/rss.xml`, `/search/`, `/posts/`, and `/collections/` after publishing.

## Build settings

Most static hosts need only the package manager, build command, output
directory, and production URL. Keep the URL in one environment variable so
generated metadata agrees across sitemap, robots, RSS, social previews, search,
and AI files.

```text
package manager: pnpm
build command: SITE_URL="https://example.test" pnpm build
output directory: dist
```

If the site uses pnpm, keep `minimumReleaseAge` in
`pnpm-workspace.yaml` so production builds do not pick up packages published
only minutes ago.

## Cloudflare Pages

The package repository pins Wrangler as a dev dependency, so no global Wrangler
install is required for the demo deploy target.

One-time setup:

- create or confirm the Cloudflare Pages project
- create a token with Cloudflare Pages write access
- store the token outside this repo

Repeatable deploy command:

```sh
CLOUDFLARE_API_TOKEN="$TOKEN" make deploy-demo
```

The target is repeatable because it updates the same Pages project:

```sh
make deploy-demo PAGES_PROJECT=papyrus
```

Do not put personal token lookup helpers in this package. Wrap the command
locally when a machine needs its own secret manager.

## Subdirectory deploys

When the site is published under a base path, use Papyrus base-path helpers or
Astro route helpers instead of hardcoded root-relative strings. Configure
Astro's `base` option in the site, then keep internal links on helpers such as
`withBase()` or `getRelativeLocaleUrl()`.

## After deploy

Open the published URL and confirm the generated routes load. At minimum, check
that `/robots.txt`, `/sitemap-index.xml`, `/rss.xml`, `/search/`, `/posts/`, and
`/collections/docs/` match the configured site URL.
