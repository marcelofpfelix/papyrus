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
docs:
  section: start
  order: 30
  title: Theme package shape
  description: Post-as-doc overview of the package boundary between site content and reusable Papyrus UI.
---

Papyrus is meant to keep the site repo focused. The consuming site owns content,
configuration, route choices, and deployment. The theme package owns reusable
UI: base layout, post layout, header, footer, post lists, tags, archive helpers,
profile/CV components, generated metadata helpers, and shared CSS.

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

The package boundary stays explicit. Papyrus reuses Pure as the foundation,
adds Paper-style publishing features, exposes a stable public API through
package exports, and lets the site override content, config, and routes.

```ts
import { PaperBaseLayout, PaperPostList } from "astro-theme-papyrus/components";
import { publishedPosts } from "astro-theme-papyrus/utils";
```

That is the intended shape: small imports, low local code, and theme updates
handled in one package.

## Post list views

The public posts page uses the standard list view so the archive stays easy to scan:

```astro title="src/pages/posts/index.astro"
<PaperPostList posts={posts} view="list" />
```

The same component can still render denser or card-like post groups inside
documentation references, landing pages, or custom sections:

```astro title="post-list-view-reference.astro"
<PaperPostList posts={posts} view="compact" />
<PaperPostList posts={posts} view="cards" />
```

Keeping these alternatives inside a post leaves `/posts/` focused on the main
archive while documenting every supported display mode where readers can inspect
it as content.

## RSS feed choices

The normal feed at `/rss.xml` is the broad subscription. Tag feeds are separate
URLs, so a reader can subscribe only to the topics they want instead of
filtering after the fact:

- [`/rss/tags/custom.xml`](/rss/tags/custom.xml) follows posts tagged with custom authoring features.
- [`/rss/tags/changelog.xml`](/rss/tags/changelog.xml) follows release and package-change notes.

That is the practical RSS model for selective subscriptions: publish one feed
per tag or site-owned section, then document the important subscription choices
inside the relevant post.
