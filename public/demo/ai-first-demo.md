---
title: AI-first metadata
description: How Papyrus publishes llms.txt and llms-full.txt for agents and search tools.
slug: ai-first-metadata-demo
tags: [ai, metadata]
pubDatetime: 2026-07-01T12:00:00.000Z
license: CC-BY-4.0
---

# AI-first metadata

Papyrus can generate `llms.txt`, `llms-full.txt`, JSON indexes, and graph data
from the same public content set used by posts, tags, RSS, sitemap, and search.
That keeps readers, crawlers, and AI tools pointed at the same canonical pages.

`llms.txt` is the short map: routes, titles, descriptions, and source paths.
`llms-full.txt` is the longer corpus: the important public text from posts and
docs, plus code examples that help agents understand how to use the theme.

A consuming site runs the same command against its own content during build.

```sh
pnpm papyrus-llms src/content/posts public "$SITE_URL"
```

Use the deployed site origin for `SITE_URL` so generated links match RSS,
sitemap, robots.txt, canonical URLs, and social metadata.

When the site needs structured data for search or graph views, generate JSON
indexes from the same source set:

```sh
pnpm papyrus-ai-indexes src/content/posts public/ai "$SITE_URL" public/demo/site-data.json
```

Those outputs can power `/ai/graph.json`, static search records, related-content
tools, or external agents without giving them a different content model.

Keep private notes out of public collections. If a post needs a direct route but
should not appear in public discovery surfaces, mark it with `hidden: true` and
make sure feeds, sitemap, search, AI indexes, and graph generation all use the
same hidden-content rule.
