---
title: Theme-aware image effects
description: Configure duotone, tritone, and dithered image treatments for covers and profile photos.
date: 2026-08-13
tags:
  - papyrus
  - images
cover: /images/papyrus-image-effects-demo.jpg
cover_effect: tritone
---

Papyrus image effects are configured per image. Use them when a normal photo
feels too detached from the active theme.

`duotone` and `tritone` are CSS effects. The browser keeps the original image
and recolors it with the current theme tokens, so light and dark mode switches
happen immediately. Use `duotone` for background and foreground colors only.

`dither` and `dithernoise` are different. Papyrus generates dark and light alpha
masks at build time, then the browser paints the active mask with a
theme-derived ink color. `dither` uses an Atkinson-style dot pattern.
`dithernoise` uses the same pattern and steps through generated noise frames.

<div class="papyrus-effect-demo-grid" data-papyrus-dither-src="/images/papyrus-image-effects-demo.jpg" data-papyrus-dithernoise-src="/images/papyrus-image-effects-demo.jpg">
  <figure>
    <div class="papyrus-effect-demo-media">
      <img src="../../images/papyrus-image-effects-demo.jpg" alt="Original portrait before applying image effects" />
    </div>
    <figcaption>original</figcaption>
  </figure>
  <figure>
    <div class="papyrus-effect-demo-media papyrus-image-effect-duotone">
      <img src="../../images/papyrus-image-effects-demo.jpg" alt="Portrait rendered with the duotone effect" />
    </div>
    <figcaption>duotone</figcaption>
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
  <figure>
    <div class="papyrus-effect-demo-media papyrus-image-effect-dithernoise" style="--papyrus-dither-mask-dark: url('../../generated/dithernoise/images/papyrus-image-effects-demo.png'); --papyrus-dither-mask-light: url('../../generated/dithernoise/images/papyrus-image-effects-demo-light.png'); --papyrus-dither-mask-dark-2: url('../../generated/dithernoise/images/papyrus-image-effects-demo-2.png'); --papyrus-dither-mask-light-2: url('../../generated/dithernoise/images/papyrus-image-effects-demo-2-light.png'); --papyrus-dither-mask-dark-3: url('../../generated/dithernoise/images/papyrus-image-effects-demo-3.png'); --papyrus-dither-mask-light-3: url('../../generated/dithernoise/images/papyrus-image-effects-demo-3-light.png'); --papyrus-dither-mask-dark-4: url('../../generated/dithernoise/images/papyrus-image-effects-demo-4.png'); --papyrus-dither-mask-light-4: url('../../generated/dithernoise/images/papyrus-image-effects-demo-4-light.png'); --papyrus-dither-mask-dark-5: url('../../generated/dithernoise/images/papyrus-image-effects-demo-5.png'); --papyrus-dither-mask-light-5: url('../../generated/dithernoise/images/papyrus-image-effects-demo-5-light.png'); --papyrus-dither-mask-dark-6: url('../../generated/dithernoise/images/papyrus-image-effects-demo-6.png'); --papyrus-dither-mask-light-6: url('../../generated/dithernoise/images/papyrus-image-effects-demo-6-light.png')">
      <img src="../../images/papyrus-image-effects-demo.jpg" alt="Portrait rendered with the dithernoise effect" />
    </div>
    <figcaption>dithernoise</figcaption>
  </figure>
</div>

For a post cover, set the effect in frontmatter:

```yaml
cover: /images/photo.jpg
cover_effect: duotone
```

Use `dither` or `dithernoise` when you want a build-time mask:

```yaml
cover: /images/photo.jpg
cover_effect: dithernoise
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

The supported values are `none`, `duotone`, `tritone`, `dither`, and
`dithernoise`.
