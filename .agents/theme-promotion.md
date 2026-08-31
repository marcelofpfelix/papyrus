# Papyrus theme promotion packet

This is repo-only preparation for public theme directory submissions. Keep
account-specific work and submitted links in `.agents/request-audit.md` under
`PP-217`.

## Canonical demos

- Theme demo: `https://papyrus.marcelofelix.com`
- Template demo: `https://papyrus-template.marcelofelix.com`
- Current preview fallback: `https://0-2-2.papyrus-3md.pages.dev`
- Current template preview fallback: `https://0-2-2.papyrus-template.pages.dev`

Use the custom domains in public listings once DNS and Cloudflare Pages are
final. Keep preview URLs as temporary fallback links during review.

## Short listing copy

Papyrus is a Pure-backed Astro theme for personal sites that combine a blog,
docs, profile/CV pages, projects, search, RSS, SEO metadata, and generated
social cards without copying theme internals into every site.

## One-line copy

Pure-backed Astro theme for blogs, docs, projects, profiles, RSS, search, and
generated social metadata.

## Feature bullets

- Reusable Astro package with template-first setup.
- Inherited routes for home, posts, tags, search, collections, about, projects,
  profile, CV print views, RSS, robots, sitemap, and 404.
- Markdown support for Pure-style Shiki code blocks, callouts, task lists,
  tables, Mermaid, artifacts, image zoom, and source/copy/share actions.
- Pagefind search, tag pages, timeline, collections, and folder-backed docs.
- Profile and CV data from TOML with Markdown and JSON Resume-compatible
  exports.
- SEO, Open Graph, X/Twitter cards, generated social images, RSS, robots, and
  sitemap support.
- Optional comments, analytics, security.txt, image effects, QR/share actions,
  and theme profiles.

## Categories and tags

Suggested categories:

- Blog
- Documentation
- Portfolio
- Minimal
- Personal

Suggested tags:

- Astro
- theme
- blog
- docs
- portfolio
- CV
- RSS
- search
- Pagefind
- SEO
- Open Graph
- TypeScript
- Markdown
- Pure

## Links

- Package repository: `https://github.com/marcelofpfelix/papyrus`
- Template repository: `https://github.com/marcelofpfelix/papyrus-template`
- Package docs: `https://papyrus.marcelofelix.com/collections/docs/`
- Install guide: `https://papyrus.marcelofelix.com/collections/docs/install-configure-papyrus/`
- npm package: `https://www.npmjs.com/package/astro-papyrus`

## Install snippets

Recommended starter:

```sh
npm create astro@latest -- --template marcelofpfelix/papyrus-template
```

Package install after npm publication:

```sh
pnpm add astro-papyrus
```

Pinned GitHub dependency for pre-release testing:

```json
"astro-papyrus": "github:marcelofpfelix/papyrus#0.2.2"
```

## Directory submissions

- Astro official themes: `https://portal.astro.build/`
- AstroThemes.dev / Built At Lightspeed: `https://www.builtatlightspeed.com/submit/`
- Themefisher paid placement: `https://themefisher.com/advertisement`

## Manual checklist

- Confirm `papyrus.marcelofelix.com` points at the final Papyrus Pages project.
- Confirm `papyrus-template.marcelofelix.com` points at the final template
  Pages project.
- Set GitHub repo description, website URL, topics, and social preview image.
- Confirm npm package page is live or keep GitHub dependency wording visible.
- Submit to Astro with GitHub login.
- Submit the open-source repo to Built At Lightspeed.
- Decide later whether paid Themefisher placement is worth it.
- Record approved listing URLs back in `PP-217`.
