---
title: "Papyrus package shape"
description: "Package-boundary guide showing how Papyrus keeps repeated blog UI in reusable theme exports."
pubDatetime: 2026-06-30T11:00:00.000Z
license: CC-BY-4.0
pinned: 1
slug: papyrus-package-shape
cover: /images/papyrus-package-shape.svg
tags:
  - astro
  - theme
  - papyrus
  - changelog
featured: true
---

Papyrus keeps site repos focused on content and config. The site owns posts,
profile data, assets, and deployment. The package owns shared UI: layouts,
headers, footers, post lists, tags, archive helpers, profile/CV components,
metadata helpers, and CSS.

![Papyrus centered layout](/images/papyrus-layout.svg)

A content site usually needs the same core pieces on several routes:

- a clean post list
- tags and tag pages
- timeline or archive page
- RSS feed
- reading time
- previous and next post links
- light and dark mode
- a search entry point in the header
- generated metadata for RSS, sitemap, robots, search, and AI indexes

The package boundary stays explicit. Papyrus builds on Pure, adds publishing
features, exports components and helpers, and lets the site override content,
config, and routes.

```ts
import { PapyrusBaseLayout, PapyrusPostList } from "astro-papyrus/components";
import { publishedPosts } from "astro-papyrus/utils";
```

The goal is small imports, little local code, and theme updates in one package.

## Site files

In a site repo, `src/` is source and `public/` is deployed static input.

- Put posts, collections, custom pages, profile data, and content config in `src/`.
- Put logos, favicons, covers, avatars, and generated static artifacts in `public/`.
- Keep site copy in Markdown, TOML, or data files instead of hardcoding it in theme components.

If a site needs a custom route, add that route in the site. If the route is
generic enough for every Papyrus site, it belongs in the theme package.

## Post list views

The public posts page uses the standard list view so the archive stays scannable:

```astro title="src/pages/posts/index.astro"
<PapyrusPostList posts={posts} view="list" />
```

The same component can render denser or card-like post groups inside custom
sections:

```astro title="post-list-view-reference.astro"
<PapyrusPostList posts={posts} view="compact" />
<PapyrusPostList posts={posts} view="cards" />
```

Keeping these examples inside a doc keeps `/posts/` focused on the main archive.

## RSS feed choices

The normal feed at `/rss.xml` is the broad subscription. Tag feeds are separate
URLs, so a reader can subscribe only to the topics they want instead of
filtering after the fact:

- [`/rss/tags/custom.xml`](/rss/tags/custom.xml) follows posts tagged with custom authoring features.
- [`/rss/tags/changelog.xml`](/rss/tags/changelog.xml) follows release and package-change notes.

For selective subscriptions, publish one feed per tag or section and link to the
useful ones from the relevant post.
