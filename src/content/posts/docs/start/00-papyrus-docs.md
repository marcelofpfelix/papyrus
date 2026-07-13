---
title: Papyrus docs
description: Package docs for installing, composing, and extending Papyrus without copying a full theme into every site.
slug: papyrus-docs
pubDatetime: 2026-07-01T09:00:00.000Z
category: Docs
tags:
  - papyrus
  - docs
  - astro
---

Papyrus keeps consuming sites focused on content and config. The theme package
owns reusable layouts, post rendering, collections, generated metadata, search,
RSS, project cards, and profile/CV surfaces.

## Start points

- [Install and configure Papyrus](/posts/install-configure-papyrus/) explains the template-first workflow.
- [Feature config](/collections/docs/features/) shows grouped layout and post toggles.
- [Feature map](/collections/docs/feature-map/) maps the public routes to reusable theme features.
- [Markdown code guide](/collections/docs/code-demo/) shows Markdown, code, callouts, diagrams, media, and artifacts.

## Theme profiles

Each theme profile defines one light token set and one dark token set. Runtime
mode defaults to system, while the default color profile is Gruvbox and the
default font profile is readable. Included profiles are Catppuccin, Tokyo Night,
Kanagawa, Rose Pine, Everforest, Dracula, Gruvbox, Nord, and Pure.

```css
:root[data-papyrus-theme="custom"] {
  --papyrus-bg: #fbf7ef;
  --papyrus-fg: #1f2933;
  --papyrus-muted: #6b7280;
  --papyrus-panel: #ffffff;
  --papyrus-border: #d8d0bf;
  --papyrus-accent: #7c3aed;
  --papyrus-code-bg: #f4efe5;
  --papyrus-code-fg: #111827;
  --papyrus-theme-color: #fbf7ef;
}
```

Use `pnpm papyrus-theme list` to inspect installed profiles and
`pnpm papyrus-theme validate` to check that every profile file has the required
light and dark selectors and tokens.

## Content model

Papyrus uses `src/content/posts` as the public content source. A folder can add a
TOML file to become a collection, and the collection route reads posts in
filename order. Regular blog/archive pages can still sort the same posts by
date.

Repo-only notes stay under the repository `docs/` or `.agents/` folders unless
they are intentionally rewritten as public posts.
