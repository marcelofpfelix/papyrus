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
- `dithered-tritone`: optional later mode, combining palette mapping with
  Atkinson/Bayer/noise thresholds.

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

## Video dithering design

Video should not reuse the static image-mask implementation. Four PNG masks are
reasonable for a still image, but video would require too many generated frames.
The better design is a progressive enhancement inspired by `mitsuhiko/dark`:

- Source media remains a normal optimized `<video>` with `autoplay`, `muted`,
  `loop`, `playsinline`, and a poster image.
- A tiny runtime upgrades only configured videos to a `<canvas>` renderer when
  WebGL is available, motion is allowed, and the video is visible.
- The shader samples the current video frame, computes grayscale luminance,
  applies Atkinson/Bayer/noise thresholding, and emits one theme ink color with
  alpha over the page background.
- The runtime throttles rendering, pauses via `IntersectionObserver`, stops for
  `prefers-reduced-motion`, and falls back to the poster or normal video.
- Light/dark colors come from CSS variables so theme switching does not require
  new encoded video files.
- Do not ship this runtime globally. Load it only when rendered content contains
  a configured dithered video.

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

Open questions before implementation:

- Use WebGL 1 for the first slice, matching the upstream browser baseline, or
  add a slower 2D canvas fallback.
- Whether video dithering belongs only to explicit HTML/MDX media or also to
  frontmatter-configured cover videos.
- Whether to support only `atkinson` first, or expose `atkinson`, `bayer`, and
  `noise` immediately.

## Validation

- Add fixture images with tritone and dither outputs.
- Verify generated files are referenced by rendered pages.
- Check no orphan generated images are kept when frontmatter does not reference
  them.
- Add browser smoke checks for fallback image, reduced motion, and no blank
  canvas if runtime WebGL is added.
- Run Lighthouse only before release/commit when explicitly requested.
