---
title: Papyrus docs
description: Start with papyrus-template, then edit config, Markdown, profile data, and assets.
slug: papyrus-docs
pubDatetime: 2026-07-01T09:00:00.000Z
category: Docs
license: CC-BY-4.0
tags:
  - papyrus
  - docs
  - astro
---

Papyrus is a reusable Astro theme for personal sites, technical notes, project
pages, and profile/CV pages. Start from `papyrus-template`, keep your content
in that site, and let `astro-papyrus` provide the shared routes and
components.

## Read first

- [Install and configure Papyrus](/collections/docs/install-configure-papyrus/) explains the template workflow.
- [Site config](/collections/docs/site-config/) shows what belongs in `papyrus.config.toml`.
- [Markdown authoring guide](/collections/docs/markdown-feature-sample/) shows posts, code blocks, callouts, media, and source actions.
- [Collections](/collections/docs/collections/) explains ordered docs or guide sections.
- [Profile and CV](/collections/docs/profile/) explains the TOML-driven profile, print routes, and exports.

## For developers

- [Papyrus package shape](/collections/docs/papyrus-package-shape/) explains what stays in the theme package and what stays in a site.
- [Feature map](/collections/docs/feature-map/) maps public routes to reusable features.
- [AI and mobile readiness](/collections/docs/ai-mobile/) covers search, generated metadata, mobile layout, and agent-readable files.
- [Deploy Papyrus](/collections/docs/deploy/) covers static hosting and production builds.

## What to edit

Most sites only need these files:

- `papyrus.config.toml` for site identity, navigation, theme, feature flags, and homepage counts
- `src/data/projects.toml` for project cards
- `src/content/posts/` for posts, docs, and collections
- `src/data/profile.toml` for profile and CV data
- `public/` for images, logos, favicons, and static files

The package repo has more files because it is the theme. A site made from
`papyrus-template` should stay much smaller.

Repo-only notes stay under `.agents/`; public docs live in this collection.
