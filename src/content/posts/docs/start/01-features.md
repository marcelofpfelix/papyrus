---
title: Feature config
description: Grouped feature toggles for Papyrus layouts.
slug: features
pubDatetime: 2026-07-01T09:10:00.000Z
category: Docs
tags:
  - papyrus
  - docs
  - config
---

Use one typed config object to disable optional layout and post features without
copying theme components.

## Base layout

```astro
---
import { PapyrusBaseLayout } from "astro-theme-papyrus/components";

const features = {
  header: true,
  footer: true,
  scrollHeader: true,
  search: false,
  rss: false,
  themeControls: true,
  poweredBy: true,
};
---

<PapyrusBaseLayout title="Minimal page" features={features}>
  <p>No search icon and no RSS icon on this page.</p>
</PapyrusBaseLayout>
```

## Post layout

```astro
---
import { PapyrusPostLayout } from "astro-theme-papyrus/components";

const features = {
  share: false,
  toc: false,
  postTags: true,
  aiMetadata: true,
  sourceActions: false,
  postStats: false,
  postSideLinks: false,
  adjacentPosts: false,
  backToTop: false,
};
---

<PapyrusPostLayout title="Minimal post" siteTitle="My site" features={features}>
  <p>Rendered without share, TOC, source actions, stats, or adjacent links.</p>
</PapyrusPostLayout>
```

## SEO and social metadata

Papyrus layouts emit the metadata a small public site normally needs: titles,
descriptions, canonical URLs, Open Graph, Twitter cards, RSS discovery, and post
JSON-LD. Hidden posts stay out of public discovery surfaces. Use explicit
`robots` frontmatter when a direct page should emit directives such as
`noindex, follow`.

## Base path deploys

Internal URLs in shared layouts and list components go through `withBase()` and
related helpers such as `stripBase()`, `stripLocale()`, `getAssetPath()`, and
`getRelativeLocaleUrl()`. This keeps navigation, post links, RSS links, favicon
assets, covers, tags, collection links, adjacent posts, project cards, and 404
suggestions working when Astro is deployed under a subdirectory.

## Search, tags, sitemap, and robots

Public posts can be found through Pagefind search, tag pages, and optional
per-tag RSS feeds. Regenerate the sitemap during every build so new posts, tag
pages, profile pages, project pages, and collection routes are included
automatically. Papyrus also includes a dynamic `robots.txt` route that reads the
site URL, keeps crawl rules near site config, and points crawlers to the sitemap
index.

## Plugin contract

Community plugins stay small: they declare capabilities, optional feature
defaults, and site-owned integration points. They do not mutate Papyrus
internals. Routes stay native Astro pages in the consuming app unless a plugin
explicitly documents a route capability.
