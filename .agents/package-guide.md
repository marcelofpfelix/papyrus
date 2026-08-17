# Papyrus package guide

## Package goal

`papyrus` is a reusable Astro theme package. It should stay a thin wrapper around Pure while providing the parts consuming sites would otherwise copy into every repo: layouts, components, theme tokens, markdown behavior, scripts, and docs.

Site repos should keep content, site config, deployment config, and small page composition. Shared behavior belongs in `papyrus`.

## Local demos

```sh
make dev
```

`make dev` restarts the Astro dev daemon and serves `http://localhost:4326/`
for editing with HMR.

For a LAN-safe static preview:

```sh
make serve
```

Default LAN preview URL: `http://192.168.1.102:4326/`.

Use consuming-site smoke tests only when a package change affects the exported
API or injected template routes.

## Public exports

Main imports:

- `astro-papyrus/components`
- `astro-papyrus/PapyrusBaseLayout.astro`
- `astro-papyrus/PapyrusPostLayout.astro`
- `astro-papyrus/PapyrusHeader.astro`
- `astro-papyrus/PapyrusFooter.astro`
- `astro-papyrus/PapyrusPostList.astro`
- `astro-papyrus/PapyrusCvProfile.astro`
- `astro-papyrus/PapyrusCvHero.astro`
- `astro-papyrus/PapyrusCvLinks.astro`
- `astro-papyrus/PapyrusCvSections.astro`
- `astro-papyrus/PapyrusCvExportActions.astro`
- `astro-papyrus/PapyrusCvA4Page.astro`
- `astro-papyrus/PapyrusJekyllCvPage.astro`
- `astro-papyrus/PapyrusAiMetadata.astro`
- `astro-papyrus/runtime/PapyrusBackToTopRuntime.astro`
- `astro-papyrus/runtime/PapyrusMediaRuntime.astro`
- `astro-papyrus/runtime/PapyrusPostActionsRuntime.astro`
- `astro-papyrus/papyrus.css`
- `astro-papyrus/themes/pure.css`
- `astro-papyrus/themes/catppuccin.css`
- `astro-papyrus/themes/tokyo-night.css`
- `astro-papyrus/themes/kanagawa.css`
- `astro-papyrus/themes/rose-pine.css`
- `astro-papyrus/themes/everforest.css`
- `astro-papyrus/themes/dracula.css`
- `astro-papyrus/themes/gruvbox.css`
- `astro-papyrus/themes/nord.css`
- `astro-papyrus/template/profile`
- `astro-papyrus/utils`
- `astro-papyrus/pure`
- `astro-papyrus/pure/user`
- `astro-papyrus/pure/advanced`
- `astro-papyrus/pure/pages`
- `astro-papyrus/pure/basic`
- `astro-papyrus/pure/utils`
- `astro-papyrus/pure/libs`

Useful utility exports:

- `normalizeJekyllCvUser`
- `cvToMarkdown`
- `cvToJsonResume`
- `resolvePapyrusFeatures`
- `defaultPapyrusFeatures`

Markdown helpers:

- `astro-papyrus/remark-artifact-links`
- `astro-papyrus/remark-mermaid-blocks`
- `astro-papyrus/rehype-task-list-labels`

CLI helpers:

- `papyrus-logo`
- `papyrus-manifest`
- `papyrus-content`
- `papyrus-post-date`
- `papyrus-compress`
- `papyrus-cover`
- `papyrus-card-cover`
- `papyrus-llms`
- `papyrus-ai-indexes`
- `papyrus-ai-validate`
- `papyrus-tag-rss`
- `papyrus-artifacts`

## Reference order

When implementing a new feature, check references in this order:

1. Starlight
2. AstroWind
3. AstroPapyrus
4. Cactus

Pure is also the first implementation reference when a requested behavior
already exists there. Keep the feature-by-feature audit in
`.agents/pure-parity.md` current before claiming Pure parity in
`.agents/request-audit.md`.

For Starlight-specific checks, keep `.agents/starlight-comparison.md` current. It
records public Starlight component/plugin/sidebar/override references and maps
them to papyrus request rows without making Starlight a runtime dependency.

## Theme system

Theme profiles live in `src/styles/themes/`. Each profile must define a light and dark block.

Required profile shape:

- light block: `:root[data-papyrus-theme="<name>"]`
- dark block: `:root[data-papyrus-theme="<name>"].dark`
- color tokens: `--papyrus-bg`, `--papyrus-fg`, `--papyrus-muted`, `--papyrus-panel`, `--papyrus-border`, `--papyrus-accent`, `--papyrus-code-bg`, `--papyrus-code-fg`, `--papyrus-theme-color`
- font tokens: `--papyrus-font-sans`, `--papyrus-font-mono`

Current profiles:

- `pure`
- `catppuccin`
- `tokyo-night`
- `kanagawa`
- `rose-pine`
- `everforest`
- `dracula`
- `gruvbox`
- `nord`

Theme authoring workflow:

```sh
pnpm run theme -- list
pnpm run theme -- validate
pnpm run theme -- show catppuccin
```

The `papyrus-theme` script only discovers and validates files in
`src/styles/themes/`; it does not carry palette color values. Add or update
colors in the profile CSS file, then run `make theme` or `make verify-theme`.

Defaults:

- mode: `system`
- theme: `catppuccin`
- font: `code`

Font profiles are independent from color profiles:

- `theme`
- `readable`
- `code`

The Dyslexic option is not enabled because the package does not ship that font and should not imply it works.

## Layout and navigation

Implemented behavior:

- Header hides while scrolling down and reappears when scrolling up.
- Header background uses `var(--papyrus-bg)`.
- Logo is the home link.
- No Home nav tab is needed.
- Theme mode/profile/font controls live in the footer.
- Footer dropdowns open upward.
- Social links and RSS are footer icons.
- Powered-by text is limited to linked `papyrus` and linked Astro.

## Posts, tags, and home

`PapyrusPostList` supports three views:

- `list`
- `compact`
- `cards`

Post utilities support:

- nested source folders
- automatic folder tags
- explicit frontmatter tags
- stable `slug:` frontmatter
- pinned posts
- published-post filtering
- adjacent previous/next posts
- reading-time strings

Tags render with `#`, are clickable, route to search/tag filtering, and are borderless by default.

## Content model

Content stays in the consuming site. The theme only provides helpers and rendering components.

Nested post example:

```text
src/content/posts/telecom/sip-routing/reinvite.md
```

`postTags(post)` adds source folders as automatic tags:

```text
telecom
sip-routing
```

Explicit frontmatter tags are still supported and duplicates are removed.

Stable URL example:

```yaml
---
title: SIP re-INVITE notes
slug: sip-reinvite-notes
tags:
  - sip
---
```

Stable route policy:

- Prefer explicit `slug:` frontmatter for public posts. This keeps the URL
  stable when the source file moves between folders for Obsidian-style
  organization.
- If no slug is set, `postSlug()` falls back to the source path without the
  `.md` or `.mdx` extension. This is useful for drafts and private notes, but
  public links should not rely on folder paths unless the folder path is itself
  part of the permalink contract.
- `postHref(post)` renders posts under `/posts/<slug>/` by default. Consuming
  sites can pass a different base path, but should keep old slugs redirected if
  they change the public route shape.
- Prefer normal Markdown links with stable slugs for published posts, for
  example `[SIP re-INVITE notes](/posts/sip-reinvite-notes/)`.

Backlink and Obsidian-style linking plan:

- Keep content source paths and explicit slugs in generated AI/search indexes so
  a future backlink job can map `[[wiki-style links]]`, Markdown links, and
  related-post edges back to a stable post id.
- Do not rewrite `[[wiki-style links]]` in the theme package yet. That should be
  a dedicated remark/plugin feature with tests for ambiguous titles, duplicate
  filenames, renamed slugs, and private notes.
- Graph view can use current tag/source metadata today. Node focus, direct
  neighbor dimming, and focused connection details are implemented in the demo.
  Backlink parsing and richer force-layout behavior remain planned features,
  not verified behavior.

Folder metadata for generated outlines can use `index.md`, `index.mdx`, `_index.md`, `_index.mdx`, `README.md`, or `README.mdx`.

Supported metadata fields:

```yaml
---
sectionTitle: Telecom notes
description: SIP, RTP, routing, and operations notes.
---
```

`navTitle`, `title`, or `label` can be used instead of `sectionTitle`.

Generate a docs-style outline from a site repo:

```sh
pnpm papyrus-content src/content/posts docs/content-structure.md
```

## Markdown surface

The theme owns markdown presentation:

- plain Astro/Shiki code blocks
- Obsidian-style callouts through `rehype-callouts`
- blockquotes
- tables
- task lists
- Mermaid rendering
- artifact links
- TOC
- callout styles

Use the exported markdown helpers from a site Astro config:

```js
import remarkArtifactLinks from "astro-papyrus/remark-artifact-links";
import remarkMermaidBlocks from "astro-papyrus/remark-mermaid-blocks";
import rehypeTaskListLabels from "astro-papyrus/rehype-task-list-labels";
import rehypeCallouts from "rehype-callouts";
import {
  addCollapse,
  addCopyButton,
  addLanguage,
  addTitle,
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerRemoveNotationEscape,
  updateStyle,
} from "astro-papyrus/shiki";
```

Configure Astro/Shiki with the Pure transformer order:

```js
export default defineConfig({
  markdown: {
    shikiConfig: {
      theme: "css-variables",
      transformers: [
        transformerNotationDiff(),
        transformerNotationHighlight(),
        transformerRemoveNotationEscape(),
        updateStyle(),
        addTitle(),
        addLanguage(),
        addCopyButton(2000),
        addCollapse(15),
      ],
    },
  },
});
```

Current code-block status:

- Pure Shiki behavior: copied from the upstream Pure app/docs source, using Astro's `css-variables` Shiki theme plus Pure's transformer order for diff, highlight, remove-escape, title, language, copy, and collapse.
- Diff and highlight notation: supported with Pure's `[!code ++]`, `[!code --]`, and `[!code highlight]` markers.
- Code-copy buttons: generated by Pure's copied Shiki transformer with `navigator.clipboard.writeText(this.dataset.code)` and the `.copied` state. There is no Papyrus hidden-textarea fallback or prompt-stripping layer.
- Line numbers and language labels: rendered through the copied Pure CSS structure and Papyrus token colors.

Use this fence shape:

````md
```rust
fn main() {
    println!("papyrus");
}
```
````

The package demo includes `/collections/docs/code-demo/`, which exercises Rust titles, line
numbers, language labels, Pure copy buttons, diff notation, highlight notation,
console fences, and collapsed long code through the current Astro markdown
pipeline. Browser behavior and visual quality are tracked separately in
`.agents/request-audit.md`.

## Runtime modules

`PapyrusPostLayout` composes small runtime components instead of keeping one large
post script:

- `PapyrusPostActionsRuntime`: share, copy Markdown, and copy citation buttons.
- `PapyrusMediaRuntime`: optional artifact hydration, Mermaid rendering, and
  image/SVG zoom.
- `PapyrusBackToTopRuntime`: scroll-aware back-to-top button.

The layout wires these through feature flags. Use `features.sourceActions`,
`features.share`, `features.artifactLinks`,
`features.mermaid`, `features.imageZoom`, and `features.backToTop` to disable
specific runtime behavior.

## AI metadata and source actions

`PapyrusPostLayout` can emit machine-readable metadata and copy actions when the
page provides the needed URLs:

```astro
<PapyrusPostLayout
  title="My post"
  siteTitle="My site"
  canonicalUrl="https://example.com/posts/my-post/"
  sourceUrl="/source/my-post.md"
  author={{ name: "Marcelo Felix", url: "https://marcelofelix.com/" }}
/>
```

This enables:

- JSON-LD `BlogPosting` metadata through `PapyrusAiMetadata`
- canonical `<link rel="canonical">`
- Copy Markdown button
- Copy Citation button

For custom pages, import the metadata component directly:

```astro
---
import { PapyrusAiMetadata } from "astro-papyrus/components";
---

<PapyrusAiMetadata
  type="SoftwareSourceCode"
  title="papyrus"
  canonicalUrl="https://github.com/marcelofpfelix/papyrus"
/>
```

Generate agent-readable indexes from a content directory:

```sh
pnpm papyrus-llms src/content/posts public https://marcelofelix.com
```

In this package checkout, use the local script form:

```sh
make llms
```

The command writes:

- `public/llms.txt`: compact title/URL/summary index
- `public/llms-full.txt`: full text corpus with source paths

For structured machine-readable indexes, generate JSON files too:

```sh
make ai-indexes
```

The command writes:

- `public/ai/index.json`: manifest with counts and file names
- `public/ai/posts.json`: post URL, source path, title, description, excerpt, tags, and dates
- `public/ai/tags.json`: tag counts and post references
- `public/ai/projects.json`: project cards from optional site data
- `public/ai/notes.json`: short note cards from optional site data
- `public/ai/cv.json`: CV summary, templates, and section names from optional site data
- `public/ai/search.json`: normalized search records with stable ids and plain text
- `public/ai/graph.json`: nodes and edges between posts, tags, projects, notes, and CV sections

Every generated item gets a stable machine id such as `post:my-slug`,
`tag:astro`, or `project:papyrus`. Graph nodes, graph edges, tag post
references, and the search index reuse those ids so agents can join the files
without guessing from labels.

This is intentionally static. A consuming site can publish these files directly
from a CDN and let agents, search tools, or local scripts fetch them without a
server API.

Validate required AI metadata before publishing:

```sh
pnpm run ai:validate -- src/content/posts public/demo/site-data.json
```

The validator checks post frontmatter for `title`, `description`, `slug`,
`pubDatetime`, `tags`, and `license`. When a site-data JSON file is provided it
also checks project, note, and CV summary fields used by the static indexes.

Generate one RSS feed per tag:

```sh
make rss-tags
```

The command writes `public/rss/tags/<tag>.xml` files and
`public/rss/tags/index.json` so a consuming site can expose separate feeds for
different topics such as `#tech` without adding dynamic server code.

## Diagrams and artifacts

Implemented:

- fenced `mermaid` blocks render inline as SVG in the browser
- `.mmd` and `.mermaid` links become artifact cards and are hydrated into inline Mermaid diagrams after load
- Mermaid diagrams preserve their source and re-render when the theme mode or theme profile changes
- post images and Mermaid SVGs can be zoomed in an overlay
- PlantUML and Excalidraw source links become explicit artifact cards
- `papyrus-artifacts` can render artifact SVGs when local renderers are installed

Not implemented:

- PlantUML inline SVG rendering without a local renderer
- Excalidraw inline rendering/export without a local renderer

```sh
pnpm papyrus-artifacts public public/generated/artifacts
pnpm papyrus-artifacts public public/generated/artifacts --strict
```

Without `--strict`, missing local renderers are reported and skipped. With
`--strict`, missing renderers fail CI. Do not fake PlantUML or Excalidraw
rendering. Source cards are honest until a renderer is chosen.

## Link previews and cards

Implemented:

- `PapyrusGithubCard`: client-side GitHub repo preview card.
- `PapyrusLinkPreview`: deterministic link preview card without metadata scraping.
- `PapyrusTimeline`: Pure-style timeline component.
- `PapyrusProjectList`: static project cards.

## Feature config

papyrus stays Astro-native: consuming sites own their `src/pages` routes and
content collections. The package owns reusable layouts, components, markdown
helpers, styles, utilities, and small opt-in plugins. That keeps the blog repo
explicit like Astro, while still making the theme versatile like Starlight:
every built-in feature has a named flag, and custom plugins can add capabilities
without mutating package internals.

Most optional UI can be disabled by not rendering the component. For layout and
post features built into `PapyrusBaseLayout` or `PapyrusPostLayout`, use a grouped
feature config:

```astro
---
import { PapyrusPostLayout } from "astro-papyrus/components";

const features = {
  header: true,
  footer: true,
  scrollHeader: true,
  search: false,
  rss: false,
  share: false,
  toc: false,
  postTags: true,
  sourceActions: false,
  postStats: false,
  postSideLinks: false,
  adjacentPosts: false,
  backToTop: false,
};
---

<PapyrusPostLayout title="Minimal post" siteTitle="My site" features={features}>
  <p>Minimal post body.</p>
</PapyrusPostLayout>
```

## Brand and logo

`PapyrusBaseLayout` defaults to the package brand: a Twinkling SVG mark plus the
visible site title. The mark uses `currentColor`, so the header logo switches to
`--papyrus-accent` on hover/focus through normal link color.

Consumers that want the old terminal prompt mark can keep passing
`headerTitle`; that intentionally switches the header brand to text plus the
blinking cursor:

```astro
<PapyrusBaseLayout
  title="Marcelo Felix"
  siteTitle="Marcelo Felix"
  headerTitle="~ $"
/>
```

For custom brand behavior, prefer explicit props over CSS overrides:

- `brandMark`: `twinkle` or `terminal`
- `brandTitle`: visible title for the Twinkling brand
- `showBrandTitle`: hide/show title text next to the mark
- `brandAriaLabel`: accessible label for the home link

Supported keys:

- `header`
- `footer`
- `scrollHeader`
- `search`
- `rss`
- `poweredBy`
- `themeControls`
- `share`
- `toc`
- `postTags`
- `aiMetadata`
- `sourceActions`
- `postStats`
- `comments`
- `postSideLinks`
- `adjacentPosts`
- `backToTop`
- `markdownAlerts`
- `mermaid`
- `artifactLinks`
- `imageZoom`
- `notes`
- `projects`
- `graph`
- `cv`
- `linkPreviews`
- `contentIndex`
- `sectionMenu`

Some flags are rendered directly by layouts, such as `header`, `footer`,
`search`, `rss`, `share`, `toc`, `postTags`, `postStats`, `postSideLinks`,
`adjacentPosts`, and `backToTop`. Other flags are capability switches for
site-owned composition: for example `projects`, `graph`, `cv`, `linkPreviews`,
`contentIndex`, and `sectionMenu` are enabled by rendering the matching
component, while `markdownAlerts`, `mermaid`, `artifactLinks`, `imageZoom`, and
describe markdown/runtime helpers installed by the site or package demo. This
is intentional: the consuming Astro app controls routes, imports,
markdown plugins, credentials, and data sources.

Utilities are exported from `astro-papyrus/utils`:

```ts
import { defaultPapyrusFeatures, resolvePapyrusFeatures } from "astro-papyrus/utils";
```

Community plugins use the same feature config surface. A plugin declares
capabilities and optional feature defaults; the consuming site still decides
what to render and where credentials/config live:

```ts
import { definePapyrusPlugin, resolvePapyrusPluginConfig } from "astro-papyrus/utils";

const commentsPlugin = definePapyrusPlugin({
  name: "papyrus-giscus",
  description: "Site-owned comments adapter using Giscus.",
  packageName: "@papyrus/plugin-giscus",
  featureDefaults: { postStats: true },
  capabilities: [
    { kind: "component", name: "Comments" },
    { kind: "integration", name: "giscus" },
  ],
});

const config = resolvePapyrusPluginConfig([commentsPlugin], {
  rss: false,
});
```

Plugins can also expose a tiny setup lifecycle. The setup context is
deliberately small: a plugin can add capabilities and provide feature defaults,
while the consuming site still owns imports, markdown integrations, components,
and final configuration.

```ts
const kbdPlugin = definePapyrusPlugin({
  name: "papyrus-kbd",
  description: "Keyboard shortcut markup.",
  setup({ addCapability, setFeatureDefaults }) {
    setFeatureDefaults({ sourceActions: true });
    addCapability({ kind: "markdown", name: "kbd-shortcodes" });
  },
});
```

Supported capability kinds:

- `component`
- `markdown`
- `script`
- `style`
- `integration`
- `route`
- `data`

The docs collection includes `/collections/docs/features/` with copyable examples and a rendered
plugin capability list.

The repository also ships a tiny external package fixture at
`examples/papyrus-kbd-plugin`. It imports `definePapyrusPlugin` from the public
`astro-papyrus/utils` entrypoint, declares peer dependencies on `astro-papyrus` and
`astro`, exports a default plugin definition with a setup lifecycle, and is covered by
`make verify-features`. Treat that fixture as the minimum package shape for
community plugins: a separate package declares capabilities, and the consuming
site opts in with `resolvePapyrusPluginConfig()`.

### Feature implementation rule

New features should be implemented as isolated reusable units first:

- Prefer a standalone Astro component, markdown helper, runtime component,
  utility, or small plugin package over adding behavior directly to a layout.
- Add a feature flag when the behavior is optional inside `PapyrusBaseLayout` or
  `PapyrusPostLayout`.
- Keep the public import path stable through `package.json` exports when another
  Astro project could use the feature.
- Check Pure first. Reuse public Pure exports where practical, but do not
  deep-import Pure or Starlight private internals.
- Keep Papyrus-specific styling, route names, and content assumptions thin enough
  that a generic part could be proposed upstream to Pure later.
- Add demo content and verifier coverage before marking the audit row verified.

### Starlight plugin idea comparisons

These are design notes, not implemented compatibility claims. Check the
Starlight ecosystem before building local equivalents, but keep papyrus
plugins small, optional, and site-owned.

| Idea | Reference | Useful for papyrus? | Decision |
| --- | --- | --- | --- |
| Site graph | `starlight-site-graph` | Yes, but only after the graph model grows beyond tag/source metadata. | Keep as roadmap. Reuse the idea of a generated graph index, but do not depend on Starlight page internals. |
| Keyboard markup | `starlight-kbd` | Yes for technical posts and docs. | Prefer a tiny markdown/component plugin that renders `<kbd>` consistently. Do not add it until markdown demo coverage needs keyboard shortcuts. |
| Auto sidebar | `starlight-auto-sidebar` | Maybe for docs, not for blog posts. | Use generated content indexes first. A sidebar plugin should read folder metadata and stay optional. |
| Contextual menu | `starlight-contextual-menu` | Maybe for docs navigation and copy/source actions. | Defer until the interaction model is clear; avoid hidden menus for core post actions. |
| Telescope/search | `starlight-telescope` | Yes for future graph/search exploration. | Keep as roadmap for global AI-first search and backlinks. Current package ships static indexes plus a dependency-free graph demo with search, type filtering, node focus, and focused connection details. |

Implementation rule: when one of these ideas becomes active work, create a
specific audit row or update the matching row before coding. Do not mark the
community-plugin rows verified just because the idea is listed here.

## Comments and stats

Default comment choice: `giscus`.

Comments are optional adapters, not required theme state. The package exports `PapyrusGiscusComments.astro`, so a site can opt in with its own public repo, Discussions category, and IDs.

```astro
---
import PapyrusGiscusComments from "astro-papyrus/PapyrusGiscusComments.astro";
---

<PapyrusGiscusComments
  enabled={import.meta.env.PUBLIC_COMMENTS_ENABLED === "true"}
  repo="owner/repo"
  repoId="R_kgD..."
  category="Announcements"
  categoryId="DIC_kwD..."
/>
```

The package demo renders the same component in disabled mode so the layout is visible without shipping fake IDs or making external requests.

Post stats use `PapyrusRemotePostStats.astro`:

```astro
<PapyrusRemotePostStats endpoint="/post-stats.json" slug="my-post" trackView />
```

Endpoint contract:

- `GET /post-stats.json?slug=my-post` returns `{ "views": 123, "comments": 4 }`
- static sites may return a full map: `{ "my-post": { "views": 123, "comments": 4 } }`
- `POST /post-stats.json?slug=my-post` may increment a view and returns the same shape

## Assets and scripts

```sh
pnpm papyrus-logo --twinkle public/logo.svg
pnpm papyrus-logo "~ $" public/logo.svg
pnpm papyrus-mobile-icons --twinkle public
pnpm papyrus-mobile-icons "~ $" public
pnpm papyrus-manifest "Marcelo Felix" public/site.webmanifest /logo.svg
pnpm papyrus-compress public/images
pnpm papyrus-cover src/content/posts/example.md public/images/example-cover.svg
pnpm papyrus-card-cover src/content/posts/example.md public/images/example-card.svg ./fonts/Inter-Regular.ttf
pnpm papyrus-post-date check src/content/posts
pnpm papyrus-artifacts public public/generated/artifacts
```

Image compression is deliberate, not part of `make build`, because it mutates
source files. Run it before committing or releasing when source images change:

```sh
pnpm add -D sharp
make compress-images
```

For a consuming-site hook or CI job where `sharp` may not be installed yet, use
the optional mode so the hook can skip cleanly instead of blocking unrelated
work:

```sh
papyrus-compress --optional public/images
```

Date automation is opt-in. Use the package script for checks and for intentional
timestamp updates:

```sh
papyrus-post-date check src/content/posts
papyrus-post-date touch src/content/posts/my-post.md
make date-check
make date-touch
```

Do not install a package-managed git hook by default. Consuming sites may wire
the check command into CI or a local pre-commit hook when the team wants that
policy, but the reusable package should not mutate content during `make build`.

## CV/profile model

The demo CV data follows the upstream `jekyllcv` user-data structure, represented as TOML for this package demo:

- top-level user identity and links
- profile facts such as location, birth date, nationality, language, and page count
- `sections` array controlling visible sections
- per-section metadata: title, icon, page, groups
- each group has items
- each item carries title, dates, location, description, logo, and URLs when available

`PapyrusCvProfile` accepts a normalized object so adapters can load TOML, JSON, or Astro data collections without coupling the component to one file format.
The same normalized data can drive a homepage profile, a project/about page, or a dedicated A4 print route.

### CV template contract

A CV template in papyrus is a small Astro composition around the normalized
`PapyrusCvUser` object. The package owns the data shape, section rendering
helpers, export helpers, and A4 primitives; the consuming site owns route names,
parser packages, copy, and any extra business-specific fields.

Template authors can use three levels of control:

1. Pick a built-in `PapyrusCvProfile` variant for fast layout changes.
2. Use `sectionOverrides` to rename, hide, reorder visually, or restyle known
   sections without changing the CV data.
3. Compose smaller components such as `PapyrusCvHero`, `PapyrusCvLinks`,
   `PapyrusCvSections`, `PapyrusCvExportActions`, `PapyrusCvA4Page`, and
   `PapyrusJekyllCvPage` in a custom Astro route when the built-in profile is not
   enough.

The stable template inputs are `user`, `variant`, `showSource`, `sourceHref`,
and `sectionOverrides`. Custom templates should pass normalized data through
unchanged so JSON, Markdown, web profile, and print routes stay in sync.

Use the full profile component when the default template is enough:

```astro
<PapyrusCvProfile user={user} variant="terminal" />
<PapyrusCvProfile user={user} variant="cards" />
<PapyrusCvProfile user={user} variant="timeline" />
<PapyrusCvProfile user={user} variant="a4" />
```

Use `PapyrusJekyllCvPage` when you want the old jekyllcv-compatible page
structure: print/save prompt, A4 sheets, profile/contact/info block, page-based
sections, and the original made-with footer shape.

```astro
---
import { PapyrusJekyllCvPage } from "astro-papyrus/components";
---

<PapyrusJekyllCvPage user={user} />
```

Use section overrides when the default component is fine but a specific section
needs a different label, icon, visibility, or visual variant:

```astro
---
const sectionOverrides = {
  about: { title: "whoami", icon: "$", variant: "highlight" },
  experience: { variant: "timeline" },
  skills: { title: "toolbox", variant: "compact" },
  interests: { hidden: true },
};
---

<PapyrusCvProfile
  user={user}
  variant="terminal"
  sectionOverrides={sectionOverrides}
/>
```

Supported built-in section variants:

- `default`
- `compact`
- `highlight`
- `timeline`

Use the smaller components when designing a custom CV page:

```astro
---
import {
  PapyrusCvExportActions,
  PapyrusCvA4Page,
  PapyrusCvHero,
  PapyrusCvLinks,
  PapyrusCvSections,
} from "astro-papyrus/components";
---

<section class="my-cv-template">
  <PapyrusCvHero user={user} kicker="whoami" />
  <PapyrusCvLinks links={user.links} />
  <PapyrusCvSections sections={user.sections} />
  <PapyrusCvExportActions json={json} markdown={markdown} />
</section>
```

For a dedicated print route, render only the A4 component in a standalone page:

```astro
---
import { PapyrusCvA4Page } from "astro-papyrus/components";
import "astro-papyrus/papyrus.css";
---

<main class="papyrus-cv-print-shell">
  <PapyrusCvA4Page user={user} template="classic" />
</main>
```

Use `@page { size: A4; margin: 0; }` in the route stylesheet when the page is
meant to be printed directly.

Verify the package demo route after a build:

```sh
make verify-a4
```

This checks the built route, source CSS, rendered CV content, and a Playwright
PDF artifact for A4 invariants: route generation, `@page`, `210mm` width,
`297mm` height, print shell, rendered CV content, and an A4 PDF MediaBox.
Old jekyllcv visual parity still needs a separate source/screenshot comparison.

The first adapter covers the upstream jekyllcv shape:

```ts
import { cvToJsonResume, cvToMarkdown, normalizeJekyllCvUser } from "astro-papyrus/utils";

const user = normalizeJekyllCvUser(parsedUsersToml);
const markdown = cvToMarkdown(user);
const resumeJson = cvToJsonResume(user);
```

TOML example in a consuming site:

```astro
---
import { readFile } from "node:fs/promises";
import { parse } from "smol-toml";
import { PapyrusCvA4Page } from "astro-papyrus/components";
import { normalizeJekyllCvUser } from "astro-papyrus/utils";

const source = await readFile("src/data/users.toml", "utf8");
const user = normalizeJekyllCvUser(parse(source));
---

<PapyrusCvA4Page user={user} template="classic" />
```

The package demo includes `/demo/users.toml` and profile routes to show the
input style. The rendered demo uses the same
upstream-shaped sample content so the component examples exercise long prose,
dated ranges, logos, links, section pages, profile facts, and A4 output.
Parser packages belong in consuming sites so `papyrus` does not force a parser
choice on users who keep their CV data in JSON or Astro content collections.

Future CV direction:

- more profile templates beyond `terminal`, `cards`, and `timeline`
- more A4 CV templates beyond `classic` and `compact`
- Playwright/browser PDF regression checks for exact A4 output
- richer per-section component slots beyond label/icon/variant/visibility overrides
