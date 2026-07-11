# CV source comparison

This note records the old CV sources inspected before claiming any papyrus CV
parity. It is evidence for `PP-110`; it is not proof of exact visual or PDF
parity.

## jekyllcv source

Inspected local source paths:

- `/Users/marcelof/gwt/marcelofpfelix/jekyllcv/master/_layouts/cv.html`
- `/Users/marcelof/gwt/marcelofpfelix/jekyllcv/master/_includes/cv-templates/default.html`
- `/Users/marcelof/gwt/marcelofpfelix/jekyllcv/master/_includes/cv-profile.html`
- `/Users/marcelof/gwt/marcelofpfelix/jekyllcv/master/_includes/cv-sections.html`
- `/Users/marcelof/gwt/marcelofpfelix/jekyllcv/master/_sass/jekyllcv/_layout.scss`

Observed structure:

- `_layouts/cv.html` picks the CV data from `site.data.users` and delegates to
  `cv-templates/<template>.html`.
- The default template renders a print/download prompt, then loops over
  `1..cv.pages` and emits one `section.sheet.padding-10mm` per page.
- Page one includes `cv-profile.html`, then an always-updated canonical CV link.
- Sections are filtered by `section.page`; each matching section delegates to
  `cv-sections.html`.
- The profile include renders avatar, name, bio, contact links, email split into
  `email_user` and `email_domain`, location, computed age, nationality,
  languages, and role tags.
- The section include renders section title/icon/range, group logo/entity link,
  item title, location, dates/range, and markdownified descriptions.
- The SCSS declares `@page { size: A4 }`, base print typography, old `cv_*`
  selectors, floating right-side metadata, circular avatar, section headings,
  entity logos, and footer styling.

## bandonga CV source

No separate local `bandonga/cv` checkout was found during the local search. The
current source backing `bandonga.com/cv/marcelo` is in:

- `/Users/marcelof/gwt/marcelofpfelix/marcelofelix/main/src/data/profile.ts`
- `/Users/marcelof/gwt/marcelofpfelix/marcelofelix/main/src/pages/profile/index.astro`
- `/Users/marcelof/gwt/marcelofpfelix/marcelofelix/main/src/pages/profile/print.astro`
- `/Users/marcelof/gwt/marcelofpfelix/marcelofelix/main/public/cv/marcelo/`

Observed structure:

- `profile.ts` defines typed profile links, metadata, CV sections, grouped
  entities, items, logos, timeline events, and profile projects.
- `profile/print.astro` imports `papyrus-css`, renders `body.A4`, uses
  `pages = [1, 2]`, creates one `section.sheet.padding-10mm` per page, renders a
  first-page profile header/details block, filters `cvSections` by page, and
  keeps a footer at the bottom.
- `profile/index.astro` uses papyrus components: `PapyrusBaseLayout`,
  `PapyrusTimeline`, and `PapyrusGithubCard`.
- The web profile has a sidebar with avatar/contact/info, a print action linking
  `/profile/print/`, a canonical `bandonga.com/cv/marcelo` note, section groups,
  timeline, and project repository cards.

## papyrus mapping

Current papyrus CV pieces checked against those sources:

- `PapyrusJekyllCvPage` keeps the old jekyllcv-style print prompt, sheet/page
  wrapper, first-page profile block, canonical updated note, section filtering,
  group logos/entity links, item metadata, and footer.
- `/docs/cv-demo/jekyll/` exposes the old-style route.
- `PapyrusCvA4Page` and `/docs/cv-demo/print/` expose modern A4 print routes from
  the same normalized CV data.
- `PapyrusCvProfile`, `PapyrusCvHero`, `PapyrusCvLinks`, `PapyrusCvSections`, and
  `PapyrusCvExportActions` expose reusable profile/CV building blocks.
- The demo normalizes upstream-shaped jekyllcv data with
  `normalizeJekyllCvUser`, then reuses it for web profile, export, A4, and
  jekyllcv-style routes.

## Still not proven

The source comparison proves that the old sources were re-read and mapped. It
does not prove:

- exact old jekyllcv visual parity,
- PDF output parity,
- exact `bandonga.com/cv/marcelo` visual parity,
- consuming-site `marcelofelix` integration through the packaged theme.

Those remain tracked under `PP-004`, `PP-102`, `PP-103`, and `PP-104`.
