---
title: Collections
description: What Papyrus collections are and how folder-backed collection routes work.
slug: collections
pubDatetime: 2026-07-13T08:10:00.000Z
category: Docs
license: CC-BY-4.0
tags:
  - papyrus
  - collections
  - reference
---

A collection is a folder of posts with a TOML file. Use one when readers should
follow posts in a fixed order instead of normal blog date order.

The same Markdown post can appear in the regular `/posts/` archive and in a
collection route. The archive sorts by publishing metadata; the collection sorts
by filename so authors can control the sequence.

## Folder shape

Create a folder under `src/content/posts` and add a TOML file inside it:

```txt
src/content/posts/
  docs/
    docs.toml
    start/
      00-papyrus-docs.md
      03-site-config.md
    references/
      25-collections.md
```

Papyrus detects TOML files below `src/content/posts`. The collection slug comes
from the folder name, so `src/content/posts/docs/docs.toml` becomes
`/collections/docs/`.

## Collection config

```toml title="src/content/posts/docs/docs.toml"
name = "Papyrus docs"
description = "Package docs for installing, composing, and extending Papyrus."

[settings]
breadcrumbs = true
post_footer = "collection"
post_footer_collapsible = true

[[sections]]
name = "Start"
description = "Getting started and configuration."

[[sections]]
name = "References"
description = "Reusable route and content references."
```

Sections are matched by folder slug. A section named `Start` reads posts from
`start/`; a section named `References` reads posts from `references/`. Set
`directory` when the public name differs from the folder, for example
`name = "Getting started"` with `directory = "start"`.

## Ordering

Collection pages use filename order, not post date order. Prefix filenames when
the order matters:

```txt
start/00-papyrus-docs.md
start/01-features.md
start/02-install-configure-papyrus.md
start/03-site-config.md
```

Keep explicit `slug` frontmatter when moving a post into a collection. That
preserves the normal `/posts/my-slug/` route while also adding the collection
route at `/collections/docs/my-slug/`.

## Post pages inside a collection

Collection post pages receive collection-aware navigation:

- breadcrumbs link to the collection and current section
- previous and next links follow filename order
- the table of contents can include collection sections
- the footer can show the current collection, collapsed by default

Breadcrumbs are enabled by default. Set `breadcrumbs = false` to keep the
single Back link instead.

Use collection routes when sequence matters. Use normal post routes when date
order is enough.

## Hiding collection posts

`hidden: true` keeps a post reachable by direct URL but removes it from public
collection lists, feeds, tag pages, sitemap, search, and AI indexes. Use it for
fixtures and private-ish drafts that should not be part of public discovery.
