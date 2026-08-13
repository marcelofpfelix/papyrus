# Minimal Mistakes comparison

Tracking row: `PP-200`.

## Source reviewed

- `mmistakes/minimal-mistakes` README and current documentation.
- Layouts documentation for `single`, `archive`, taxonomy archives, home,
  splash, search, headers, sidebars, sharing, custom head/footer.
- Helpers documentation for figures, galleries, feature rows, responsive video
  embeds, table of contents, and navigation lists.
- Configuration documentation for feed icons, search providers, SEO, comments,
  analytics, and webmaster verification.

## Features Papyrus already covers

- Package/theme consumption instead of copying all theme internals.
- Multiple theme profiles/skins.
- Responsive post, archive, search, projects, profile, and collection routes.
- SEO/social metadata, sitemap, robots, RSS, tag RSS, and source metadata.
- Search through Pagefind.
- Table of contents and back-to-top controls.
- Comments decision through Giscus.
- Tag pages and collection pages.
- Share/copy/source actions.
- Docs/demo pages for feature coverage.

## Maybe backlog

These are worth keeping as ideas, but they are not approved implementation work
yet. Create a dedicated `PP-*` row before implementing any of them.

- Maybe: header media model. Frontmatter support for header image, overlay image,
  overlay color/filter, caption, alt text, excerpt/tagline, and CTA actions.
- Maybe: teaser image model. Small card/list image separate from full cover
  image.
- Maybe: breadcrumbs. Optional breadcrumbs for post, collection, tag, and project
  routes, useful for SEO and navigation.
- Maybe: related posts. Configurable "you may also enjoy" section using tags,
  collection membership, or explicit frontmatter.
- Maybe: gallery and figure helpers. Simple authoring syntax for image groups,
  captions, alt text, and responsive layout.
- Maybe: responsive video embed helper. Privacy-conscious YouTube/Vimeo/etc.
  embeds with stable aspect ratio and no layout shift.
- Maybe: per-page classes/style hooks. Safe frontmatter class list for art-directed
  posts without custom route files.
- Maybe: custom head/footer hooks. Limited user-provided slots or components for
  analytics, verification tags, banners, or site-specific snippets.
- Maybe: sidebar blocks. Optional custom sidebar content/navigation for long pages or
  collection sections.

## Features to skip or avoid copying directly

- Jekyll-specific gem, remote-theme, Sass, include-cache, and Liquid helper
  mechanics.
- Full splash/landing-page layout as a default route. Papyrus should stay
  content-first; landing pages can be user-created custom pages.
- Multiple search providers by default. Pagefind should remain the static
  default; Algolia/Google CSE can be documented as advanced custom integrations.
- Heavy analytics defaults. Keep analytics opt-in and site-owned.
- Large icon/font dependencies just for parity. Use existing icon strategy.
- Comments provider matrix. Keep one clean default and allow custom override.

## Recommendation

Papyrus should not chase full Minimal Mistakes parity. If any of these ideas are
implemented later, prioritize content authoring conveniences that keep consumers
small:

1. Header/teaser media frontmatter.
2. Breadcrumbs and related posts.
3. Gallery/figure/video helpers.
4. Page class/style hooks.
5. Small custom head/footer extension points.

These fit Papyrus because they reduce copied page/component code in consumers
without making the package feel like a large CMS.
