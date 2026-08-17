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
---

Start with
[`papyrus-template`](https://github.com/marcelofpfelix/papyrus-template).
The template keeps the site repo small: config, profile data, posts, and
assets. The package provides the routes, layouts, post UI, collections, RSS,
robots, search hooks, profile pages, and theme CSS.

## Start from the template

Create a repository from `papyrus-template`, then install dependencies:

```sh
pnpm install
pnpm dev
```

The template depends on the package:

```json title="package.json"
{
  "dependencies": {
    "astro-papyrus": "^0.2.2"
  }
}
```

Use the npm package for normal sites. It is the stable path for template users
because it resolves like any other dependency:

```sh
pnpm add astro-papyrus@^0.2.2
```

Use a pinned GitHub dependency only when testing unreleased Papyrus work or
waiting for a new npm release to pass the registry maturity window:

```sh
pnpm add github:marcelofpfelix/papyrus#0.2.2
```

A branch name is convenient for preview work, but a tag or commit SHA is safer
for real sites because it makes rebuilds repeatable.

It enables Papyrus in Astro:

```js title="astro.config.mjs"
import { definePapyrusAstroConfig } from "astro-papyrus/astro";

export default definePapyrusAstroConfig();
```

Custom routes can read the same TOML file through `loadPapyrusConfig`:

```ts
import { loadPapyrusConfig } from "astro-papyrus/config";
```

It also reuses the Papyrus content collection:

```ts title="src/content.config.ts"
export { collections } from "astro-papyrus/content";
```

Papyrus adds these routes:

| Route | Source |
| --- | --- |
| `/` | Home page with latest posts and project cards |
| `/posts/` | Public post list |
| `/posts/[...slug]/` | Post detail page |
| `/projects/` | Project cards from `src/data/projects.toml` |
| `/profile/`, `/profile/print/`, `/profile/ast/` | Profile and CV pages from `src/data/profile.toml` |
| `/tag/` and `/tag/[tag]/` | Tag index and tag detail pages |
| `/404.html` | Helpful not-found page |
| `/rss.xml` | Main RSS feed |
| `/robots.txt` | Robots file with sitemap URL |

Because the pages are injected by the package, the template does not need a
`src/pages` tree unless your site adds custom routes.

## Know `src` vs `public`

Papyrus follows Astro's normal file boundary: `src/` is source, and `public/`
is copied to the deployed site as-is.

Use `src/` for files Astro should read, transform, type-check, or route during
the build:

- `src/content/posts/*.md` for posts
- `src/content/posts/**/folder.toml` for ordered collections
- `src/content.config.ts` for the Papyrus content collection export
- `src/data/profile.toml` for the profile and CV source
- `src/pages/*.astro` only when you need a custom route

Use `public/` for files that should keep the same URL and contents after build:

- `public/logo.svg`, `public/favicon.svg`, and `public/site.webmanifest`
- `public/images/*` for covers, avatars, and project images
- generated artifacts such as `public/cv/profile.json`, `public/cv/profile.md`,
  `public/ai/*`, `public/rss/tags/*`, and `public/pagefind/*`

Do not hand-edit generated files in `public/`. Edit the source in `src/`,
`papyrus.config.toml`, or `src/data/profile.toml`, then regenerate artifacts.

## Edit the right file

For normal site work, start with these files:

| Goal | Edit |
| --- | --- |
| Site title, description, navigation, theme, feature flags, homepage counts, and post-card defaults | `papyrus.config.toml` |
| Project cards | `src/data/projects.toml` |
| Add or edit posts | `src/content/posts/*.md` |
| Add ordered docs or guide sections | `src/content/posts/<folder>/<folder>.toml` plus Markdown posts |
| Change the profile, CV, links, skills, dates, and print color | `src/data/profile.toml` |
| Change logos, favicons, covers, avatars, and project images | `public/` assets |

The package repo has many files because it owns the reusable components, routes,
scripts, styles, and demo fixtures. A site repo should stay closer to the
template shape: config, content, profile data, and assets.

## Add posts

Posts live in `src/content/posts`. A minimal post needs a title, description,
date, and optional tags.

```md title="src/content/posts/publishing-with-papyrus.md"
---
title: Publishing with Papyrus
description: A short implementation note published from a Papyrus-powered site.
date: 2026-07-10T09:00:00.000Z
tags: [astro, papyrus]
cover: /images/cover.svg
---

Write the post body in Markdown.
```

Papyrus handles list pages, detail pages, adjacent links, tags, scheduled posts,
reading time, cover images, RSS entries, generated route paths, and generated
social preview cards. A post does not need `cover` frontmatter to get an Open
Graph/X sharing image. When a post has a cover, Papyrus uses it inside the
generated social card instead of pointing `og:image` directly at the original
cover file.

Use `ogSourceImage` when the best social-card visual is an image from the post
body instead of the article cover:

```md
---
title: Publishing with Papyrus
description: A short implementation note published from a Papyrus-powered site.
date: 2026-07-10T09:00:00.000Z
cover: /images/article-cover.jpg
ogSourceImage: /images/body-diagram.jpg
---
```

Use `ogImage` only when you already have a finished `1200x630` social image and
want to bypass the generated card for that post.

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

## Next steps

- Configure the site in [Site config](/collections/docs/site-config/).
- Learn content features in [Markdown authoring guide](/collections/docs/markdown-feature-sample/).
- Use ordered docs or guides with [Collections](/collections/docs/collections/).
- Review the package boundary in [Papyrus package shape](/collections/docs/papyrus-package-shape/).
