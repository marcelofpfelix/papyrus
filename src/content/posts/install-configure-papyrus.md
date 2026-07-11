---
title: "Install and configure Papyrus"
description: "Use papyrus-template as the recommended starting point, then configure the site with TOML, Markdown, and asset overrides."
slug: install-configure-papyrus
pubDatetime: 2026-07-10T09:00:00.000Z
license: CC-BY-4.0
pinned: 3
cover: /images/papyrus-layout.svg
tags:
  - papyrus
  - astro
  - docs
docs:
  section: start
  order: 5
  title: Install and configure Papyrus
  description: Template-first setup for a Papyrus site.
---

The recommended way to start a Papyrus site is to use `papyrus-template`. The
template keeps site-owned files small: one site config, one profile config, one
example post, and a few asset overrides. Papyrus provides the layouts,
standard pages, content collection, RSS route, robots route, post UI, profile
components, and theme CSS through the published `astro-theme-papyrus` package.

## Start from the template

Create a new repository from `papyrus-template`, then install dependencies:

```sh
pnpm install
pnpm dev
```

The package repo uses pnpm's mature-release guard:
`minimumReleaseAge: 10080` and `minimumReleaseAgeStrict: true`. That seven-day
gate makes installs fail instead of silently falling back when a dependency was
published too recently.

The template depends on the npm package:

```json title="package.json"
{
  "dependencies": {
    "astro-theme-papyrus": "^0.1.0"
  }
}
```

The template enables Papyrus in Astro:

```js title="astro.config.mjs"
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import { loadPaperConfig } from "astro-theme-papyrus/config";
import papyrus from "astro-theme-papyrus/integration";

const paper = await loadPaperConfig();

export default defineConfig({
  site: paper.site,
  integrations: [papyrus(), sitemap()],
});
```

It also reuses the Papyrus content collection:

```ts title="src/content.config.ts"
export { collections } from "astro-theme-papyrus/content";
```

Papyrus injects these standard routes from the package:

| Route | Source |
| --- | --- |
| `/` | Home page with latest posts and project cards |
| `/posts/` | Public post list |
| `/posts/[...slug]/` | Post detail page |
| `/projects/` | Project cards from `paper.config.toml` |
| `/profile/` | Profile page from `src/data/profile.toml` |
| `/tag/` and `/tag/[tag]/` | Tag index and tag detail pages |
| `/404.html` | Helpful not-found page |
| `/rss.xml` | Main RSS feed |
| `/robots.txt` | Robots file with sitemap URL |

Because the pages are injected by the package, the template does not need a
`src/pages` tree.

## Know `src` vs `public`

Papyrus follows the same Astro convention used by Paper-style starter repos:
`src/` is source, `public/` is static output input.

Use `src/` for files Astro should read, transform, type-check, or route during
the build:

- `src/content/posts/*.md` for posts
- `src/content.config.ts` for the Papyrus content collection export
- `src/data/profile.toml` for the profile and CV source
- `src/pages/*.astro` only when a consuming site needs custom routes that the
  package does not already provide

Use `public/` for files that should be copied to the deployed site as-is:

- `public/logo.svg`, `public/favicon.svg`, and `public/site.webmanifest`
- `public/images/*` for covers, avatars, and project images referenced by
  frontmatter or `paper.config.toml`
- generated artifacts such as `public/cv/profile.json`,
  `public/cv/profile.md`, `public/ai/*`, `public/rss/tags/*`, and
  `public/pagefind/*`

Do not hand-edit generated files in `public/`. Edit the source in `src/`,
`paper.config.toml`, or `src/data/profile.toml`, then regenerate the artifacts.

## Edit the right file

For normal site work, start with these files:

| Goal | Edit |
| --- | --- |
| Site title, description, nav, social links, projects, theme, feature flags, and post-card defaults | `paper.config.toml` |
| Add or edit posts | `src/content/posts/*.md` |
| Add a page that Papyrus does not already inject | `src/pages/*.astro` |
| Change the profile, CV, links, skills, dates, and print color | `src/data/profile.toml` |
| Change logos, favicons, covers, avatars, and project images | `public/` assets |

The package repo has many files because it owns reusable components, injected
routes, scripts, and demo fixtures. A consuming site should stay closer to the
template shape: config, content, profile data, and assets.

Long-lived site copy should live in Markdown, TOML, JSON, or other site-owned
data. Components may keep generic fallback labels such as `Back`, `Share`,
`Source`, or `On this page`, but site-specific text should not be hidden inside
package code. Demo routes in this repository can contain route-local prose when
they are examples; if that prose becomes user documentation, move it into a post
or docs content source.

## Edit the site config

Most site behavior starts in `paper.config.toml`. The template keeps the system
color preference as the default and uses the Everforest theme profile.

```toml title="paper.config.toml"
[site]
title = "My site"
description = "Notes, projects, and profile."
url = "https://site.test"
lang = "en"
dir = "ltr"
timezone = "Europe/Lisbon"

[brand]
title = "My site"
mark = "twinkle"
show_title = true

[theme]
profile = "everforest"
font_profile = "readable"

[features]
graph = false
search = false
comments = false
postStats = false

[post_card]
tags = true
read_time = true
fresh_indicators = true
fresh_indicator_text = false
updated_date_only = true
limit = 20

[[nav]]
href = "/posts/"
label = "Posts"

[[nav]]
href = "/projects/"
label = "Projects"

[[nav]]
href = "/profile/"
label = "Profile"

[[project]]
title = "My site"
description = "The site built from papyrus-template."
href = "/posts/welcome/"
image = "/images/cover.svg"
repo = "https://github.com/site-owner/site"
pinned = true
status = "active"

  [[project.links]]
  href = "https://github.com/site-owner/site"
  label = "repo"
  text = "site-owner/site"
```

Use exactly the project cards you want to publish. The starter keeps two
projects to demonstrate local and upstream links without turning the template
into a demo catalog.

## Add posts

Posts live in `src/content/posts`. A minimal post needs a title, description,
date, and optional tags.

```md title="src/content/posts/publishing-with-papyrus.md"
---
title: Publishing with Papyrus
description: A short implementation note published from a Papyrus-powered site.
pubDatetime: 2026-07-10T09:00:00.000Z
tags: [astro, papyrus]
cover: /images/cover.svg
---

Write the post body in Markdown.
```

Papyrus handles list pages, detail pages, adjacent post links, tags, reading
time, cover images, RSS entries, and the generated route paths.

## Edit the profile

The profile page reads `src/data/profile.toml`.

```toml title="src/data/profile.toml"
[user]
name = "Site Author"
title = "Software Engineer"
bio = "Writer and software engineer"
location = "Lisbon, Portugal"
print_color = "#37474F"
email_user = "hello"
email_domain = "site.test"
sections = ["about", "experience", "education", "skills"]
```

The same profile data can be exported to JSON and Markdown with:

```sh
pnpm run cv:export
```

## Override assets

Keep visual identity in `public/`:

- `public/logo.svg`
- `public/favicon.svg`
- `public/site.webmanifest`
- `public/images/cover.svg`
- `public/images/avatar.svg`
- project images referenced by `paper.config.toml`

These are normal site assets. Papyrus supplies the components and theme CSS,
while the consuming site supplies its own images and metadata.

## Advanced composition

The template is the recommended path. For a custom site that needs different
routes, import Papyrus components directly:

```astro
---
import { PaperBaseLayout, PaperPostList } from "astro-theme-papyrus/components";
import { publishedPosts, routablePosts } from "astro-theme-papyrus/utils";

const allPosts = await getCollection("posts");
const posts = publishedPosts(allPosts);
const routePosts = routablePosts(allPosts);
const adjacentPosts = publishedPosts(allPosts);
---

<PaperBaseLayout title="My site" description="Custom page.">
  <PaperPostList posts={posts} />
</PaperBaseLayout>
```

Use `routePosts` when creating static post detail paths. Use `adjacentPosts`
when computing previous/next links so hidden archive pages can still exist as
routes without showing up in public navigation.

In a post-detail route, pass folder-aware tags into the post layout:

```astro
<PaperPostLayout post={post} tags={postTags(post)}>
  <Content />
</PaperPostLayout>
```

Keep the boundary clear: Papyrus owns reusable pages, components, styles, and
helpers. The consuming site owns content, TOML config, asset overrides, private
data, analytics, and deployment settings.
