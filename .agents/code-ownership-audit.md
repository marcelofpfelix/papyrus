# Papyrus code ownership audit

Reviewed on 2026-09-02. This is an ownership decision, not an instruction to
split files immediately. A move is complete only after consumers use the public
replacement and disabled builds prove that the old payload is gone.

## Decision rules

- **Core component:** common Papyrus UI, layout, accessibility, routing, or
  theme behavior.
- **Core library:** deterministic framework-neutral validation, normalization,
  or rendering shared by core and plugins.
- **Built-in optional integration:** a stable, broadly useful feature with close
  coupling to Papyrus routes, data, styles, or build order. It must emit nothing
  while disabled.
- **External plugin:** niche, experimental, provider-specific, network-backed,
  or independently releasable behavior.
- **Consumer-owned:** site content, credentials, deployment settings, and
  one-site presentation.
- **Delete:** code with no supported use after its replacement is verified.

Extraction needs at least two of these signals: independent release cadence,
meaningful optional dependency or client payload, a stable public API, use
outside Papyrus, or low coupling to package-private routes and data. File count
alone is not a reason to extract code.

## Components

| Files | Decision | Reason and migration cost |
| --- | --- | --- |
| `PapyrusBaseLayout`, `PapyrusPostLayout`, `PapyrusHeader`, `PapyrusFooter`, `PapyrusThemeBootstrap`, `PapyrusThemeProvider` | Core component | Universal page shell, metadata, navigation, and pre-paint theme behavior. High coupling; do not extract. |
| `PapyrusPostList`, `PapyrusAdjacentPosts`, `PapyrusArchiveList`, `PapyrusTagList`, `PapyrusTimeline`, `PapyrusNoteList` | Core component | Shared blog navigation and listing behavior. No independent payload. |
| `PapyrusToc`, `PapyrusTocHeading`, `PapyrusCollectionIndex`, `PapyrusContentIndex` | Core component | Shared post and ordered-collection navigation with accessibility and mobile layout contracts. |
| `PapyrusProjectList`, `PapyrusGithubCard`, `PapyrusLinkPreview` | Core component | Static, reusable content cards. Keep rendering in core; optional Markdown syntax belongs in external plugins. |
| `PapyrusCvProfile`, `PapyrusCvHero`, `PapyrusCvLinks`, `PapyrusCvSections`, `PapyrusCvActions`, `PapyrusCvExportActions`, `PapyrusCvA4Page`, `PapyrusJekyllCvPage`, `PapyrusProfilePage` | Built-in optional integration | Large but closely coupled profile/CV feature. Keep until a separate package has a real consumer and stable data contract. |
| `PapyrusGiscusComments` | Built-in optional integration | Provider-specific but tightly coupled to Papyrus theme switching and generated Giscus CSS. Reconsider only if another comments provider is implemented. |
| `PapyrusAiMetadata` | Built-in optional integration | Small metadata-only feature with layout coupling and no client payload. |
| `PapyrusArtifactLink` | Core component | Static rendering used by the core Markdown transform. |
| `PapyrusRemotePostStats` | External plugin candidate | Network-backed and optional. Extract only with its provider/config boundary and a consumer migration. |
| `PapyrusSiteGraph` | External plugin | Beta visualization with a dedicated route and generated data. Move with `papyrusSiteGraph()`; no compatibility shim after migration. |
| `PapyrusNotFound` | Core component | Package-owned fallback route and search handoff. |
| `runtime/PapyrusBackToTopRuntime`, `runtime/PapyrusPostActionsRuntime`, `runtime/papyrusClipboard` | Core component/library | Shared interaction and clipboard behavior used by package layouts. |
| `runtime/PapyrusMediaRuntime` | Built-in optional integration | Owns optional Mermaid/media behavior and payload. Split only when the Markdown plugin API can request runtime assets. |
| `runtime/PapyrusScheduledPostsRuntime` | Built-in optional integration | Closely coupled to Papyrus post listing and the configured listed-later policy. |
| `components/index.ts` | Core library | Stable component export surface. |

## Libraries and Markdown

| Files | Decision | Reason and migration cost |
| --- | --- | --- |
| `utils/posts`, `utils/pages`, `utils/collections`, `utils/withBase`, `utils/features` | Core library | Route, publication, base-path, and feature contracts used across package templates. |
| `utils/github-card` | Core library | Safe deterministic parser/renderer shared by the Astro component and external Markdown plugin. |
| `utils/cv`, `utils/cv-icons`, `utils/cv-profile-data`, `utils/cv-profile-links` | Built-in optional integration | Shared by the profile routes and exporter; keep together until profile is independently packaged. |
| `utils/giscus-theme` | Built-in optional integration | Provider-specific, deterministic theme adapter used by package routes. |
| `utils/collection-metadata`, `utils/image-effects`, `utils/social-images`, `utils/theme-profiles` | Core library | Shared build/runtime contracts for collection paths, theme-aware assets, and metadata. Collection metadata is framework-neutral because routes and build-time social cards consume the same parser and membership rules. |
| `utils/plugins` | Delete after external contract migration | It currently records metadata but does not install runtime capabilities. Standard Astro integrations and unified plugins are the real extension APIs. |
| `utils/index.ts` | Core library | Public stable utility surface; avoid exporting package-private route helpers. |
| `markdown/config` | Core library | Single Markdown processor composition point. It should accept standard external remark/rehype plugins. |
| `markdown/rehype-callout-icons`, `markdown/rehype-task-list-labels` | Core library | Theme markup and accessibility normalization for default Markdown output. |
| `markdown/remark-artifact-links` | Built-in optional integration | Papyrus artifact syntax and component contract. Keep optional and payload-free. |
| `markdown/remark-mermaid-blocks` | Built-in optional integration | Optional syntax coupled to `PapyrusMediaRuntime`; an external move needs an asset-registration API first. |
| `shiki/index`, `shiki/langs/kamailio` | Core library | Shared code-block behavior and the theme's documented custom language. Additional niche languages should be external. |

## Astro integrations

| Files | Decision | Reason and migration cost |
| --- | --- | --- |
| `integration.ts` | Core component | Injects the package's default routes and build-critical social images. This is the theme entry point. |
| `plugins/base-path.mjs` | Core library/integration | Deployment-critical URL correctness across every route and Markdown asset. |
| `plugins/link-validator.mjs` | External plugin | Build tooling with no runtime coupling. Move after an external package passes base-path fixtures. |
| `plugins/md-txt.mjs`, `plugins/routes/md-txt.ts` | External plugin | Optional route format with an independent Starlight-derived contract. |
| `plugins/site-graph.mjs`, `plugins/routes/site-graph.astro` | External plugin | Beta route plus renderer; first existing feature to extract after the new repository is available. |
| `plugins/index.mjs` | Core library temporarily | Keep as a migration export only until external packages replace optional integrations; retain `papyrusBasePath()` in core. |

## Build and authoring scripts

| Files | Decision | Reason and migration cost |
| --- | --- | --- |
| `site-config`, `theme-colors`, `frontmatter`, `generate-social-images`, `create-cover-svg`, `create-card-cover` | Core library/tooling | Shared config, focused frontmatter parsing, and deterministic social/cover generation used by the integration and documented CLI. |
| `create-logo-svg`, `create-mobile-icons`, `create-webmanifest`, `theme-profile` | Core tooling | Small theme setup tools; keep while the template invokes them. |
| `content-outline`, `post-date`, `generate-tag-rss` | Core tooling | Authoring and blog output tied to Papyrus content conventions. |
| `export-cv` | Built-in optional integration | Same ownership as the profile/CV feature. |
| `generate-image-effects`, `compress-images` | External plugin candidate | Heavy optional media tooling. Extract together only after the plugin can register build steps and assets. |
| `generate-ai-indexes`, `generate-llms`, `validate-ai-metadata` | External plugin candidate | Optional generated machine-readable outputs. Keep until route/build ordering is exposed through a stable API. |
| `render-artifacts` | External plugin | Niche external-tool rendering; it should not expand the core dependency surface. |
| `check-built-links` | External plugin | Move with `papyrusLinkValidator()` to avoid two validators. |
| `serve-static.rb` | Delete candidate | Keep only while the Makefile needs its LAN-safe 404 behavior; replace with one existing project dependency before deleting. |
| `*.d.mts` beside script modules | Core library declarations | Required typing for published JavaScript modules; generate them only if the build can reproduce byte-equivalent output. |

## Current task boundaries

| Task | Ownership |
| --- | --- |
| PP-248 collection TOC placement | Core component/layout CSS. |
| PP-233 first-paint theme | Core layout plus theme runtime. |
| PP-237 worktree cleanup | Repository maintenance, not shipped code. |
| PP-246 external plugin proof | External repository and standard Astro/unified APIs. |
| PP-247 GitHub fence | Core parser/renderer plus external remark plugin. |
| PP-244 emoji shortcodes | External remark plugin; no runtime JavaScript. |
| PP-231 Markdown pages | Core content schema, route contract, and page layout. |

## Minimum external plugin contract

An external plugin may import only documented exports from `astro-papyrus`.
Markdown plugins use the standard unified signature and are passed through
`papyrusMarkdown({ remarkPlugins, rehypePlugins })`; route/build plugins use the
standard Astro integration API. Packages declare `astro` and `astro-papyrus` as
peer dependencies, add no client code while disabled, and test a packed Papyrus
consumer with a base path. No plugin may import from `astro-papyrus/src/*` or a
template route.

The first proof should contain the GitHub fence and emoji transforms. Moving
site graph, Markdown text routes, or link validation waits until that external
repository passes the isolated-consumer gate.
