# Image effects task

Tracking row: `PP-199`.

## Goal

Add an optional Papyrus image effect system for covers, profile images, and demo
media. The first useful feature should be a static theme-toned image transform.
Animated/dithered media can be a progressive enhancement, not a default.

## Upstream reference

`mitsuhiko/dark` uses `blog/static/app.js` for two related effects:

- A header WebGL canvas reads `/static/waves.mp4`, with
  `/static/waves-fallback.png` as fallback.
- A fragment shader converts each video frame to grayscale luminance.
- The shader applies one dither mode:
  - `atkinson`: custom 4x4 threshold pattern with contrast boost.
  - `gaussian`: 8x8 Bayer ordered dithering texture.
  - `noise`: stable per-pixel random threshold.
- The result is not a true tritone. It renders one theme-aware ink color over a
  transparent or flattened page background:
  - dark mode ink: `#e8d5b7`
  - light mode ink: `#8a541c`
- Light mode mirrors the source vertically and inverts alpha behavior so the
  effect blends into the page.
- The runtime detects WebGL alpha problems and flattens against the current CSS
  background on affected browsers.
- A separate `.dithered-image` runtime applies the same style to normal images,
  adds noisy edge fade, throttles animation, respects reduced motion, and pauses
  when off-screen.
- The "moving dots" effect on images is animated threshold noise: the image is
  not moving, but the dither threshold changes slightly over time so bright
  pixels flicker between ink and transparent/background. This should be exposed
  as an optional image setting, not tied only to video.

## Papyrus feature shape

Prefer explicit configuration over magic classes:

```toml
[image_effects]
default = "none"

[image_effects.tone]
mode = "tritone"
palette = "theme"

[image_effects.dither]
mode = "atkinson"
animated = false
animation = "none"
```

Per-image/frontmatter override:

```yaml
cover: /images/post-cover.jpg
cover_effect:
  tone: tritone
  dither: atkinson
```

Profile data override:

```toml
[user]
avatar = "images/profile.png"
avatar_effect = "tritone"
```

Site-wide profile default:

```toml
[profile.images]
effect = "tritone"
```

The first implemented slice supports `cover_effect: tritone`,
`cover_effect: dither`, and `cover_effect: dithernoise` for post covers, plus
`avatar_effect = "tritone"`, `avatar_effect = "dither"`, or
`[profile.images].effect` for profile avatars. `tritone` is CSS-only. `dither`
generates one dark and one light build-time alpha mask. `dithernoise` generates
four dark and four light alpha mask frames and steps through them with CSS.
Generated files are grouped by source image:

```txt
public/generated/dither/v1/images/example/dark.png
public/generated/dither/v1/images/example/light.png
public/generated/dithernoise/v2/images/example/dark-1.png
public/generated/dithernoise/v2/images/example/light-1.png
```

## Modes

- `none`: render the original image.
- `tritone`: map shadows/midtones/highlights to three colors.
- `dither`: upstream-inspired one-ink threshold dither over the current
  background.
- `dithernoise`: build-time Atkinson masks with a small set of animated
  threshold-noise frames.
- `papyrus-video-effect-dither`: runtime Atkinson video dither for explicit
  content videos.
- `dithered-tritone`: optional later mode, combining palette mapping with
  Atkinson/Bayer/noise thresholds.

## Deferred source-tone override

Tracking row: `PP-201`.

`duotone` and `tritone` are CSS-only effects. Unlike `dither` and
`dithernoise`, they do not generate separate light/dark masks, and they do not
currently know whether the source image is naturally dark or light. Most images
should keep the default behavior, but a manual override may be useful when a
very dark or very light source image loses contrast after a theme switch.

Preferred future shape:

```yaml
cover: /images/post-cover.jpg
cover_effect: tritone
cover_tone: dark # auto | dark | light
```

```toml
[profile.images]
effect = "tritone"
tone = "dark" # auto | dark | light
```

Rules:

- Default remains `auto`, preserving the current CSS output.
- `dark` means the source image is dark and needs a lighter/brighter mapping.
- `light` means the source image is light and needs a deeper mapping.
- Apply only to CSS tone effects first: `duotone` and `tritone`.
- Do not add build-time luminance auto-detection until there is a real failing
  image and a clear test case.
- Do not change `dither` or `dithernoise`; they already generate separate
  dark/light masks.

Acceptance criteria for implementation:

- Post covers accept `cover_tone` and `coverTone`.
- Profile images accept `[profile.images].tone` and optional `avatar_tone`.
- Rendered media gets one shared attribute or class such as
  `data-papyrus-image-tone="dark"`.
- CSS adjusts only the tone-effect mapping, not layout.
- Add one demo image that clearly shows why the override exists.
- Update config, content schema, profile data, and image-effect verifiers.

## Performance guidance

Default implementation should be build-time for static images:

- Use generated WebP/AVIF/PNG assets for covers/profile images.
- Preserve original image as source and emit deterministic generated files.
- Do not run WebGL on ordinary content images by default.
- Do not require consumers to copy runtime assets manually.

Animated choices:

- Prefer MP4/WebM over GIF for animation. Lighthouse has a specific audit for
  replacing animated GIFs with video.
- Use GIF only for tiny, low-frame-count decorative clips where measured output
  is smaller than video.
- Animated SVG is usually not a good fit for photo/video effects because it
  either embeds large raster data or becomes complex filter animation; reserve it
  for vector illustrations.
- For animated hero media, use `<video autoplay muted loop playsinline>` with
  no audio stream, a poster/fallback image, and lazy loading when not in the
  first viewport.
- Runtime WebGL should respect `prefers-reduced-motion`, pause off-screen, and
  fall back to a pre-rendered image.

## Video dithering

Video should not reuse the static image-mask implementation. Four PNG masks are
reasonable for a still image, but video would require too many generated frames.
The implemented first slice is a progressive enhancement inspired by
`mitsuhiko/dark`:

- Source media remains a normal optimized `<video>` with `autoplay`, `muted`,
  `loop`, `playsinline`, and a poster image.
- `PapyrusMediaRuntime` upgrades only videos with
  `class="papyrus-video-effect-dither"` to a `<canvas>` renderer when WebGL is
  available, motion is allowed, and the video is visible.
- The shader samples the current video frame, computes grayscale luminance,
  applies Atkinson thresholding, and emits one theme ink color over the page
  background.
- The runtime throttles rendering, pauses via `IntersectionObserver`, stops for
  `prefers-reduced-motion`, and falls back to the poster or normal video.
- Light/dark colors come from CSS variables so theme switching does not require
  new encoded video files.
- The enhancement is inherited by Papyrus post pages; templates and consumer
  sites only author normal HTML or the Markdown-safe placeholder. The shared
  media runtime can be present for other media features, but WebGL setup starts
  only when an opted-in video exists.

Candidate authoring shape:

```html
<video
  class="papyrus-video-effect-dither"
  src="/media/waves.webm"
  poster="/media/waves-poster.jpg"
  autoplay
  muted
  loop
  playsinline
></video>
```

Deferred on purpose:

- 2D canvas fallback.
- Frontmatter-configured cover videos.
- `bayer`, `noise`, or animated-noise mode selection.

## Validation

- Add fixture images with tritone and dither outputs.
- Verify generated files are referenced by rendered pages.
- Check no orphan generated images are kept when frontmatter does not reference
  them.
- Add browser smoke checks for fallback image, reduced motion, and no blank
  canvas if runtime WebGL is added.
- Run Lighthouse only before release/commit when explicitly requested.
