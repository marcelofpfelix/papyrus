# AstroPapyrus parity decisions

Papyrus should not claim AstroPapyrus feature parity by default. It should borrow
useful publishing ideas, keep Pure as the UI foundation, and make each parity
choice explicit before a release note says the feature exists.

## v0.2.0 decision table

| Feature area | Decision | Evidence or follow-up |
| --- | --- | --- |
| Typed central config resolver | Implemented in Papyrus | Tracked by PP-158. `astro-papyrus/config` loads `papyrus.config.toml`; the remaining follow-up is consuming-site migration. |
| Pagefind search option | Implemented as demo pattern | `/search/`, Pagefind build output, and browser verification cover the current package demo. `papyrus.config.toml` now carries the `features.search` flag consumed by layouts. |
| Dynamic OG image route | Defer | Static cover/card-cover generation exists. A dynamic HTTP route needs its own design so package and consuming sites can choose routing and caching. |
| Edit/source post links | Implemented | `PapyrusPostLayout` supports source actions, source copy, source link copy, and Web Share fallback behavior. |
| Share links | Implemented | Post actions use the Web Share API when available and fall back to copying the current URL. |
| Pagination and per-index config | Defer full pagination | Post-card limits and display flags now load from `papyrus.config.toml`. Full reusable pagination helpers are a separate feature because they need route-shape, page-size, RSS, sitemap, and canonical URL decisions. |
| Scheduled post margin | Defer | Current helpers filter drafts/hidden posts and sort published content. Future-dated scheduling needs an explicit release policy and tests. |
| Archive toggle | Implemented as hidden archive/search pattern | Hidden posts stay out of public indexes and can be reached through the archive/search route when configured. |
| Pages collection | Defer | Papyrus currently treats pages as Astro routes and docs/posts as content collections. A first-class pages collection needs a consuming-site migration story. |
| Language, direction, timezone, profile, and verification config | Implemented for serializable config | `papyrus.config.toml` carries language, direction, timezone, theme/font profile, and Google verification fields. Astro integration wiring remains site-owned because each consuming site chooses its routes and integrations. |
| MDX | Defer | Markdown coverage is strong. MDX should be added only with fixture routes and clear component import guidance. |
| Sitemap integration | Implemented in demo pattern | The demo builds sitemap output and dynamic `robots.txt` points crawlers to the sitemap. Integration setup remains site-owned because Astro integrations live in the consuming app's `astro.config.*`. |

## Release rule

Before release notes claim AstroPapyrus parity, every row above must either be
implemented with a verifier, explicitly deferred with rationale, or rejected as
outside the Papyrus package boundary.
