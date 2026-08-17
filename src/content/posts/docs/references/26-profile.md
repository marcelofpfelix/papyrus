---
title: Profile and CV
description: What the Papyrus profile data file controls and how profile, print, and export routes share it.
slug: profile
pubDatetime: 2026-07-13T08:20:00.000Z
category: Docs
license: CC-BY-4.0
tags:
  - papyrus
  - profile
  - cv
  - reference
---

The profile page reads `src/data/profile.toml`. The same data feeds the web
profile page, timeline view, print routes, generated Markdown, and generated
JSON.

Keep personal data in this TOML file instead of hardcoding it in components.
That makes the site easier to review, export, and print.

## User fields

```toml title="src/data/profile.toml"
[user]
name = "Site Author"
avatar = "images/avatar.svg"
bio = "Writer and software engineer"
url = "site.test"
print_color = "#37474F"
email_user = "hello"
email_domain = "site.test"
links = ["linkedin", "github"]
print_links = ["email", "linkedin", "github", "website"]
location = "Lisbon, Portugal"
born = "1991-04-18T00:00:00"
roles = ["Software Engineer", "Technical writer"]
sections = ["about", "experience", "education", "skills"]
```

Set site-wide avatar treatment in `papyrus.config.toml`:

```toml title="papyrus.config.toml"
[profile.images]
effect = "tritone"
```

The site default applies to profile-page images such as the avatar and company
or education logos. Use `avatar_effect` in this file only when one profile
should override that site default for the avatar. Supported values are `none`,
`duotone`, `tritone`, `dither`, and `dithernoise`.

Hide profile tabs per profile with `[user.profile_tabs]`:

```toml title="src/data/profile.toml"
[user.profile_tabs]
timeline = false
projects = false
```

Available keys are `resume`, `timeline`, `projects`, and `skills`. Omitted keys
default to visible.

Use `email_user` and `email_domain` instead of a single literal email address
when you want the page to assemble the visible contact with less obvious static
scraping. It is not cryptographic protection; it only avoids the most basic
email harvesters.

## Links

Each named link can define a display name, base URL, and icon:

```toml title="src/data/profile.toml"
[user.github]
name = "site-owner"
url = "https://github.com/"
icon = "github"

[user.linkedin]
name = "site-owner"
url = "https://www.linkedin.com/in/"
icon = "linkedin"
```

The web profile can show a broader set of links through `links`. Print routes
can use a smaller set through `print_links`.

## Sections

Sections are declared in `[user.data.*]`. They can represent about text,
experience, education, skills, interests, projects, or any site-specific CV
group that follows the same structure.

```toml title="src/data/profile.toml"
[user.data.experience]
title = "Professional Experience"
icon = "briefcase"
page = 1
groups = ["company"]

[user.data.experience.range]
a = "2022-01-01T00:00:00"
b = "2026-07-01T00:00:00"

[user.data.experience.company]
entity = "Company"
url = "https://github.com/marcelofpfelix/papyrus"
items = ["role"]

[user.data.experience.company.role]
title = "Senior Engineer"
dates = "2022 - Present"
location = "Remote"
description = "Built and maintained content-heavy web systems."

[user.data.experience.company.role.range]
a = "2022-01-01T00:00:00"
```

Date ranges are used for calculated age and experience durations. Items without
dates can still appear in the profile, but timeline-style views should only show
dated material.

## Skills

Skills can be written as tags and prose. Tag-style skills can link naturally to
tag pages when the site uses matching post tags. Papyrus only links a skill tag
when a public post already has that tag, so the profile does not create dead tag
links.

```toml title="src/data/profile.toml"
[user.data.skills.skills.skills]
tags = ["astro", "markdown", "theme", "search"]
description = """-- Astro content collections and static builds.<br>
-- Markdown rendering, callouts, code blocks, and diagrams."""
```

Keep skill icons optional. If a site uses technology logos, prefer a maintained
set such as Devicon or skill-icons, and keep the printable CV mostly text-first.
Skill chips should help readers find related writing or projects, not behave
like subjective progress bars.

## Topic feeds

Papyrus can generate one RSS feed per tag with `pnpm run rss-tags`. This lets
readers subscribe only to the topics they care about, such as release notes,
technical posts, or personal notes, without splitting the site into separate
blogs.

## Export and print

Run the export command after editing profile data:

```sh
pnpm run cv:export
```

The command writes `public/cv/profile.json` and `public/cv/profile.md`. Web
routes use the TOML source. The generated files are useful for sharing, source
actions, and external review. The Papyrus JSON export keeps the normalized
Papyrus CV shape. A JSON Resume-compatible export is a planned optional output
for tools that expect `resume.json`.

The profile page links to print routes. The modern print route and classic ATS
route use the same data, so the site does not maintain multiple resumes by hand.
