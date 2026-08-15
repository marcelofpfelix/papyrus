---
title: AI and mobile readiness
description: AI metadata, generated indexes, and mobile-ready defaults in a Papyrus site.
slug: ai-mobile
pubDatetime: 2026-07-01T14:10:00.000Z
category: Docs
license: CC-BY-4.0
tags:
  - ai
  - mobile
  - docs
---

Papyrus builds static metadata and search files alongside the site. The same
build also keeps the main layouts usable on small screens.

## Generated files

- `llms.txt` and `llms-full.txt` for agent-readable site summaries.
- Static RSS feeds per tag.
- Static JSON indexes for posts, tags, projects, notes, and CV summary data.
- Static graph data export connecting posts, tags, projects, notes, and CV sections.
- Stable IDs in generated JSON indexes, graph nodes, graph edges, and search records.
- Static search data for local tools and Pagefind.
- Per-post JSON-LD metadata for schema.org types.
- Post layout support for canonical URL, source Markdown URL, author metadata, copy Markdown, and copy citation.

Generated files include [`llms.txt`](/llms.txt), [`llms-full.txt`](/llms-full.txt),
[`posts.json`](/ai/posts.json), [`tags.json`](/ai/tags.json),
[`cv.json`](/ai/cv.json), and [`graph.json`](/ai/graph.json).

## Site-specific metadata

- Add extra source links when a post depends on diagrams, notebooks, or external datasets.
- Add JSON-LD types for people, projects, software source code, or breadcrumbs on site-specific pages.
- Generate backlinks or related posts from Markdown links when the content model needs a knowledge graph.
- Store explicit license metadata for images, code snippets, and diagrams when licensing matters.
- Publish diagram source beside rendered SVG output for Mermaid, PlantUML, or Excalidraw workflows.

## Mobile defaults

- Safe-area padding for phones with notches or rounded display edges.
- 44px coarse-pointer hit targets for core icon, copy, post action, tag, TOC, and back-to-top controls.
- Responsive post lists with stable cover dimensions and compact metadata.
- Collapsible table of contents and back-to-top controls designed for small screens.
- Image, SVG, and Mermaid zoom behavior that works with touch input.
- Reduced-motion handling for cursor, logo, header, dropdown, and page-transition effects.
- Profile and CV routes that share one data source across web, timeline, and print layouts.
- Static Pagefind search and generated tag pages, so mobile search does not require a server.

## Mobile authoring tips

Keep post descriptions short enough to scan in list views, prefer real cover
images or generated covers with stable aspect ratios, use headings in order, and
preview layout-heavy changes on desktop and phone-sized screens before
publishing.
