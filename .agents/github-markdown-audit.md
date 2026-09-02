# GitHub Markdown compatibility audit

Reviewed: 2026-09-02

## Scope

This audit compares Papyrus authoring with:

- the [GitHub Flavored Markdown specification](https://github.github.com/gfm/)
- GitHub's [basic writing and formatting syntax](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)
- GitHub's [advanced formatting](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting)
- GitHub's current documentation for [code blocks](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-and-highlighting-code-blocks), [diagrams](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams), [math](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/writing-mathematical-expressions), and [autolinked references](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/autolinked-references-and-urls)

The comparison is about Markdown source and rendered articles. GitHub editor,
notification, issue-management, repository browser, and upload behavior is
listed separately instead of being treated as missing blog functionality.

States:

- **Supported**: the documented source form renders with the useful behavior.
- **Partial**: the syntax renders, but GitHub and Papyrus differ materially.
- **Missing**: useful file-oriented rendering is absent.
- **Not applicable**: the behavior depends on GitHub's repository or
  conversation UI rather than Markdown rendering.
- **Intentional difference**: Papyrus deliberately follows Astro or static-site
  behavior instead of GitHub's output.

## Rendering baseline

`src/markdown/config.mjs` uses `@astrojs/markdown-remark` 7.2.2. Its processor
uses `remark-parse`, `remark-gfm` 4.0.1, `remark-rehype`, `rehype-raw`, and
GitHub Slugger. Papyrus adds callouts, task-list labels, artifact links,
Mermaid blocks, Shiki transforms, and the Kamailio grammar.

A direct processor probe on 2026-09-02 verified tables, static task lists,
single- and double-tilde strikethrough, URL and email autolinks, five alert
types, footnotes, duplicate heading suffixes, Markdown inside `<details>`, and
Mermaid. The same probe confirmed that emoji codes, math, GeoJSON maps,
mentions, issue references, and color chips are not transformed. It also
confirmed that raw `<script>` elements are retained.

## Formal GFM

| Feature | State | Papyrus evidence and difference |
| --- | --- | --- |
| CommonMark blocks and inline syntax | Supported | Astro's `remark-parse` handles headings, paragraphs, thematic breaks, blockquotes, lists, code, links, images, references, emphasis, escapes, entities, and line breaks. `src/content/posts/docs/authoring/12-markdown-feature-sample.md` exercises the main forms. Papyrus does not run the complete upstream CommonMark conformance suite itself. |
| GFM tables | Supported | `remark-gfm` renders tables, escaped pipes, inline formatting, and left, center, and right alignment. Both Markdown demo pages contain tables. |
| GFM task-list items | Supported | `remark-gfm` renders disabled checkboxes; `rehype-task-list-labels.mjs` adds accessible labels. GitHub's issue-progress and editing UI is not part of a static article. |
| GFM strikethrough | Supported | Both `~~double~~` and GitHub's single-tilde `~single~` forms rendered as `<del>` in the processor probe. |
| GFM extended autolinks | Supported | Bare HTTP(S) URLs and email addresses rendered as links in the processor probe. |
| GFM tag filtering | Intentional difference | GFM escapes unsafe raw tags such as `script`, `style`, `iframe`, and `textarea`. Astro enables dangerous HTML and `rehype-raw`; the probe retained `<script>`. Papyrus therefore assumes trusted repository content and is not safe for rendering untrusted Markdown without an added sanitization boundary. |

Papyrus supports the four visible GFM syntax extensions, but it is not strictly
GFM-conformant because it does not apply GFM's tag-filter extension.

## GitHub file formatting

| Feature | State | Papyrus evidence and difference |
| --- | --- | --- |
| Heading IDs | Supported | Astro uses GitHub Slugger. Duplicate headings produced `repeat` and `repeat-1`, matching GitHub's suffix rule. |
| Heading permalink control | Partial | Post and collection TOCs link to headings, but headings do not expose GitHub's hover permalink icon inline. |
| Bold, italic, nested emphasis, subscript, superscript, and underline | Supported | Markdown emphasis works through `remark-parse`; `<sub>`, `<sup>`, and `<ins>` work because trusted raw HTML is enabled. |
| Blockquotes and alerts | Supported | Plain and nested blockquotes render. `rehype-callouts` handles GitHub's Note, Tip, Important, Warning, and Caution syntax; Papyrus also supports Obsidian-style collapsed and expanded callouts. |
| Inline and fenced code | Supported | Astro and Shiki render code spans and fenced blocks. Papyrus adds titles, copy, collapse, line highlighting, and diff notation. |
| Syntax-highlight language parity | Partial | Shiki supports a broad language set and Papyrus adds Kamailio, but it does not promise exact parity with GitHub Linguist's language registry or grammar versions. Unknown languages fall back to plaintext. |
| Paragraphs, lists, nesting, escapes, and hard breaks | Supported | These are covered by the CommonMark parser and the Markdown authoring guide. |
| Links and reference links | Supported | Standard Markdown links and definitions render normally. |
| Relative links | Partial | Browser-relative links work, and the optional base-path plugin handles site base paths. Papyrus routes are not Git branches, so GitHub's branch-aware source-file rewriting is neither reproduced nor desirable. Authors should use stable site routes for internal links. |
| Images and `<picture>` | Supported | Markdown images, raw `<img>`, and raw `<picture>` render. Astro can process source-relative images; root-relative public assets remain supported. Papyrus theme-aware SVG guidance uses CSS variables rather than GitHub-only URL fragments. |
| Custom anchors | Supported | Raw `<a name="...">` anchors render and fragment links work. As on GitHub, they are not automatically added to the heading TOC. |
| Collapsed sections | Supported | `<details>`, `<summary>`, the `open` attribute, and Markdown inside the details body render. |
| HTML comments | Supported | Comments remain in generated HTML source but are not visible in the rendered page. |
| Footnotes | Supported | Astro emits linked references, a footnote section, and accessible back-links. The older code-demo fallback statement was incorrect and was removed by this audit. |
| Emoji codes such as `:information_source:` | Optional | Codes remain literal in core. The external `marcelofpfelix/papyrus-plugins` package provides the build-time `remarkPapyrusEmoji` transform without browser JavaScript. |
| Inline and block math | Missing | `$...$`, `$$...$$`, and `math` fences do not render equations. A math fence remains a code block. |
| Mermaid diagrams | Supported | `remark-mermaid-blocks.mjs` and the shared Mermaid runtime render fenced Mermaid diagrams and respond to theme changes. |
| GeoJSON and TopoJSON maps | Missing | Fences fall back to plaintext code; Papyrus has no map renderer. |
| ASCII STL models | Missing | STL fences fall back to plaintext code; Papyrus has no 3D model viewer. |
| Color previews in inline code | Not applicable | GitHub documents color chips only for issues, pull requests, and discussions, not repository Markdown files. Papyrus correctly keeps the value as inline code. |
| Raw HTML sanitization | Intentional difference | GitHub sanitizes and tag-filters user content. Papyrus preserves trusted raw HTML so Astro components, details, picture elements, and theme-aware SVG examples work. This trust boundary must be documented wherever third-party content ingestion is discussed. |
| View source | Partial | Post actions can copy Markdown and link to the configured GitHub source. Papyrus does not reproduce GitHub's repository file viewer or per-line source links. |

## GitHub context behavior

These features are useful on GitHub but are not portable Markdown-file
rendering and should not be enabled implicitly in Papyrus:

| GitHub behavior | State | Reason |
| --- | --- | --- |
| `@user` and `@org/team` mentions | Not applicable | Linking, autocomplete, permissions, and notifications require GitHub identity and conversation context. |
| `#123`, `GH-123`, `owner/repo#123`, discussion, label, and commit references | Not applicable | GitHub's own documentation says issue and pull-request shortlinks are not created in repository files or wikis. A blog cannot infer the intended repository safely. Explicit URLs already autolink. |
| Custom repository autolinks | Not applicable | These are repository settings backed by GitHub, not GFM syntax. A future explicit link-rewrite plugin could serve a site with a concrete need. |
| Backlinks from referenced issues and pull requests | Not applicable | This is GitHub database behavior. Papyrus's separate site backlink work should use content links, not imitate issue notifications. |
| Drag-and-drop uploads and attachments | Not applicable | This belongs to an editor or CMS. Markdown links and images render once an author adds the asset. |
| Interactive issue task lists and progress | Not applicable | Papyrus renders accessible static task-list state but does not edit source from the browser. |
| Closing keywords, saved replies, and gist controls | Not applicable | These are GitHub workflow and editor features rather than Markdown rendering. |
| Permanent repository line links | Not applicable | Such links work when an author pastes a GitHub permalink, but creating and resolving them belongs to GitHub's source browser. |

## Recommended priorities

1. **Emoji plugin (`PP-244`)**: useful, familiar, build-time, and small enough to
   keep optional. This is the only missing feature already approved as an
   implementation task.
2. **Document the raw-HTML trust boundary**: important if Papyrus ever accepts
   Markdown from users, feeds, APIs, or pull requests that bypass repository
   review. A strict or sanitized mode should be a separate security design, not
   a silent default change.
3. **Optional math plugin**: worthwhile for technical and academic sites if it
   can render accessibly without forcing MathJax onto sites that do not use it.
4. **Heading permalink icon**: small reader-facing parity improvement, but the
   existing TOC already provides section links.
5. **GeoJSON/TopoJSON plugin**: consider only with a concrete map use case. It
   adds browser code, accessibility obligations, and a larger maintenance
   surface.

Do not add implicit mention, issue, label, SHA, or custom-autolink rewriting.
Do not add an STL viewer without a demonstrated Papyrus use case. Those
features would add configuration or client code while making plain prose less
predictable.

No new implementation task IDs were created by this audit. Apart from the
already approved `PP-244`, strict Markdown handling, optional math, heading
permalinks, and GeoJSON/TopoJSON rendering are grouped under the general Maybe
backlog in `PP-200`. Each still requires an explicit decision and its own
atomic task before implementation.
