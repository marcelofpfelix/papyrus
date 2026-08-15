---
title: Generated content structure
description: How Papyrus turns nested Markdown folders and folder metadata into a readable public content index.
slug: content-structure
pubDatetime: 2026-07-01T13:10:00.000Z
category: Docs
license: CC-BY-4.0
tags:
  - papyrus
  - docs
  - content
---

Use folder metadata when a site needs nested notes, guides, or knowledge-base
pages without turning source paths into fragile public URLs.

## What gets generated

Papyrus can read a folder tree, combine explicit frontmatter with folder-level
labels, and render a public index that still feels hand-authored. The package
fixture in `public/demo/content-tree` generates `public/demo/content-structure.md`.

## How to use it

Keep canonical slugs in frontmatter when a page has a permanent URL. Use folders for organization, inherited tags, and section labels. This lets authors move
files while the published route, RSS item, search result, and AI metadata stay
stable.

```console
pnpm papyrus-content-outline public/demo/content-tree public/demo/content-structure.md
```

- Use folder names for broad groups such as `guides`, `notes`, or `reference`.
- Use an index file or folder metadata to name a section for readers.
- Set `date` or `pubDatetime` to a future UTC timestamp to schedule a post. By default the post route, sitemap, search index, RSS, and AI exports are built, but home, posts, tag, and timeline lists hide the entry until the timestamp is reached.
- When `date` has no time, Papyrus treats it as midnight UTC for scheduling and sorting.
- Mark draft, private, or internal posts with `hidden: true` when they need a direct route but should stay out of public lists, feeds, sitemaps, search, and AI exports.
- Add explicit `robots` frontmatter only when the direct page itself should be blocked from indexing.

## Public boundary

User-facing docs now live as regular posts under `src/content/posts/docs`.
Development-only notes stay under `.agents/` and are not linked from navigation
unless they are intentionally rewritten as user documentation.

## Source artifact

The generated Markdown outline remains available as a public fixture at
[`/demo/content-structure.md`](/demo/content-structure.md).
