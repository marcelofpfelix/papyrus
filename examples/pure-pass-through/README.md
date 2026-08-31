# Pure pass-through fixture

This fixture documents the public Pure components that Papyrus exposes through
`astro-papyrus/pure/*`.

It is not a separate starter template. It is a small consumer-style source tree
used by the package verifier to keep the pass-through surface honest.

## Covered imports

- `astro-papyrus/pure/advanced`
- `astro-papyrus/pure/basic`
- `astro-papyrus/pure/pages`
- `astro-papyrus/pure/user`

The Papyrus integration provides a conservative Pure-compatible
`virtual:config` bridge with site title, locale, header, footer, author,
content/share, quote, and Medium Zoom defaults. That bridge is meant to let
public Pure components render inside a Papyrus site; it is not a promise that a
Papyrus site behaves exactly like a full Pure site.
