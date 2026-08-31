# Comments provider research

Tracking row: `PP-129`.

## 2026 source scan

There is no single modern winner across Astro, Hugo, Eleventy, Jekyll, and
static-site themes. The common pattern is provider choice through config, with
comments disabled or site-owned by default.

- Papyrus currently uses `PapyrusGiscusComments` and documents Giscus as the
  default decision.
- AstroPaper documents a Giscus integration. Giscus fits AstroPaper's
  GitHub-hosted static blog model and developer audience.
- Astro Cactus does not pick a normal comment widget. Its distinctive community
  feature is Webmentions through Webmention.io, which fits IndieWeb/POSSE
  workflows more than classic comment threads.
- Astro Pure exposes Waline in its integration config. Waline is more complete
  than Giscus for anonymous/social login, reactions, moderation, page views, and
  richer comment features, but it requires a deployed server/storage backend.
- Hugo itself still ships an embedded Disqus partial, but its docs list many
  alternatives, including Giscus, Isso, Remark42, Staticman, Talkyard, and
  Utterances.
- Hugo Stack exposes a broad provider matrix: Cactus, Comentario, Cusdis,
  Disqus, DisqusJS, Giscus, Gitalk, Remark42, Twikoo, utterances, Vssue, and
  Waline.
- Minimal Mistakes follows the older broad-matrix pattern: Disqus, Facebook,
  Discourse, Staticman, utterances, Giscus, and custom provider hooks.
- Eleventy examples are mostly site-owned snippets. They tend to use Giscus,
  Disqus, Webmentions, Cusdis, or custom code rather than a framework-level
  standard.

## Provider tradeoffs

- Giscus: best default for developer blogs. It is free, open source, ad-free,
  no-tracking, stores data in GitHub Discussions, supports reactions/themes, and
  requires no database. The cost is GitHub account/OAuth friction for readers.
- Utterances: similar zero-infrastructure idea, but uses GitHub Issues. It is
  simpler, but GitHub Discussions feels like a better long-term comment model
  than polluting issues.
- Waline/Twikoo: richer product features and better non-developer commenting,
  but they require backend deployment and operational ownership.
- Cusdis: lightweight, privacy-first, and friendly for non-GitHub readers. It
  is a good optional provider or custom-snippet example, but not as common in
  Astro/Jekyll developer-blog templates as Giscus.
- Webmentions: excellent for IndieWeb/social-reply capture, but not a direct
  replacement for a comment box. It works best as an additional interaction
  source.
- Disqus: still has broad legacy support and is easy for non-technical users,
  but it is the wrong default for a privacy/performance-focused static theme.
- Remark42/Isso/Comentario/Staticman: viable for sites that want ownership, but
  they create backend/rebuild/ops work that a simple static theme should not
  assume.

## Reddit/community signal

Direct Reddit search did not show a clean 2026 consensus thread. The reliable
signal is more diffuse:

- Developer-blog discussions and theme docs repeatedly converge on Giscus when
  the audience is technical and GitHub-based friction is acceptable.
- Self-hosting/privacy discussions favor Cusdis, Remark42, Isso, Waline, or
  Twikoo when anonymous comments, moderation dashboards, or non-GitHub users
  matter.
- Disqus is mostly treated as legacy: convenient, but poor for privacy and page
  weight.

## Papyrus recommendation

Keep Giscus as the built-in default provider because Papyrus is a developer
blog/theme package, already GitHub-oriented through source links and template
usage, and should not require a database or backend.

If Giscus is rejected after real use, the top alternative is Cusdis. It is the
smallest fallback that addresses Giscus's main weakness: readers do not need a
GitHub account. It is lightweight, privacy-first, open source, has a hosted
option, can be self-hosted, supports moderation by email/dashboard, and fits a
static theme better than a large backend-first comment system. The tradeoff is
that comments live in Cusdis/Cusdis-owned storage unless the site self-hosts,
and it has less theme/template adoption than Giscus in developer-focused Astro
and Jekyll blogs.

Waline should be the richer fallback, not the first fallback. It is stronger
when a site wants anonymous comments, social login, reactions, page views,
Markdown, image uploads, anti-spam controls, and a full moderation workflow.
That feature set is useful, but it also means the site has accepted a backend
and operational ownership. Papyrus should not make that the next built-in
provider unless a consuming site explicitly needs those features.

Do not add a large provider matrix now. If comments evolve, add a small provider
adapter shape:

1. `provider = "giscus" | "cusdis" | "custom"`
2. `enabled = true | false`
3. per-post `comments = false`
4. a constrained custom component/snippet hook for Cusdis, Waline, Webmentions,
   or any site-owned provider

Only add a second built-in provider after a real consuming site needs it. The
first candidate is Cusdis for lightweight non-GitHub comments. Webmentions can
be added separately as an IndieWeb/social-reply layer, but it should not be
treated as the direct replacement for a normal comment box.
