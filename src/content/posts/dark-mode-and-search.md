---
title: "Dark mode and search in Papyrus"
description: "The theme keeps a Pure-like neutral background, then adds a small Paper-style search flow."
slug: dark-mode-and-search
pubDatetime: 2026-06-30T11:15:00.000Z
license: CC-BY-4.0
tags:
  - astro
  - search
  - dark-mode
docs:
  section: authoring
  order: 40
  title: Dark mode and search
  description: Post-as-doc guide covering theme mode switching and the search entry point.
---

The light and dark backgrounds stay close to the default Pure theme: neutral, quiet, and readable. Papyrus keeps color accents restrained so the content remains the main surface.

<img src="/images/papyrus-dark.svg" alt="Papyrus dark mode search" width="960" height="540" />

The header has a search icon. It links to the site-owned `/search/` page. That keeps the package generic: Papyrus exposes the header control and search UI patterns, while the consuming site decides which index to build.

The public Papyrus site builds a Pagefind index from generated static HTML. A smaller site can still use a simple client-side filter, but the public contract stays the same: keep the search URL stable and let the site own the indexing strategy.

```astro
---
import { PaperBaseLayout } from "astro-theme-papyrus/components";
---

<PaperBaseLayout
  title="Search"
  description="Static search for posts, tags, and archive entries."
  searchHref="/search/"
>
  <p>The header search icon opens the site-owned search page.</p>
</PaperBaseLayout>
```

That is the important boundary. The icon and layout affordance belong to the theme. The index strategy belongs to the site.
