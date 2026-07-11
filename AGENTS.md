# Agent Instructions

## Required Request Tracking

`.agents/request-audit.md` is the authoritative request-by-request tracker for
this repository.

Before changing implementation code:

1. Read this `AGENTS.md`, the global `~/.codex/AGENTS.md`, and
   `.agents/request-audit.md`.
2. Identify the exact request IDs being worked.
3. If the request is missing from `.agents/request-audit.md`, add it before
   implementing. Split compound user messages into atomic rows when one status
   would hide separate behaviors, for example code rendering, copy behavior,
   Mermaid rendering, CV print parity, footer controls, and mobile navigation.
4. Define the evidence that would prove the request is complete.

When reviewing conversation history:

- Keep papyrus implementation requests in the normal `PP-*` rows.
- If a request clearly belongs to another repo, such as the consuming blog,
  dotfiles, repo creation, or an old deployment helper, record it in the audit's
  external-request coverage section instead of silently dropping it or marking a
  papyrus row complete.
- Keep the explicit example-request coverage section in sync when Marcelo gives
  a dense checklist. That section is an index back to row IDs, not a substitute
  for row-level status.

When work is done:

- Update each affected row individually.
- Use only `Verified`, `Partial`, `Missing`, `Unverified`, or `Deferred`.
- Do not mark a broad run, goal, or feature area as done when individual
  requests remain partial, unverified, or missing.
- Do not treat `astro check`, `astro build`, or link checks as proof of visual
  behavior, clipboard behavior, Mermaid rendering, or print/A4 parity.
- For UI behavior, require browser evidence such as Playwright checks,
  screenshots, DOM assertions, or an explicit manual verification note.
- For copy buttons, verify clipboard text or the fallback path.
- For Mermaid/diagram behavior, verify rendered diagram output, not only that
  markdown compiled.
- For CV/A4 behavior, verify the rendered route and print dimensions; CSS
  invariants alone are not enough to claim old jekyllcv parity.
- If a row only proves that a component/file exists, keep it `Partial` or
  `Unverified` until the actual requested behavior is exercised.
- For internal links and audit status summaries, use the repeatable commands
  `make check-links` and `make audit-status` instead of one-off shell snippets.
- For logo, favicon, and manifest consistency, use `make verify-assets`.
- For static theme defaults and token consistency, use `make verify-theme`.
- For content utility behavior such as folder tags, stable slugs, pinned
  ordering, adjacent posts, reading time, stable route/backlink policy, and
  content-outline folder metadata, use `make verify-content`.
- For `paper.config.toml`, the package config loader, demo config wiring, and
  script fallback behavior, use `make verify-config`.
- For built-in feature flags, local plugin helper behavior, documented
  Starlight plugin idea comparisons, and the Starlight component/plugin/sidebar
  comparison record, use `make verify-features`.
- For CV data normalization and JSON/Markdown export helpers, use
  `make verify-cv`.
- For current AI/index/RSS artifacts, use `make verify-ai`.
- For package exports, bin targets, Pure dependency boundary, and generated
  cover SVG structure, use `make verify-package`.
- For the Pure-priority checklist covering controls, code blocks, timeline,
  repository preview, posts index, and markdown styles, use
  `make verify-pure-parity`.
- For the local TinyPNG-style image compression workflow and optional `sharp`
  smoke test, use `make verify-compress`.
- For post date check/touch behavior and opt-in git-hook guidance, use
  `make verify-date`.
- For live app/library version freshness and the documented TypeScript hold,
  use `make verify-deps`; this command queries the package registry.
- For release metadata, license/changelog/docs, public npm provenance settings,
  and `npm pack --dry-run` tarball contents, use `make verify-release`.
- For README scope, demo links, and avoiding duplicated roadmap/request detail
  in the README, use `make verify-readme`.
- For docs structure, non-authoritative roadmap inventory, and request-audit
  source-of-truth links, use `make verify-docs`.
- For package demo feature coverage, route examples, and the rendered demo
  coverage matrix, use `make verify-demo`. This proves examples are present;
  it does not prove visual parity, clipboard behavior, or old-site parity.
- For markdown demo source coverage and markdown helper wiring, use
  `make verify-markdown`. This does not prove visual quality, clipboard
  behavior, or Mermaid SVG hydration. Fenced Mermaid support must stay wired
  through `remark-mermaid-blocks`, GitHub alert support must stay wired through
  `remark-github-alerts`, and both must be verified in the browser.
- For browser behavior such as copy/share, Mermaid SVG hydration, footer theme
  controls, header scroll state, post metadata/tags, post side links, borderless
  card/tag/link styling, and CV A4 routes, use `make verify-browser`. Keep
  exact visual parity and old-site/PDF parity separate unless screenshots or
  PDFs are compared directly.
- For responsive screenshot evidence and touch-target/overflow checks across
  desktop, tablet, and mobile widths, use `make verify-responsive`. It writes
  `.screenshots/responsive/*.png` and is still not a substitute for exact
  upstream visual parity or old-site PDF comparison.
- For Lighthouse score checks, use `make verify-lighthouse`. It runs the static
  demo against local Chromium, writes `.lighthouse/papyrus-home.json`, and
  prints category scores plus lower-scoring audit diagnoses.

Keep `.agents/status-roadmap.md` as a summary only. If it conflicts with
`.agents/request-audit.md`, the request audit wins.

## Feature And Component References

When implementing a feature or component, check reference projects in this order:

1. Starlight
2. AstroWind
3. AstroPaper
4. Cactus

If Starlight exposes reusable components, plugin APIs, markdown styles, or
override patterns that fit the feature, prefer adapting that structure before
writing a local component from scratch.

As of 2026-06-30, `@astrojs/starlight` is a real package from
`withastro/starlight`, currently exposing package entries such as
`./components`, `./components/*`, `./style/markdown.css`, and plugin/override
APIs. Treat it as a strong reference for component boundaries, markdown/prose
behavior, plugin design, and override configuration. Reuse imports only when
they are stable public exports and do not force this package to become a full
Starlight docs site.

Keep `papyrus` as a thin wrapper around Pure. Do not copy full upstream
themes wholesale, and do not modify upstream Pure directly.

When a requested feature already exists in Pure, treat Pure as the first
implementation reference before building a local variant. This applies
especially to code blocks, light/dark controls, timeline/profile pieces, GitHub
repository previews, posts indexes, markdown/prose styles, and docs-style
navigation. Record the comparison in `.agents/request-audit.md` before marking a
row verified.

## Post Routes And Linking

Before changing article routes, think about long-term permalinks and knowledge
linking. Prefer stable routes that stay easy to find, easy to link externally,
and compatible with future Obsidian-style article linking/backlinks. Do not
blindly accept starter defaults such as `/posts/my-article/` if a more permanent
slug structure is better for the site.
