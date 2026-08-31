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

## 2026 theme and analytics research

Static themes do not agree on one "best" analytics provider. The stronger
pattern is to keep analytics disabled by default, provide one or two documented
examples, and leave a clean extension point for site-owned snippets.

- Broad website usage still strongly favors Google Analytics/GA4. W3Techs
  reported Google Analytics at 43.1% of all websites and 78.2% traffic-analysis
  market share on 2026-05-16. Wappalyzer also lists Google Analytics as the
  largest named analytics technology in its current analytics category.
- Astro's ecosystem has multiple approaches rather than one standard. Astro
  documents Partytown as a way to move resource-heavy third-party scripts such
  as analytics off the main thread, the Astro integrations directory lists
  several analytics integrations, Astro Cactus documents analytics as a theme
  feature, and Astro Sienna exposes optional GA4 plus GoatCounter through
  Partytown.
- Hugo themes and Hugo-adjacent docs also keep the matrix open. Hugo has an
  embedded GA4 template, Blowfish documents Fathom, Google Analytics, Umami,
  Seline, and custom partials, and HugoBlox documents Pirsch, Fathom,
  Plausible, Google Analytics, Google Tag Manager, Microsoft Clarity, Baidu,
  and custom hooks.
- Eleventy examples are similarly site-owned. Google's
  `eleventy-high-performance-blog` uses Google Analytics-oriented metadata and
  performance patterns, while other starters mix Plausible, Simple Analytics,
  Google Analytics, and comment-provider switches.
- Reddit-style 2026 summaries are useful as community sentiment, but not strong
  enough to claim a single consensus. They usually criticize GA4's complexity
  and recommend Plausible or Fathom for small sites, Umami for self-hosting,
  Matomo for full-control analytics, PostHog for product analytics, and
  Microsoft Clarity for heatmaps/session recordings.

Papyrus direction: support analytics as an opt-in theme feature or constrained
head hook, keep no analytics as the default, use a privacy-first provider such
as Plausible or Umami in examples, and still support GA4 because it remains the
most common production choice.

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
- Maybe: opt-in analytics config. Disabled by default, production-only by
  default, with examples for GA4, Plausible, Umami, GoatCounter, and custom
  snippets instead of a heavy provider dependency.
- Maybe: broader webmaster verification. Keep the existing Google Search
  Console shorthand, but allow Bing/Yandex/generic verification meta tags.
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
6. Opt-in analytics and broader verification only after the extension-point shape
   is clear.

These fit Papyrus because they reduce copied page/component code in consumers
without making the package feel like a large CMS.
