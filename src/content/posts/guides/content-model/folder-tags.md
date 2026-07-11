---
title: "Folder tags for nested posts"
description: "Content-model guide showing stable slugs with automatic tags from source folders."
slug: folder-tags-demo
pubDatetime: 2026-06-30T11:00:00.000Z
license: CC-BY-4.0
hidden: true
tags:
  - astro
---

This post lives in `src/content/posts/guides/content-model/` to show how a
nested source folder can add metadata without changing the public URL.

The public URL uses the explicit `slug`, so the route stays stable even if the
file moves later. The post can be opened directly, but `hidden: true` keeps it
out of normal post lists, feeds, search indexes, tag pages, sitemaps, and AI
exports.

The generated tags include:

- `astro` from frontmatter
- `guides` from the parent folder
- `content-model` from the nested folder

```console
site$ pnpm content:outline
site$ pnpm build
```
