# astro-theme-papyrus

Papyrus is a reusable Astro theme package for quiet blogs, documentation,
project pages, and profile/CV sites. It wraps
[`astro-pure`](https://www.npmjs.com/package/astro-pure), keeps Pure as the
foundation, and adds a Papyrus-like publishing surface: centered reading layouts,
post actions, tags, RSS, search, theme profiles, profile/CV pages, and generated
SEO/AI metadata.

Use Papyrus when you want a small content site that feels finished on day one:
readable posts, useful docs, searchable archives, social previews, RSS, and a
profile/CV flow, without copying a full theme into every repo. The consuming
site owns content, TOML config, and asset overrides; Papyrus owns reusable
components, injected template pages, styles, helpers, and build utilities.

## Demo

Run `make dev` and open `http://localhost:4326/`. For remote device testing,
run `make serve` and open `http://192.168.1.102:4326/`.
Public demo: `https://papyrus.marcelofelix.com/`

## Start a Site

Use the GitHub template, or scaffold from it with Astro. The template already
depends on the published package:

```sh
pnpm create astro@latest -- --template marcelofpfelix/papyrus-template
cd papyrus-template
pnpm install
pnpm dev
```

```json
"astro-theme-papyrus": "^0.2.0"
```

Consuming sites can also import the public API directly:

```astro
---
import { PapyrusBaseLayout } from "astro-theme-papyrus/components";
import { publishedPosts } from "astro-theme-papyrus/utils";
import "astro-theme-papyrus/papyrus.css";
---
```

## Features

- Pure-backed Astro package with Papyrus-style layouts and typography.
- Posts, tags, timeline archives, RSS, Pagefind search, sitemap, robots.txt, and helpful 404 suggestions.
- Markdown docs for Shiki/Pure-style code blocks, callouts, tables, diagrams, media, source links, copy actions, and share actions.
- SEO/social metadata, generated `llms.txt`, AI JSON indexes, and a static graph for content discovery.
- TOML-driven profile/CV pages with timeline, print, Markdown, and JSON exports.

## Architecture

Papyrus is the theme package. The recommended template imports the Papyrus
Astro integration, which injects the standard pages. Personal content,
analytics, private data, comments credentials, and deploy settings stay in the
consuming site.

`papyrus-template` is the recommended starting point. It keeps only
`papyrus.config.toml`, `src/data/profile.toml`, one example post, and asset
overrides. The standard pages are injected by `astro-theme-papyrus/integration`.

`marcelofelix` is the real showcase site. It keeps its own content and
configuration while importing Papyrus through the package or a local `file:`
dependency during theme development.

## Documentation

Open `/docs/` in the public Papyrus site. Package docs live at `/docs/`.
`/posts/install-configure-papyrus/` explains the template-first setup,
`/docs/feature-map/` links each public feature route, `/docs/code-demo/` and `/posts/markdown-feature-sample/` document authoring, and
`/docs/features/` covers feature flags, SEO, accessibility, search, sitemap,
robots.txt, and plugin-shaped extension points.

`docs/guide.md` contains development reference material, `.agents/status-roadmap.md`
points to the repo-only request audit, `scripts` contains package generators and user-facing CLI helpers, and
`.agents/scripts` contains repo-only verification helpers. README intentionally stays short; roadmap,
parity notes, and implementation audits belong in `.agents/`.
