---
title: Profile and CV
description: What the Papyrus profile data file controls and how profile, print, and export routes share it.
slug: profile
pubDatetime: 2026-07-13T08:20:00.000Z
category: Docs
tags:
  - papyrus
  - profile
  - cv
  - reference
---

The profile system is driven by `src/data/profile.toml`. The same source data is
used by the web profile page, timeline view, print routes, generated Markdown,
and generated JSON.

Keep personal data in this TOML file instead of hardcoding it in components.
That makes a consuming site easier to template, review, export, and print.

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
ententy = "Company"
url = "https://example.com/"
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
tag pages when the site uses matching post tags.

```toml title="src/data/profile.toml"
[user.data.skills.skills.skills]
tags = ["astro", "markdown", "theme", "search"]
description = """-- Astro content collections and static builds.<br>
-- Markdown rendering, callouts, code blocks, and diagrams."""
```

## Export and print

Run the export command after editing profile data:

```sh
pnpm run cv:export
```

The command writes `public/cv/profile.json` and `public/cv/profile.md`. The web
routes use the TOML source, while the generated artifacts are useful for sharing,
source actions, and external review.

The profile page links to print routes. The modern print route and classic ATS
route should use the same normalized data so the site does not maintain multiple
resumes by hand.
