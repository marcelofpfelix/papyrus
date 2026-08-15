---
title: Markdown code guide
description: Markdown route showing Pure-style Astro/Shiki code blocks, callouts, tables, diagrams, and media.
slug: code-demo
pubDatetime: 2026-07-01T13:00:00.000Z
category: Docs
license: CC-BY-4.0
tags:
  - authoring
  - markdown
  - code
---

This route is a compact rendering reference for Markdown-heavy posts. It shows
how callouts, code fences, tables, diagrams, media, and fallback artifact links
look inside the same article layout used by regular Papyrus posts.

Inline samples such as `inline code`, ~~strikethrough~~, and
https://github.com/marcelofpfelix/papyrus keep the prose checks close to the
code checks.

## Obsidian callout syntax

> [!NOTE]
> Notes render as theme-aware callouts while keeping the original Markdown
> readable in source form.

> [!TIP]
> Tips use the same callout component shape with a different token mix.

> [!IMPORTANT]
> Important callouts use their own icon and color so they are distinct from tips.

> [!WARNING]
> Warning variants use warning tokens instead of hardcoded colors.

> [!CAUTION]
> Caution callouts stay readable in light and dark modes.

> [!WARNING]- Collapsed warning
> Collapsed callouts keep long warnings available without dominating the page.

> [!TIP]+ Expanded tip
> Expanded callouts can stay open when the content is immediately useful.

## Code title

```rust title="src/main.rs"
fn main() {
    println!("papyrus");
}
```

## Diff fence

```css title="diff.css"
.papyrus-card {
  background: var(--papyrus-panel); /* [!code --] */
  background: transparent; /* [!code ++] */
  color: var(--papyrus-accent); /* [!code ++] */
}
```

## Highlighted lines

```c title="highlight.c"
#include <stdio.h>

int main(void) {
  puts("papyrus"); // [!code highlight]
  return 0;
}
```

## Console fences

```console
site$ pnpm install
site# pnpm build
site> pnpm preview
```

## Collapsible code

```rust title="src/server.rs"
use std::net::TcpListener;

fn main() -> std::io::Result<()> {
    let listener = TcpListener::bind("127.0.0.1:4321")?;

    for stream in listener.incoming() {
        let stream = stream?;
        handle(stream);
    }

    Ok(())
}

fn handle<T>(_stream: T) {
    println!("papyrus");
}
```

## Kamailio fences

```kamailio title="kamailio.cfg"
#!KAMAILIO
listen=udp:127.0.0.2:5060
loadmodule "sl.so"
modparam("sl", "bind_tm", 0)

request_route {
  if (is_method("INVITE")) {
    xlog("L_INFO", "call from $si to $ru\n");
    sl_send_reply("100", "Trying");
  }
}
```

## Task list

- [x] Keep feature walkthroughs explicit
- [ ] Document the source files beside rendered artifacts
- [ ] Choose a renderer before embedding external diagram formats

## Table

| Feature | Expected behavior |
| --- | --- |
| Code title | Render a compact title bar |
| Diff | Style added and removed lines |
| Table | Stay readable without heavy borders |

## Mermaid fence

```mermaid
flowchart LR
  Markdown --> Code
  Markdown --> Alerts
  Markdown --> Diagrams
```

## Image zoom

<img src="/demo/demo-profile-avatar.svg" alt="Profile fixture avatar" width="512" height="512" loading="lazy" />

## Artifact links

- [Mermaid source](/demo/theme-flow.mmd "Hydrated Mermaid source")
- [PlantUML source](/demo/call-flow.puml "PlantUML source")
- [Excalidraw source](/demo/sketch.excalidraw "Excalidraw source")

## Fallback rendering

Some GitHub-style or diagram-adjacent formats need a site-owned plugin or
renderer. Papyrus keeps the source visible so authors can choose the right
integration for their site.

| Feature | Expected fallback |
| --- | --- |
| PlantUML inline rendering | Keep as a file link |
| Excalidraw inline rendering | Keep as a file link |
| Wiki links like `[[topic]]` | Keep as plain text |
| Footnotes like `[^1]` | Render when a consuming site adds a plugin |
