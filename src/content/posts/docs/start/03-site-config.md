---
title: Site config
description: What papyrus.config.toml controls and how a site should edit it.
slug: site-config
pubDatetime: 2026-07-13T08:00:00.000Z
category: Docs
tags:
  - papyrus
  - config
  - start
---

`papyrus.config.toml` is the site-level control file. It keeps the consuming
site editable without copying theme code into `src/pages` or component files.

Use it for public site identity, navigation, social links, project cards, theme
defaults, feature flags, and post-list behavior. Use frontmatter for per-post
metadata, and use `src/data/profile.toml` for profile and CV data.

## What it controls

| Section | Purpose |
| --- | --- |
| `[site]` | Site title, description, URL, language, text direction, and timezone |
| `[brand]` | Header brand title, mark, and whether the text title is visible |
| `[theme]` | Default color profile and font profile |
| `[features]` | Optional UI, metadata, comments, search, graph, media, and profile features |
| `[post_card]` | Post-list tags, read time, fresh indicators, updated-date behavior, and default limit |
| `[[nav]]` | Header navigation links |
| `[[social]]` | Social links used by header/footer surfaces |
| `[[project]]` | Project cards shown by the project list components |

Papyrus reads this file with `loadPapyrusConfig()`. If the file is missing,
Papyrus falls back to package defaults so a minimal template can still build.

## Minimal config

```toml title="papyrus.config.toml"
[site]
title = "My site"
description = "Notes, projects, and profile."
url = "https://site.test"
lang = "en"
dir = "ltr"
timezone = "Europe/Lisbon"

[brand]
title = "My site"
mark = "twinkle"
show_title = true

[theme]
profile = "everforest"
font_profile = "readable"

[[nav]]
href = "/posts/"
label = "Posts"

[[nav]]
href = "/profile/"
label = "Profile"
```

Keep the URL set to the deployed origin. The same value is used for canonical
metadata, RSS, sitemap, robots, social previews, and generated AI indexes.

## Feature flags

Feature flags are booleans. Set only the flags you want to override:

```toml title="papyrus.config.toml"
[features]
search = true
comments = false
postStats = false
graph = false
```

The common rule is to disable features that need external setup. For example,
turn off comments and remote post stats until the consuming site has configured
those services.

## Post-list defaults

Post-card options apply to normal post lists such as home and `/posts/`:

```toml title="papyrus.config.toml"
[post_card]
tags = false
read_time = false
fresh_indicators = true
fresh_indicator_text = false
updated_date_only = true
limit = 20
```

When `tags = false`, the first tag can still be shown as plain context in the
date line. When `updated_date_only = true`, list cards show the update date for
updated posts while the post page can still show both created and updated dates.

## Projects and links

Use repeated TOML tables for navigation, social links, and projects:

```toml title="papyrus.config.toml"
[[social]]
href = "https://github.com/site-owner"
label = "GitHub"
icon = "github"

[[project]]
title = "My project"
description = "A short public project summary."
href = "/projects/my-project/"
image = "/images/project.svg"
repo = "https://github.com/site-owner/project"
pinned = true
status = "active"

  [[project.links]]
  href = "https://github.com/site-owner/project"
  label = "repo"
  text = "site-owner/project"
```

Use `public/` for images referenced by config. Use `src/` for content and data
that Astro should parse or transform.

## Related files

- `astro.config.mjs` wires the Papyrus integration and loads this config.
- `src/content.config.ts` exports the Papyrus content collection.
- `src/data/profile.toml` owns profile, CV, timeline, print, and source export
  data.
- `src/content/posts/**` owns posts, docs, and collection content.
