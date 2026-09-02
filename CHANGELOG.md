# Changelog

## 0.2.4

- Publish optional raw Markdown representations at `/posts/<slug>.md` and
  `/collections/<collection>/<slug>.md` through one shared cleaner.
- Generate `/profile.keys` and `/profile.gpg` from raw public keys configured
  in `src/data/profile.toml`, without redundant fingerprint metadata.
- Add configurable collection and section breadcrumbs to collection posts.
- Reapply the selected color mode after Astro client-side navigation so pages
  do not switch back to light mode.
- Let collection section labels differ from their source directory names, and
  preserve absolute tag-feed URLs during local and Cloudflare builds.
- Keep canonical and collection post routes on one shared layout-props path so
  metadata, actions, comments, tags, typography, and feature flags stay in sync.
- Add standalone Markdown pages inherited from `src/content/pages`, and apply
  the configured theme before first paint to avoid a light-theme flash.
- Export a framework-neutral GitHub repository-card renderer for components and
  optional external Markdown plugins.
- Add deduplicated tags plus collection and section context to generated post
  social cards while preserving explicit social-image and cover precedence.
- Generate `1200x630` PNG social cards with explicit Open Graph image metadata
  for more reliable social crawler support.
- Keep canonical and social URLs on the configured production origin during
  preview builds.
- Add configurable Open Graph locale and X/Twitter attribution metadata, plus
  a generated 32px PNG favicon for search crawlers; minimal consumers default
  to English when no language is configured.
- Remove generated social cards when posts are drafts so unpublished content
  does not leave a public preview asset behind.
- Register the bundled Kamailio syntax definition and `kam` alias through the
  default Markdown configuration inherited by consumer sites.
- Keep collection post URLs relative to their collection instead of repeating
  the collection slug.
- Let Git consumers use the tracked compiled runtime without running a local
  package lifecycle build; release CI regenerates the runtime explicitly.

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
