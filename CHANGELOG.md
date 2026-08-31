# Changelog

## 0.2.3

- Compile package runtime entry points and verify the packed package in an
  isolated Astro consumer.
- Add optional base-path, Markdown text, link-validation, and site-graph
  adapters with focused interoperability fixtures.
- Generate deployment-aware social cards, including post cover images and
  documented source-image precedence.
- Add theme-aware Giscus comments, tag-backed profile skills, desktop post QR
  actions, and JSON Resume-compatible CV exports.

## 0.2.2

- Add configurable tricolor image treatment for post covers and profile
  avatars, including a site-wide `[profile.images]` default.
- Keep inherited profile pages configurable from `papyrus.config.toml` while
  preserving per-profile avatar overrides in `src/data/profile.toml`.

## 0.2.1

- Move public docs into collection-backed posts and keep private agent notes out
  of the human documentation surface.
- Add inherited template pages for profile, search, and collections so
  consuming sites can stay smaller while using the same Papyrus UI.
- Refresh profile, post, collection, search, and local serving behavior for the
  GitHub/Cloudflare template workflow.

## 0.2.0

- Rename the public theme API to `Papyrus*`/`papyrus.*`, including
  `papyrus.config.toml`, `astro-papyrus/papyrus.css`, CSS tokens, data
  attributes, components, layouts, docs, and generated public artifacts. The old
  names are intentionally not kept as compatibility aliases.
- Prepare the package for a real `astro-papyrus` npm release with public
  package metadata, MIT license text, release checklist, and pack verification.
- Add TOML-first site configuration, injected template pages, Pagefind-ready
  search, generated 404/robots/sitemap support, tag pages, and profile/CV
  print/AST exports for consuming sites.
- Replace standalone docs routes with collection-backed docs posts and add
  collection routes that preserve section order, collection-aware post
  navigation, and compact collection membership links on normal post pages.
- Add a Portuguese food recipe collection fixture with nested post folders,
  collection TOML metadata, generated tag RSS feeds, and filename-ordered
  collection navigation.
- Align post index, timeline, tag, share/source, table-of-contents, and archive
  behavior with the current Papyrus demo contract while keeping Lighthouse
  category scores at 100 across generated routes.
- Move consuming sites toward the published `astro-papyrus` package
  instead of local `file:` dependencies.

## 0.1.0

- Package the first Papyrus demo surface: Pure-backed layouts, post lists, post
  pages, theme profiles, search/RSS helpers, profile/CV components, generated
  AI metadata, and focused verification scripts.
