---
title: Theme specification
description: Public behavior contract for Papyrus features, configuration, posts, search, profile, SEO, accessibility, and quality gates.
slug: theme-spec
pubDatetime: 2026-07-14T08:00:00.000Z
category: Docs
hidden: true
tags:
  - papyrus
  - docs
  - reference
---

This document defines the public behavior contract for `papyrus`.

It is intended for two audiences:

- maintainers reviewing whether the implementation still matches the agreed
  theme behavior
- users creating a site from the theme and deciding which features to enable,
  customize, or replace

The request audit remains the internal implementation tracker. This file is the
public-facing product specification.

## Goals

`papyrus` is a reusable Astro theme package for content-heavy personal sites,
blogs, profiles, and technical notes.

The theme MUST:

- stay a thin wrapper around Pure where Pure already provides a strong pattern
- keep site repos focused on content, configuration, and small page
  composition
- provide reusable layout, post, search, RSS, profile, CV, markdown, and SEO
  behavior from the package
- remain fast, accessible, keyboard-friendly, SEO-friendly, and suitable for
  static hosting
- support generated machine-readable artifacts for search engines, AI tools,
  feed readers, and source reviewers

The theme SHOULD:

- prefer existing upstream behavior from Pure before inventing a local version
- prefer simple static output over client-heavy runtime code
- keep public UI calm, readable, and compact
- avoid visual borders and heavy card nesting unless a component genuinely needs
  a framed surface
- make configuration explicit instead of hardcoding site-specific behavior

## Package boundary

The package owns:

- base and post layouts
- shared post-list components
- post metadata, source, copy, share, TOC, and adjacent-post controls
- profile and CV components
- markdown rendering behavior
- theme tokens and theme/font controls
- search, tag, archive, RSS, sitemap, robots, and AI index helpers
- demo pages and reusable documentation

Site repos own:

- content files
- site identity, social links, profile data, and project data
- deployment configuration
- site-specific page composition
- private or production-only data

Shared behavior MUST move into `papyrus` when more than one site repo would
otherwise copy it.

## Configuration

Site behavior MUST be configurable through site-owned config/data rather than
hardcoded inside components.

The supported post-card configuration includes:

- `tags`: whether the post list shows clickable tag rows
- `read_time`: whether the post list shows reading time
- `fresh_indicators`: whether new or updated posts show an indicator
- `fresh_indicator_text`: whether the new-post indicator includes a text label
- `updated_date_only`: whether list cards prefer the updated date over the
  original published date

Home and `/posts/` MUST use the same post-list configuration path so those pages
do not drift.

The post list MUST support a configurable default count. The package default is
20 posts for `/posts/`.

Back links and other post controls MUST be configurable. A site MAY
disable the post back link.

Google Site Verification MUST be configurable from site config and rendered as a
standard `google-site-verification` meta tag when provided.

Base-path and subdirectory deployments MUST be supported. Internal links and
asset links SHOULD go through shared helpers so a site can deploy under a path
such as `/astro-papyrus` without manual link rewrites.

## Home page and posts index

Home and `/posts/` MUST render posts through the same shared post-list
component. Differences between the two pages should be limited to input data,
limit, heading, and local page composition.

The post list MUST support:

- list view
- compact view
- card view
- pinned posts
- optional cover images
- title
- short description
- date metadata
- optional read-time metadata
- optional tags
- optional first-tag display when full tag rows are hidden
- optional new indicator with text
- accent-colored date metadata for recently updated posts

Pinned posts MUST be visually distinguishable from normal posts. The pinned
state should use a subtle background related to project-card panels and an
icon without requiring label text.

When `post_card.tags` is false:

- home and `/posts/` MUST both hide the normal tag row
- the first tag MAY appear inline with the date as plain, non-clickable context
- the behavior MUST be consistent between home and `/posts/`

When `post_card.read_time` is false:

- reading time MUST be hidden from post-list cards
- the post page MAY still show reading time if the post-page metadata feature is
  enabled

Dates in list and post metadata MUST use the compact public date style:

- current-year dates omit the year
- non-current-year dates include the year first
- the month uses the short English month name
- examples: `Jul 09`, `2025 Jul 09`

Reading time labels MUST use compact text such as `1 min`, not `1 min read`.

The `/posts/` page MUST expose icon links for related post browsing modes:

- timeline
- tags
- archive, when hidden posts exist
- RSS, using an icon next to the posts heading or equivalent title area

These icon links SHOULD be borderless, aligned to the right where the layout
allows, and use the same icon set and visual treatment across site repos.

The `/posts/` page SHOULD avoid exposing multiple RSS examples in page chrome.
Specialized RSS feeds, such as tag-specific feeds or changelog feeds, should be
documented inside a demo post instead.

## Timeline and archive

The timeline MUST group posts by year.

By default it SHOULD show the current year and previous year expanded, while
older years are collapsed. Future implementations MAY lazy-load older year
groups when the number of posts makes the full timeline expensive.

The archive view MUST expose hidden posts when hidden posts exist. Hidden posts
are defined by post frontmatter, not by file location.

Archive links SHOULD be presented as an icon action from `/posts/`, not as a
primary navigation item.

## Tag and search behavior

Tags MUST support dedicated `/tag/<tag>/` pages for public post browsing.

Search MUST support text search and tag filtering. A search URL MAY use query
parameters such as `?tag=astro` for filtered search results.

Tag links in public post metadata SHOULD point to tag pages when the tag page
exists. Tags that do not have a public tag page, such as note-only tags, MAY
fall back to search-filter URLs.

Nested post folders SHOULD contribute automatic folder tags. Explicit
frontmatter tags remain supported, and duplicates MUST be removed.

Pagefind integration MUST be complete for searchable public pages. Pages marked
`noindex` or otherwise excluded from public indexing SHOULD not be indexed by
Pagefind.

## Post page

The post page header MUST prioritize reading:

- title centered and larger than surrounding controls
- short description centered and smaller than the title
- sufficient vertical spacing between the title block and the post body
- optional cover image above the post when configured

The top of the post MAY include a configurable back link. When enabled, the link
SHOULD be named `Back`, use a back arrow, and avoid colored button backgrounds.

Post metadata, tags, source/copy/share actions, and top-link controls SHOULD
live near the bottom of the article rather than above the reading content.

Immediately after article content ends, the page SHOULD show:

- a divider or line break
- a `Back` link to the post index, using a back arrow and text
- source/copy/share controls on the same line when space allows

The source/copy/share controls MUST:

- use consistent icon and text labels: `Copy`, `Source`, `Share`
- use a copy icon for the copy action
- avoid excess spacing between icon and text
- avoid background-color treatments that do not match other icon links
- use the same visual style across all posts

The share action MUST use the Web Share API when available. It MUST fall back to
the existing copy-link behavior when native sharing is unavailable or cannot
share the current page.

The source action MAY link to a GitHub source URL, JSON source, TOML source, or
Markdown source when configured.

The copy action for post source MUST copy Markdown content when Markdown source
is available.

Post tags MUST appear near the bottom of the post. Tag links SHOULD use
`/tag/<tag>/` where supported.

The date line MUST stay close to the tags/actions area without creating a large
vertical gap.

The previous and next post links MUST be adjacent navigation, not primary page
actions. On mobile, previous MUST align left and next MUST align right. The
oldest and newest posts MUST still render the appropriate one-sided adjacent
link when one adjacent post exists.

Adjacent post data SHOULD be computed once in `getStaticPaths` and passed into
the post layout. A post page SHOULD NOT fetch every post again just to compute
previous and next links.

Post pages SHOULD expose:

- a floating table-of-contents button when headings exist
- a back-to-top button on desktop, aligned with the metadata/tools row where
  appropriate
- a top progress bar on mobile while scrolling through a post

The table-of-contents control MUST not wrap the `On this page` label on desktop.
On mobile, the table-of-contents and back-to-top controls MUST use matching
touch-target size and visual style.

The table-of-contents open state SHOULD feel close to Pure: large enough to be
usable, but not so large that it consumes most of the page.

## Markdown and prose

Markdown rendering MUST support:

- Shiki/Pure-style code blocks
- titles and language labels for code blocks
- line numbers where configured
- diff and highlight notation
- code-copy buttons using Pure behavior
- Mermaid fenced blocks rendered as diagrams
- task lists
- readable tables without boxed borders
- image and SVG zoom behavior
- artifact links for supported external files
- GitHub-style alert syntax through the maintained callout pipeline

GitHub-style alert/callout colors MUST distinguish variants:

- tip: green
- important: blue
- warning: amber
- caution: red

Important and caution callouts MUST not reuse the exact same icon. Warning and
caution MUST also be visually distinguishable.

Unsupported markdown features SHOULD remain visibly documented in demos instead
of silently pretending to work.

## Theme and visual system

Theme profiles MUST be token-driven CSS files with light and dark variants.

Every theme profile MUST define:

- `--papyrus-bg`
- `--papyrus-fg`
- `--papyrus-muted`
- `--papyrus-panel`
- `--papyrus-border`
- `--papyrus-accent`
- `--papyrus-code-bg`
- `--papyrus-code-fg`
- `--papyrus-theme-color`
- font tokens

The default package theme MAY differ from a site's default theme.
Site repos MUST be able to set their own default theme profile and font
profile.

Footer controls MUST expose:

- mode control
- theme profile control
- font profile control

Theme controls SHOULD be icon-first, compact, keyboard-accessible, and use
dropdowns that open inside the viewport.

The Gruvbox dark profile MUST use the updated accessible colors:

- `#f5edca` instead of the old `#d4be98`
- `#c4bda1` instead of the old `#928374`
- `#dfb778` instead of the old `#d8a657`

Icon links such as timeline, tags, archive, source, copy, share, and RSS SHOULD
be borderless and avoid unnecessary background colors.

Post cards SHOULD have no borders. Pinned post cards SHOULD keep a distinct
surface background.

Links in dense text areas SHOULD remain accessible without making the layout
visually noisy. Bolder text and hover underlines are preferred over permanent
underlines when contrast and affordance remain acceptable.

## Profile and CV

The profile system MUST use data-driven content. Links, emails, social accounts,
location, role, title, sections, projects, and timelines MUST come from TOML,
JSON, Astro content, or another site-owned data source, not from hardcoded
component values.

TOML is the preferred source format for bundled demos and simple consuming-site
configuration.

The normalized profile/CV model MUST support:

- name
- title or role
- photo/avatar
- location and other personal information
- email parts
- social links
- section groups
- professional experience
- education and other CV sections
- profile projects
- printable pages

Social links SHOULD use the same icon source as other theme icons where
possible. Social labels should display the username or handle when available,
not only the network name.

Email display MUST avoid publishing a plain email address in the static HTML
when the site chooses obfuscation. The supported public-data strategy is to
store email parts such as user and server separately, optionally render a visual
separator such as an `@` symbol, and assemble the real address only when needed.
The goal is to avoid common low-effort scraping while accepting that determined
parsers can reconstruct public parts.

When printing or exporting a CV, the generated print view SHOULD be able to
render the real email address if the site has enough public data to assemble it.

The web profile page SHOULD center the photo, name, and title inside the profile
summary box.

The print CV view MUST be papyrus-like, centered, black-and-white friendly, and
easy for recruiting software to parse. It SHOULD avoid decorative graphics,
complex columns, low-contrast text, and link styling that makes the print output
look uneven.

The print view SHOULD:

- use primary color for icons
- keep left and right side treatment visually similar
- remove unnecessary blue/bold link styling from usernames
- keep social and personal-info spacing compact
- provide print/save, share, copy, and source actions with icon styling
- support JSON, TOML, and Markdown source links when configured

Age and professional-experience duration calculations MUST be derived from data,
not hardcoded. Calculations SHOULD follow the jekyllcv-style behavior used by
the demo comparison.

The package SHOULD provide a way to generate Markdown and JSON versions of the
CV into the repository. This can be wired into a commit hook by the consuming
site, but the package should not mutate files during a normal build unless the
site explicitly opts in.

## SEO, sharing, and indexing

The theme MUST be SEO-friendly by default.

Every public page SHOULD provide:

- title
- description
- canonical URL
- robots metadata when configured
- Open Graph metadata
- social sharing metadata
- heading hierarchy without skipped levels
- semantic HTML landmarks

Pages shared to social media SHOULD render useful previews through properly
configured Open Graph and social metadata, including preview images when
available.

Cover images and generated preview images SHOULD be supported for posts and
profile pages. Missing preview images should be treated as a regression for
public pages that advertise share previews.

The sitemap MUST be generated dynamically so every public page, post, tag page,
category-like page, and generated route can be included without manual updates.

`robots.txt` MUST be generated dynamically. It MUST include the sitemap URL and
allow sites to control search-engine indexing and crawling policy from config.

The theme SHOULD expose machine-readable artifacts for AI and search tooling,
including:

- `llms.txt`
- JSON indexes
- search indexes
- graph data
- stable canonical IDs
- post source links
- citation/source actions

## RSS

The theme MUST provide a main RSS feed.

The theme MUST support multiple RSS feeds, including tag-specific feeds. A site
MAY expose custom feeds such as a changelog feed.

RSS examples SHOULD be documented in content rather than overloading the main
posts-page UI.

Users who want to subscribe to only some tags SHOULD be able to use tag-specific
feed URLs.

## 404 behavior

The theme MUST provide a real 404 page, not a blunt server error page.

The 404 page SHOULD:

- explain that the page was not found
- offer search
- automatically suggest similar public pages based on title, path, description,
  and tags
- link to common recovery destinations such as posts, search, docs, projects,
  or profile when available

The 404 page MUST work as a static route for static hosting.

## Accessibility

The theme MUST be fully keyboard navigable.

Interactive controls MUST have:

- reachable focus states
- accessible names
- label-in-name alignment where applicable
- useful `aria` attributes where native HTML is not enough
- touch targets suitable for mobile

Images MUST have meaningful `alt` text or be marked decorative when appropriate.

Headings MUST not skip levels in normal page flow.

Tables, callouts, forms, search, TOC, theme controls, copy buttons, share
buttons, and CV controls MUST remain understandable without a mouse.

The theme SHOULD preserve Lighthouse accessibility score 100 unless a
documented, reviewed exception is accepted.

## Performance and quality gates

The theme SHOULD keep Lighthouse scores at 100 for performance, accessibility,
best practices, SEO, and agentic browsing on all generated public pages.

Lighthouse is intentionally slow and SHOULD be run before commits or release
review, not after every small edit.

The default Lighthouse minimum score is 100. Route exclusions MUST be explicit
and justified.

Focused validation SHOULD be used during development:

- docs checks for documentation changes
- content checks for post/date/tag/routing changes
- browser checks for UI behavior
- responsive checks for layout and touch-target changes
- Lighthouse before commits or release gates

No feature should be marked complete only because the site builds. Visual
behavior, clipboard behavior, Mermaid rendering, print/A4 layout, and responsive
layout require targeted evidence.

## Public demo expectations

The demo site MUST illustrate the enabled package features using safe example
content.

The public demo SHOULD include examples for:

- markdown/code/callout behavior
- posts, tags, timeline, archive, and search
- profile and CV data sources
- print CV routes
- RSS and tag-specific RSS
- SEO and metadata behavior
- 404 suggestions
- theme and font controls
- AI/search artifacts

Internal request trackers and status audits SHOULD stay repository-only unless
explicitly published.

## Review checklist

Use this checklist when reviewing whether code still respects the spec:

- Home and `/posts/` use the same post-list component and config path.
- Post list cards honor tag, read-time, fresh-indicator, pinned, and date
  configuration consistently.
- Post pages keep reading content first and move metadata/actions/tags toward
  the bottom.
- Share uses native Web Share when available and copy-link fallback otherwise.
- Source/copy/share controls use consistent icon styling and labels.
- Previous and next links are ordered correctly and align left/right on mobile.
- Tags route to `/tag/<tag>/` where supported.
- Search and Pagefind indexes include the expected public pages.
- Hidden posts are reachable through archive behavior when configured.
- 404 is a real page with search and suggestions.
- Sitemap and robots are generated and include canonical sitemap references.
- SEO/social metadata exists on public pages.
- Markdown callouts have distinct colors and icons.
- Theme tokens, including Gruvbox dark colors, match the spec.
- Profile and CV pages are data-driven and do not hardcode personal links.
- Obfuscated email output avoids plain static email HTML when configured.
- Print CV remains papyrus-like, readable, compact, and parser-friendly.
- Accessibility and keyboard behavior remain intact.
- Lighthouse minimum remains 100 before commit/release gates.
