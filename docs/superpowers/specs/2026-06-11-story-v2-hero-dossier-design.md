# Story v2 — Hero-Only Flow, Living Heroes, Dossier — Design Spec

**Date:** 2026-06-11
**Iterates on:** `2026-06-10-collection-webgl-story-design.md` (v1, shipped on `story/collection-webgl`)
**Status:** Design approved by user

## User feedback driving this iteration

v1's chapter zones scatter 7–10 photos per sin — "too many images, too overlapped."
Wanted: only the outfit image in the main flow; the other photos behind a click
("zooms out... a new section with a data view of the patchwork"); optionally
AI-generated motion for the outfits with **maximum fidelity** to the real garments.

## Decisions made (with user)

| Question | Decision |
|---|---|
| Main flow | One hero plane per sin, no scatter cluster |
| Detail view | "Dossier" (option B): hero glides left + enlarges, editorial side panel with detail photos + garment data |
| Generated content | Animate existing hero photos via Higgsfield img2vid (option A); no new-scene stills |
| Fidelity gate | User approves every generated clip before it ships; rejected clips fall back to the still |

## Changes by area

### 1. Main flow — hero only

- `chapterLayout()` (photoManifest.js) is replaced in the flow path by a single
  `heroPlacement(chapterIndex, lateralScale)`: hero centered near the camera
  path at each zone (x alternates ±0.9 · lateralScale to echo the camera
  S-curve, y = 0, z = chapter.z + 1.5, scale ≈ 1.9, gentle drift). Deterministic, no PRNG needed.
- `ChapterZone` renders exactly one `HeroPlane`.
- The scatter layout code and its tests are **removed** (not dead-coded) —
  the dossier grid is DOM, not WebGL.

### 2. Living heroes (Higgsfield img2vid)

- For each sin: generate a 3–5 s subtle loop from the hero photo (fabric sway,
  breathing, slight parallax drift; static framing; NO garment morphing).
  Orchestrator-side generation via Higgsfield MCP, then **user approval gate**
  per clip (shown side-by-side with the source still).
- Approved clips: `campaign-landing/public/outfits-video/<sin>.mp4`
  (H.264, ≤ 1024 px long edge, muted, loopable).
- `HeroPlane` (new, replaces PhotoPlane in the flow): if the chapter has an
  approved video, use a `THREE.VideoTexture` (`muted`, `loop`, `playsInline`,
  autoplay started on first user scroll); otherwise the still texture.
  The fog/bleach shader applies identically to both (hover-to-color stays).
- Fallbacks: `prefers-reduced-motion`, video load error, or missing file →
  still photo. The video element is created only when the chapter mounts and
  disposed on unmount.
- PhotoPlane itself remains (unchanged contract) — HeroPlane composes the same
  shader/material but owns the video lifecycle.

### 3. Dossier (click hero)

- DOM overlay (`.story-dossier`), sibling of the lightbox, same Lenis
  stop/start + Esc/X/backdrop-close mechanics.
- Open transition: hero's screen position is approximated by a CSS transition —
  the dossier renders the hero image large on the left (~40vw), panel slides in
  from the right (~50vw): numeral + sin name, 2-column grid of the remaining
  photos (webSrc thumbnails), garment data list, all over `rgba(244,242,238,.96)`.
- Clicking a grid photo opens the existing Lightbox (full-res) **on top of**
  the dossier; closing the lightbox returns to the dossier.
- Garment data: `CHAPTERS[i].data` — array of `{label, value}` placeholders
  (`PATCHWORK — TBD by user`, etc.) the user edits in photoManifest.js. Render
  only entries whose value is set (placeholder values render as an em-dash).
- Keyboard: dossier is focus-managed like the lightbox (focus close on open,
  restore on close). Fallback grid path: clicking a photo still opens the
  plain lightbox (dossier is canvas-path only; the fallback grid already
  shows all photos inline).

### 4. Unchanged

Camera rig, scroll timeline, fog shader, overlays, lightbox internals,
fallback grid, route, tests for useStoryScroll.

## Error handling

- Video texture failure → silent fallback to still (dev console warn).
- Higgsfield generation failures → that sin ships with the still; not blocking.

## Testing

- Unit: `heroPlacement()` determinism + lateralScale; manifest `data` shape.
- Browser (Playwright): one hero per chapter visible; click → dossier; grid →
  lightbox-over-dossier; Esc cascade (lightbox closes first, then dossier);
  scroll locked while dossier open; video plays on canvas (videoElement.paused
  === false) where clips exist; reduced-motion still uses fallback grid.

## Out of scope

- New-scene generated stills (user declined)
- Real garment data copy (user fills placeholders)
- Route swap to `/collections/collection1` (still pending user approval of the whole)
