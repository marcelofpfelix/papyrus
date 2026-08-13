---
title: Theme-aware image effects
description: Configure tritone and dithered image treatments for covers and profile photos.
date: 2026-08-13
tags:
  - papyrus
  - images
cover: /images/papyrus-image-effects-demo.jpg
cover_effect: tritone
---

Papyrus image effects are configured per image. Use them when a normal photo
feels too detached from the active theme.

`tritone` is a CSS effect. The browser keeps the original image and recolors it
with the current background, text, and accent tokens, so light and dark mode
switches happen immediately.

`dither` is different. Papyrus generates dark and light alpha masks at build
time, then the browser paints the active mask with a theme-derived ink color.
That keeps the runtime cheap while still allowing the color to change with the
theme.

<div class="papyrus-effect-demo-grid" data-papyrus-dither-src="/images/papyrus-image-effects-demo.jpg">
  <figure>
    <div class="papyrus-effect-demo-media">
      <img src="../../images/papyrus-image-effects-demo.jpg" alt="Original portrait before applying image effects" />
    </div>
    <figcaption>original</figcaption>
  </figure>
  <figure>
    <div class="papyrus-effect-demo-media papyrus-image-effect-tritone">
      <img src="../../images/papyrus-image-effects-demo.jpg" alt="Portrait rendered with the tritone effect" />
    </div>
    <figcaption>tritone</figcaption>
  </figure>
  <figure>
    <div class="papyrus-effect-demo-media papyrus-image-effect-dither" style="--papyrus-dither-mask-dark: url('../../generated/dither/images/papyrus-image-effects-demo.png'); --papyrus-dither-mask-light: url('../../generated/dither/images/papyrus-image-effects-demo-light.png')">
      <img src="../../images/papyrus-image-effects-demo.jpg" alt="Portrait rendered with the dither effect" />
    </div>
    <figcaption>dither</figcaption>
  </figure>
</div>

For a post cover, set the effect in frontmatter:

```yaml
cover: /images/photo.jpg
cover_effect: tritone
```

Use `dither` when you want the build-time mask:

```yaml
cover: /images/photo.jpg
cover_effect: dither
```

For profile images, set the site default:

```toml
[profile.images]
effect = "tritone"
```

Or override one profile directly:

```toml
[user]
avatar = "images/profile.jpg"
avatar_effect = "dither"
```

The supported values are `none`, `tritone`, and `dither`.
