# Starlight comparison record

This is the implementation reference log for requests that say papyrus should
check Starlight before building local equivalents. It records what Starlight
offers and how papyrus should react without turning this package into a
Starlight site.

Checked source: Context7 `/withastro/starlight` docs on 2026-07-01.
Refreshed source: Context7 `/withastro/starlight` docs on 2026-08-17 for
built-in components, plugin hooks, component overrides, and sidebar
autogeneration.

Compatibility spike completed on 2026-08-18 against the official Starlight
plugin, component, and configuration references. The evidence fixture is
`examples/starlight-interop/`.

## Compatibility decision

No generic Starlight compatibility layer should be added to Papyrus.
Starlight plugins depend on Starlight-specific config, localization, route
middleware, and UI context, while `definePapyrusPlugin` intentionally resolves
capabilities and feature defaults without owning the consuming Astro app.

Use an explicit boundary instead:

- adapt portable authoring concepts such as asides and generated navigation;
- keep Starlight-only tabs, overrides, translations, and middleware in a
  Starlight site;
- reuse framework-neutral public Papyrus helpers individually when they do not
  depend on Papyrus routes or layout context;
- do not run the full Papyrus and Starlight integrations together by default.

Selected public plugin ideas may be reimplemented as Papyrus-native Astro
integrations when they can reuse existing Papyrus data and avoid a Starlight
runtime dependency. The first adapted set is exported from
`astro-papyrus/plugins`:

| Starlight reference | Papyrus adapter | Reused Papyrus capability |
| --- | --- | --- |
| `starlight-site-graph` | `papyrusSiteGraph()` | Generated `public/ai/graph.json` index and local SVG fallback after the public package failed Astro 7 runtime gates |
| `starlight-md-txt` | `papyrusMdTxt()` | Posts collection, publication rules, and slugs |
| `starlight-base-path` | `papyrusBasePath()` | Unified Markdown processor and `withBase()` component boundary |
| `starlight-links-validator` | `papyrusLinkValidator()` | Existing built-output link checker |

`starlight-telescope@1.0.0` was tested and removed. Its public package requires
Starlight and adds Fuse plus a second page index, while Papyrus already ships a
Pagefind search route. Keeping one search engine is the smaller install and
runtime boundary. The Markdown text, base-path, and link-validator adapters port
only their portable MIT-licensed cores because their public entrypoints are
coupled to Starlight lifecycle or route state.

`starlight-site-graph@0.5.0` was tested through its public integration and
component APIs. It declares an older Astro peer range, its integration fails
under Astro 7, and its public graph component produced an 816 KB client chunk
that failed in Chromium with `process is not defined`. Papyrus therefore keeps
the existing lightweight SVG graph. This is a measured compatibility fallback,
not a claim that the local renderer is upstream code.

Every boundary has verifier coverage and pinned provenance in
`THIRD_PARTY_NOTICES.md`.

The machine-readable mapping is
`examples/starlight-interop/concept-map.json`. A future adapter needs a specific
plugin use case and its own compatibility fixture; it must not emulate the
whole Starlight runtime.

## Public extension points to consider

| Area | Current Starlight reference | papyrus decision |
| --- | --- | --- |
| Built-in docs components | Public imports such as `import { Aside } from '@astrojs/starlight/components'`, `import { Tabs, TabItem } from '@astrojs/starlight/components'`, `Card`, and `Icon`. | Good reference for Markdown/prose components. Do not import these directly unless a stable public export fits a package component without forcing Starlight as the runtime. |
| Component overrides | Starlight docs show reusing defaults such as `@astrojs/starlight/components/SocialIcons.astro` inside custom UI, and the page API can pass page-specific sidebar data. | Use this pattern as inspiration for papyrus slots/wrappers: preserve default behavior, add small custom UI, and avoid wholesale copied components. |
| Sidebar and generated navigation | Starlight config supports explicit sidebar groups, generated items such as `{ autogenerate: { directory: 'reference' } }`, and per-page frontmatter sidebar metadata such as label, order, and badge. | Keep papyrus's `content-outline` generator independent, but borrow the folder-metadata, generated-index, order, and badge ideas for docs/content navigation. |
| Markdown asides and prose | Starlight ships docs-friendly components and aside behavior. | Compare callouts, blockquotes, and markdown spacing against Starlight/AstroPapyrus/Pure before changing local prose CSS. Keep Obsidian blockquote callout syntax for blog compatibility. |
| Plugin ecosystem | Starlight plugins expose `config:setup`, `i18n:setup`, `updateConfig`, `addIntegration`, route middleware, custom head entries, and custom CSS. | Do not translate arbitrary Starlight plugins. Adapt selected ideas through optional Papyrus-native Astro integrations when existing Papyrus routes and data provide a smaller implementation. Site credentials and private data remain in consuming sites. |

## Request mapping

| Request area | Starlight-first check | Current papyrus row |
| --- | --- | --- |
| Generated docs/index pages | Check sidebar autogeneration and component override patterns. | `PP-081`, `PP-081B`, `PP-081C` |
| Alerts/asides and markdown demos | Check Starlight `Aside` and markdown/prose behavior before CSS changes. | `PP-041`, `PP-051`, `PP-054`, `PP-055` |
| Plugin ideas | Check Starlight ecosystem package behavior first. | `PP-123`, `PP-123A`, `PP-123B` |
| Starlight component/plugin compatibility | Check public component imports, plugin hooks, component override patterns, and sidebar autogeneration before adding a compatibility layer. | `PP-216` |
| Graph/search/backlinks | Check Starlight-style graph/search plugins before building a local UI. | `PP-086`, `PP-095`, `PP-126`, `PP-127` |
| CV/profile/docs layout | Check override/wrapper style, but keep CV routes package-owned. | `PP-101` through `PP-110` |

## Rules

- Record the Starlight source checked in the matching audit row when a feature
  uses Starlight as a reference.
- Prefer Starlight's public package entries and documented override patterns;
  avoid copying private internals.
- Keep papyrus independent from Starlight unless a consuming site explicitly
  opts into Starlight.
- If a consuming site opts into Starlight, prefer an adapter or migration guide
  that maps concepts explicitly instead of making Starlight a default papyrus
  dependency.
- Do not mark exact visual parity from this document alone. Visual rows still
  need browser evidence, screenshots, or source comparisons.
