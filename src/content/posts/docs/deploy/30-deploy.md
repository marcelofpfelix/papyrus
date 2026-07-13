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

Papyrus builds to static Astro output, so a consuming site can publish the
generated `dist` directory to any static host.

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

## Static hosting

The deployment artifact is the Astro `dist` directory. Cloudflare Pages,
Netlify, Vercel static output, GitHub Pages, and any static file server can host
it as long as the configured site URL matches the final domain.

- Set the production site URL before generating sitemap, robots, RSS, social metadata, and AI indexes.
- Keep secret token lookup and host-specific deploy wrappers outside the reusable theme package.
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

If the consuming site uses pnpm, keep `minimumReleaseAge` in
`pnpm-workspace.yaml` so production builds do not pick up packages published
only minutes ago.

## Subdirectory deploys

When the site is published under a base path, route links go through Papyrus
base-path helpers or Astro route helpers instead of hardcoded root-relative
strings. Asset URLs use the same base-aware helper used by the layout. Configure
the Astro `base` option in the consuming site, then keep internal links on
helpers such as `withBase()` or `getRelativeLocaleUrl()`.
