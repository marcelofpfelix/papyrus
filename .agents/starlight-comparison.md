# Starlight comparison record

This is the implementation reference log for requests that say papyrus should
check Starlight before building local equivalents. It records what Starlight
offers and how papyrus should react without turning this package into a
Starlight site.

Checked source: Context7 `/withastro/starlight` docs on 2026-07-01.

## Public extension points to consider

| Area | Current Starlight reference | papyrus decision |
| --- | --- | --- |
| Built-in docs components | Public imports such as `import { Aside } from '@astrojs/starlight/components'` and `import { Tabs, TabItem } from '@astrojs/starlight/components'`. | Good reference for Markdown/prose components. Do not import these directly unless a stable public export fits a package component without forcing Starlight as the runtime. |
| Component overrides | Starlight docs show reusing defaults such as `@astrojs/starlight/components/SocialIcons.astro` inside custom UI. | Use this pattern as inspiration for papyrus slots/wrappers: preserve default behavior, add small custom UI, and avoid wholesale copied components. |
| Sidebar and generated navigation | Starlight config supports explicit sidebar groups and generated items such as `{ autogenerate: { directory: 'reference' } }`. | Keep papyrus's `content-outline` generator independent, but borrow the folder-metadata and generated-index idea for docs/content navigation. |
| Markdown asides and prose | Starlight ships docs-friendly components and aside behavior. | Compare callouts, blockquotes, and markdown spacing against Starlight/AstroPaper/Pure before changing local prose CSS. Keep Obsidian blockquote callout syntax for blog compatibility. |
| Plugin ecosystem | Starlight has a plugin and override culture for docs-specific features. | Keep community plugins small and optional in papyrus. Site credentials, data fetches, and runtime services belong in consuming sites. |

## Request mapping

| Request area | Starlight-first check | Current papyrus row |
| --- | --- | --- |
| Generated docs/index pages | Check sidebar autogeneration and component override patterns. | `PP-081`, `PP-081B`, `PP-081C` |
| Alerts/asides and markdown demos | Check Starlight `Aside` and markdown/prose behavior before CSS changes. | `PP-041`, `PP-051`, `PP-054`, `PP-055` |
| Plugin ideas | Check Starlight ecosystem package behavior first. | `PP-123`, `PP-123A`, `PP-123B` |
| Graph/search/backlinks | Check Starlight-style graph/search plugins before building a local UI. | `PP-086`, `PP-095`, `PP-126`, `PP-127` |
| CV/profile/docs layout | Check override/wrapper style, but keep CV routes package-owned. | `PP-101` through `PP-110` |

## Rules

- Record the Starlight source checked in the matching audit row when a feature
  uses Starlight as a reference.
- Prefer Starlight's public package entries and documented override patterns;
  avoid copying private internals.
- Keep papyrus independent from Starlight unless a consuming site explicitly
  opts into Starlight.
- Do not mark exact visual parity from this document alone. Visual rows still
  need browser evidence, screenshots, or source comparisons.
