# Collection WebGL Story — Design Spec

**Date:** 2026-06-10
**Project:** SartoriaPieri — `campaign-landing/`
**Status:** Approved direction, pending spec review

## Summary

Replace the current collection page with an interactive WebGL scroll story
(reference: valentime.noomoagency.com, adapted to a 2.5D photography-based
approach). The user scrolls through a pale, fog-washed 3D void; the camera
dollies past five chapter zones — one per outfit/sin (DEPRAVAZIONE, DOLORE,
PERVERSIONE, TRAUMA, VERGOGNA) — where that look's campaign photos float as
textured planes. Photos are clickable for a fullscreen lightbox. No bespoke
3D models required; all content is existing photography under
`public/outfits/`.

## Decisions made (with user)

| Question | Decision |
|---|---|
| Story structure | Camera dolly through floating photo gallery (option A) |
| Narrative spine | 5 chapters = the 5 sins/outfits (option A) |
| Atmosphere | Pale fog / washed marble — bleached, overexposed, clinical (option C) |
| Interaction | Cinematic pass-through + clickable photos open a lightbox (option C) |
| Tech approach | Lenis + GSAP ScrollTrigger driving an R3F camera (option 1) |
| Route | Dev at `/collections/collection1-story`; swap to `/collections/collection1` on approval |
| Audio | None in v1 (architecture must not preclude adding it later) |

## Architecture

- **Scroll model:** the page renders a tall empty scroll container (~600vh —
  ~100vh intro + 5 × ~90vh chapters + ~50vh outro; tune during build). Lenis
  provides smooth scrolling (same pattern as `App.jsx`). A single GSAP
  ScrollTrigger maps scroll progress (0→1) into a shared ref read by the R3F
  scene every frame. No scroll hijacking.
- **Canvas:** one fixed, fullscreen `<Canvas>` behind the scroll container
  (`position: fixed; inset: 0`). DOM overlays (titles, UI) sit above it.
- **Camera path:** progress drives the camera along a gentle CatmullRom
  spline through the 5 zones spaced along −Z (zone spacing ≈ 14 world units,
  slight lateral S-curve so the journey isn't a straight rail). Subtle
  pointer/touch parallax (±0.3 unit lateral, ±2° tilt, lerped).
- **Fog:** scene background gradient `#d9d7d2 → #a39f97` + `THREE.Fog` so
  zones materialize out of the white as the camera approaches, and dissolve
  behind.

## Components

```
src/
  Collection1Story.jsx        — page: scroll container, DOM overlays, lightbox state, Lenis+ScrollTrigger wiring
  Collection1Story.css        — overlay typography, lightbox chrome, fallback grid
  webgl/story/
    StoryCanvas.jsx           — <Canvas> setup, fog, camera rig, frame loop (reads progress ref)
    ChapterZone.jsx           — positions one sin's PhotoPlanes + drift animation
    PhotoPlane.jsx            — textured plane, hover scale, click → lightbox
    fogPlaneMaterial.js       — shader: bleach/desaturate, grain, fog-fade by depth
    useStoryScroll.js         — progress ref + chapter index derivation
    photoManifest.js          — static manifest: per sin, ordered photo paths + plane layout seeds
```

Each unit independently testable: `photoManifest` is pure data;
`useStoryScroll` is a hook with no rendering; `PhotoPlane` renders from
props; `Collection1Story` owns all DOM state.

## Content & layout

- **Photo manifest:** static JS module listing each sin's photos (from
  `public/outfits/<sin>/`), in display order. Per chapter: 8–13 photos.
  Layout: deterministic pseudo-random scatter from a fixed seed per chapter
  (depth spread ≈ 6 units, lateral spread ≈ 5 units, slight random rotation
  ±4°), hero photo of each look largest and nearest the camera path.
- **Chapter titles:** DOM overlay, not WebGL text. Roman numeral + sin name
  (e.g. "III — PERVERSIONE"), dark serif (`Georgia`/existing brand serif) on
  the fog. Fade/translate in when the chapter's zone progress ∈ [0.15, 0.85].
- **Intro:** title card ("SARTORIA PIERI — THE FIVE SINS" working copy; user
  supplies final copy) + scroll hint. **Outro:** end card with CTA back to
  landing (`/`) and contact.

## Interaction

- **Hover (desktop):** plane scales 1.0 → 1.04, bleach shader eases toward
  full color (the one moment of saturation in the washed world).
- **Click/tap:** opens DOM lightbox — fullscreen photo (original-resolution
  jpg), sin name, photo index ("PERVERSIONE — 4/11"), prev/next arrows, close
  via X, Esc, or backdrop click. Scroll locked (Lenis `stop()`) while open.
  Lightbox is plain React + CSS (no WebGL) for reliability and a11y.
- **Raycast hit areas** are the planes themselves; cursor `pointer` on hover.

## Visual treatment (shader)

`fogPlaneMaterial` (extends a basic textured material):
- Desaturation ~55% + lift blacks (bleached look), strength uniform animated
  on hover toward 0
- Fine film grain (animated noise, subtle on planes; one fullscreen grain
  overlay via CSS instead of a postprocessing pass — keeps GPU cost low)
- Depth fade into fog handled by THREE.Fog; planes additionally fade opacity
  in the last 15% before the camera passes them (avoids hard clipping)

No postprocessing chain in v1 (no EffectComposer) — keeps mobile fast.

## Performance

- Textures: Vite has no on-demand image resizing for `public/` assets, so
  ship pre-resized copies under `public/outfits-web/<sin>/` (max edge
  1024 px, q72; generated by a committed `scripts/resize-outfits.sh` using
  ImageMagick). The WebGL planes load only these; the lightbox loads the
  original full-res file on demand.
- Lazy loading: each chapter's textures load when camera is within one zone
  of it (`useEffect` on chapter index); show nothing (fog) until ready —
  the fog aesthetic makes pop-in invisible.
- Target: 60 fps desktop, 30+ fps mid mobile. ~55 planes total, trivial
  geometry; the budget is texture memory (≈55 × 1024² ≈ manageable, and
  zones can dispose textures 2+ zones behind the camera if needed — defer
  unless profiling demands it).
- DPR capped at 2.

## Mobile & fallbacks

- Touch scroll via Lenis (`syncTouch`); parallax from gyro NOT used (v1) —
  touch drag position substitutes.
- `prefers-reduced-motion`: skip the canvas entirely; render a static
  chapter-by-chapter grid (plain CSS) with the same titles, photos, and
  lightbox.
- WebGL unavailable: same static fallback.
- Portrait spacing: lateral spread compressed (×0.55) so planes stay in
  frame.

## Error handling

- Texture load failure: plane silently omitted (logged in dev); chapter
  renders with remaining photos.
- ScrollTrigger/Lenis teardown on unmount (route change) — kill triggers,
  destroy Lenis, dispose renderer.

## Testing

- Manual: Playwright MCP walkthrough — screenshot at progress 0, each
  chapter midpoint, outro; lightbox open/close; reduced-motion emulation.
- Unit-light: `photoManifest` shape check and `useStoryScroll` chapter-index
  math are the only pure units worth a test file; visual correctness is
  validated by the Playwright pass.

## Out of scope (v1)

- Audio/music toggle (architecture leaves room: a `story:progress` event is
  emitted; future audio hooks subscribe)
- 3D garment models / photogrammetry
- Replacing `Collection1`/`Collection1New` code — old pages stay until swap
- CMS/dynamic content — manifest is static

## Open items for the user

- Final intro/outro copy and chapter order confirmation (current order:
  DEPRAVAZIONE → DOLORE → PERVERSIONE → TRAUMA → VERGOGNA)
- Confirm the brand serif for chapter titles (using existing site font
  stack until specified)
