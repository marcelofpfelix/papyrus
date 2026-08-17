---
title: Site config
description: What papyrus.config.toml controls and how a site should edit it.
slug: site-config
pubDatetime: 2026-07-13T08:00:00.000Z
category: Docs
license: CC-BY-4.0
tags:
  - papyrus
  - config
  - start
---

`papyrus.config.toml` is the site control file. Edit this before copying theme
code into `src/pages` or local components.

Use it for site identity, navigation, social links, theme defaults, feature
flags, homepage behavior, and post-list behavior. Use frontmatter for per-post
metadata. Use `src/data/projects.toml` for project cards and
`src/data/profile.toml` for profile and CV data.

Papyrus generates a homepage social card from site title and description and a
post-specific social card for every Markdown post. `cover` is used as the visual
source inside the generated card when it is present. Use `ogSourceImage` when a
different post image should feed the generated card, or `ogImage` when a post
needs to point at a finished custom social image.

## What it controls

| Section | Purpose |
| --- | --- |
| `[site]` | Site title, description, URL, language, text direction, and timezone |
| `[brand]` | Header brand title, mark, and whether the text title is visible |
| `[theme]` | Default color profile and font profile |
| `[home]` | Homepage counts and layout-facing defaults |
| `[profile.images]` | Default visual treatment for profile images |
| `[markdown]` | Prose styling presets for links, headings, lists, quotes, tables, and inline code |
| `[pages.<name>]` | Optional text overrides for inherited page descriptions |
| `[verification]` and `[[verification_meta]]` | Search engine and service verification meta tags |
| `[analytics]` | Optional production-only analytics script |
| `[head]` | Constrained site-owned meta, link, and external script entries |
| `[security_txt]` | Optional vulnerability disclosure contact for `security.txt` |
| `[features]` | Optional UI, metadata, comments, search, graph, media, and profile features |
| `[post_card]` | Post-list tags, read time, fresh indicators, updated-date behavior, and default limit |
| `[[nav]]` | Header navigation links |
| `[[footer]]` | Footer text links |
| `[[social]]` | Footer social icon links |

Papyrus reads this file with `loadPapyrusConfig()`. If it is missing, package
defaults are used so a minimal template can still build.

## Minimal config

```toml title="papyrus.config.toml"
[site]
title = "My site"
home_title = "hello, world"
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

[home]
project_limit = 2

[profile.images]
effect = "none"

[[nav]]
href = "/posts/"
label = "Posts"

[[nav]]
href = "/profile/"
label = "Profile"
```

Keep the URL set to the deployed origin. The same value is used for canonical
metadata, RSS, sitemap, robots, social previews, and generated AI indexes.
Use `home_title` only when the homepage heading should be different from the
site title used by metadata, RSS, and shared layout chrome.

## Source links

Set the public GitHub source once so profile source links and post source
actions can point at the right repository:

```toml title="papyrus.config.toml"
[source]
repo = "site-owner/site-repo"
```

Papyrus uses that value for GitHub blob links and raw Markdown copy actions.
The repo can be written as `owner/repo`, a GitHub URL, or an SSH GitHub remote.
The branch is detected at build time on Cloudflare Pages, GitHub Actions,
Vercel, and Netlify. Set `branch = "main"` only when you want a fixed branch.

## Page descriptions

Inherited routes keep intro descriptions hidden by default. Add text only for
the pages where the site should show it:

```toml title="papyrus.config.toml"
[pages.posts]
description = "Latest notes and release updates."

[pages.projects]
description = false
```

TOML does not support `null`. Use `description = false` when a route should not
render a description or description meta tag. Omit the page entry to keep the
Papyrus default.

The inherited About page accepts longer paragraph content:

```toml title="papyrus.config.toml"
[pages.about]
description = "Short About page intro."
content = """
Hey, I am Marcelo.

I build and operate software around telecom, Linux, automation, and infrastructure.
This site is where I keep technical notes, project logs, and occasional side interests.
"""
```

Blank lines in `content` create separate paragraphs. The About page keeps this
body focused and adds a profile link at the end.

## Verification, analytics, and head entries

Keep verification and analytics disabled until the site has real provider
values. Papyrus keeps the Google shorthand, but the generic verification table
also covers Bing and other services:

```toml title="papyrus.config.toml"
[seo]
google_verification = "google-search-console-token"

[verification]
bing = "bing-webmaster-token"

[[verification_meta]]
name = "p:domain_verify"
content = "pinterest-token"
```

Analytics is opt-in and does not load during local development unless
`include_in_dev = true` is set. Supported providers are `ga4`, `plausible`,
`umami`, `goatcounter`, and `custom`:

```toml title="papyrus.config.toml"
[analytics]
enabled = true
provider = "plausible"
domain = "site.test"
```

Comments are also opt-in. Papyrus renders Giscus on post pages only when both
`[features].comments` and `[comments].enabled` are true and the Giscus repo and
category IDs are configured:

```toml title="papyrus.config.toml"
[features]
comments = true

[comments]
enabled = true
provider = "giscus"
repo = "site-owner/site-repo"
repo_id = "R_..."
category = "Announcements"
category_id = "DIC_..."
theme = "preferred_color_scheme"
light_theme = "light"
dark_theme = "dark_dimmed"
```

Use a GitHub Discussions category with the `Announcements` format when possible.
That lets Giscus create post discussions while preventing normal repository
visitors from manually opening unrelated discussions in the comments category.
Papyrus updates Giscus when the site switches light/dark mode. `light_theme` and
`dark_theme` can be built-in Giscus theme names or full custom CSS URLs.

Keep custom Giscus CSS on a URL you control. Giscus loads that stylesheet inside
its iframe, so avoid example URLs or third-party CSS you do not trust.

`mapping = "pathname"` is the recommended default. If you use
`mapping = "specific"`, set `term`; if you use `mapping = "number"`, set
`number`. Papyrus also accepts `description` and `back_link` for the matching
advanced Giscus fields.

For stricter control, add `giscus.json` to the repository that owns the
Discussions. Use it for allowed origins and the default comment order:

```json title="giscus.json"
{
  "origins": ["https://site.test"],
  "originsRegex": ["http://localhost:[0-9]+"],
  "defaultCommentOrder": "newest"
}
```

Use `[head]` for small, typed additions that belong to the site. It accepts
meta tags, link tags, and external scripts. It does not accept raw HTML strings.

```toml title="papyrus.config.toml"
[[head.meta]]
name = "fediverse:creator"
content = "@site@example.social"

[[head.link]]
rel = "me"
href = "https://example.social/@site"

[[head.script]]
src = "https://example.test/script.js"
defer = true
```

Footer links use `[[footer]]` for normal text links and `[[social]]` for icon
links. Add provider widgets as normal links when possible; only use `[head]`
when a provider really needs a document-level tag or script.

## Security.txt

Configure `security.txt` only when the site has a public vulnerability
disclosure contact. With no contact, Papyrus returns a 404 for
`/.well-known/security.txt` and `/security.txt` instead of publishing a
placeholder file.

```toml title="papyrus.config.toml"
[security_txt]
contact = ["mailto:security@example.com"]
preferred_languages = "en, pt"
policy = "https://site.test/security"
```

## Feature flags

Feature flags are booleans. Set only the flags you want to override:

```toml title="papyrus.config.toml"
[features]
search = true
comments = false
postStats = false
graph = false
```

Disable features that need external setup. For example, turn off comments and
remote post stats until the site has configured those services.

## Profile images

Use `src/data/profile.toml` for profile content and asset paths. Use
`papyrus.config.toml` for the default image treatment:

```toml title="papyrus.config.toml"
[profile.images]
effect = "tritone"
```

The default is `none`. The configured effect applies to profile-page images such
as the avatar and company or education logos. `duotone` uses the current
background and foreground colors. `tritone` also uses the accent color. `dither`
and `dithernoise` generate masks at build time and color them with theme-aware
ink. A profile data file can still override the default for its own avatar with
`avatar_effect`.

Profile-local tab visibility belongs in `src/data/profile.toml` under
`[user.profile_tabs]`, with keys such as `timeline = false` or
`projects = false`.

## Markdown styling

Markdown styling uses named presets instead of custom per-element colors. The
presets map to the active theme tokens, so they keep working when the reader
switches color mode or theme profile.

```toml title="papyrus.config.toml"
[markdown]
link_style = "accent-hover-underline"
heading_style = "plain"
marker_style = "accent"
blockquote_style = "accent-bar"
table_style = "horizontal"
table_header_style = "muted"
inline_code_style = "panel"
```

Supported values:

| Option | Values |
| --- | --- |
| `link_style` | `accent`, `underline`, `accent-underline`, `accent-hover-underline` |
| `heading_style` | `plain`, `accent`, `muted-accent` |
| `marker_style` | `plain`, `muted`, `accent` |
| `blockquote_style` | `muted-bar`, `accent-bar`, `panel` |
| `table_style` | `none`, `horizontal`, `grid` |
| `table_header_style` | `plain`, `muted`, `panel` |
| `inline_code_style` | `plain`, `panel`, `accent-soft` |

## Post-list defaults

Post-card options apply to normal post lists such as home and `/posts/`:

```toml title="papyrus.config.toml"
[post_card]
tags = false
read_time = false
fresh_indicators = true
fresh_indicator_text = true
updated_date_only = true
limit = 20
```

When `tags = false`, the first tag can still be shown as plain context in the
date line. When `updated_date_only = true`, list cards show the update date for
updated posts while the post page can still show both created and updated dates.

## Projects and links

Use repeated TOML tables for navigation, footer links, and social links in
`papyrus.config.toml`:

```toml title="papyrus.config.toml"
[[footer]]
href = "/collections/docs/"
label = "Docs"

[[social]]
href = "https://github.com/site-owner"
label = "GitHub"
icon = "github"
```

Keep project cards in `src/data/projects.toml`:

```toml title="src/data/projects.toml"
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
