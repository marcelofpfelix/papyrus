# Starlight interoperability decision

This fixture records the supported boundary between Papyrus and Starlight. It
is a specification and migration reference, not a package that users install.
The machine-readable mapping lives in `concept-map.json`.

## Decision: No universal adapter

Starlight plugins cannot run unchanged in Papyrus. Their hooks receive
Starlight configuration, translations, route middleware helpers, and UI
context that Papyrus does not provide. Papyrus plugins declare capabilities
and feature defaults; they do not emulate the Starlight runtime.

Papyrus therefore does not depend on Starlight and does not translate arbitrary
Starlight plugins. This keeps the blog, profile, collections, and injected
routes independent.

Papyrus does provide selected native Astro integrations inspired by public
Starlight plugins. They use Papyrus routes and data rather than emulating
Starlight hooks:

| Reference | Papyrus integration |
| --- | --- |
| `starlight-site-graph` | `papyrusSiteGraph()` reuses `public/ai/graph.json`. |
| `starlight-md-txt` | `papyrusMdTxt()` exposes public posts as Markdown text. |
| `starlight-base-path` | `papyrusBasePath()` rewrites authored Markdown URLs. |
| `starlight-links-validator` | `papyrusLinkValidator()` checks built internal links. |

`starlight-telescope` is deliberately not adapted. Its public package requires
Starlight and uses a separate Fuse index, while Papyrus already ships Pagefind.

## Supported paths

- In a Papyrus site, use Papyrus components, collections and `folder.toml`, and
  Obsidian-style Markdown callouts. Do not add Starlight just for authoring UI.
- In a Starlight site, keep Starlight as the site integration. Do not install
  the full Papyrus integration in a Starlight site because both integrations
  own routes, layout assumptions, and content behavior.
- A Starlight site may import framework-neutral public helpers from
  `astro-papyrus` individually when their documented inputs are sufficient.
  Examples include standalone Markdown transforms or utilities that do not
  read Papyrus routes, configuration, or layout context.
- Shared content should use portable Markdown where possible. Keep tabs,
  Starlight component overrides, translations, and middleware in the
  Starlight site.

## Concept mapping

| Starlight concept | Papyrus path | Compatibility |
| --- | --- | --- |
| `Aside` | Obsidian-style Markdown callouts | Adapt the content syntax; do not import the Starlight component. |
| `Tabs` / `TabItem` | Site-owned MDX component | No Papyrus equivalent until a real cross-site use case exists. |
| `Card` | Purpose-specific Papyrus cards | Do not replace deterministic project, GitHub, or link-preview cards with a generic compatibility wrapper. |
| `Icon` | `astro-papyrus/pure/basic` when suitable | Use the existing public Pure pass-through instead of copying Starlight icons. |
| Generated sidebar | Papyrus collections and `folder.toml` | Map directory order and labels to collection metadata. |
| Component overrides | Explicit Astro imports and local route overrides | Similar composition idea, different runtime contract. |
| `config:setup` | `definePapyrusPlugin().setup` | Concept-only: both configure a plugin, but their arguments and authority differ. |
| `i18n:setup` | None | Keep translations site-owned until Papyrus has a concrete localization requirement. |
| `addIntegration` / route middleware | Consuming `astro.config.mjs` | Keep Astro integrations and middleware under site ownership. |

## When to revisit

Reconsider a narrow adapter only when a specific public Starlight plugin has a
Papyrus use case and can be supported without recreating Starlight's config,
locals, routing, or styling. That work should get its own fixture and audit row.
The broader Papyrus plugin lifecycle remains a separate architecture decision.
