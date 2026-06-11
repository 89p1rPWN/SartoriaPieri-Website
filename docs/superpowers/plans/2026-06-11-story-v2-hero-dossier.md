# Story v2 — Hero-Only Flow + Dossier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace v1's per-sin photo scatter with a single (optionally video-animated) hero plane per sin, and move the remaining photos into a click-through "dossier" panel with garment data.

**Architecture:** `heroPlacement()` replaces `chapterLayout()` in the manifest; `HeroPlane` composes the existing fog shader with an optional `THREE.VideoTexture` (still-photo fallback); the dossier is a DOM overlay (z 8) below the existing lightbox (z 10), sharing Lenis lock + Esc-cascade via one page-level key handler.

**Tech Stack:** unchanged (R3F, three, GSAP/Lenis, vitest). Higgsfield video generation is orchestrator-side (Task 6), not a subagent task.

**Spec:** `docs/superpowers/specs/2026-06-11-story-v2-hero-dossier-design.md`
**Branch:** `story/collection-webgl` (continue). Working dir for commands: `campaign-landing/`.

---

## File map

| File | Change |
|---|---|
| `src/webgl/story/photoManifest.js` | − `chapterLayout`/`mulberry32`; + `heroPlacement`, `videoSrc`, per-chapter `data` + `video` flag |
| `src/webgl/story/__tests__/photoManifest.test.js` | tests follow |
| `src/webgl/story/HeroPlane.jsx` | NEW — video/still hero plane |
| `src/webgl/story/PhotoPlane.jsx` | unchanged (kept: dossier-era flow may reuse; it is the still-plane reference impl) → **actually DELETE if nothing imports it after Task 3** — verify and remove in Task 3 |
| `src/webgl/story/ChapterZone.jsx` | renders one HeroPlane |
| `src/StoryDossier.jsx` | NEW — dossier overlay |
| `src/Collection1Story.jsx` | dossier state, combined Esc/arrow handler, shared scroll lock |
| `src/Collection1Story.css` | dossier styles |

---

### Task 1: Manifest v2 — heroPlacement, garment data, video flags (TDD)

**Files:** Modify `src/webgl/story/photoManifest.js` + its test file.

- [ ] **Step 1: Rewrite the test file** — replace the two `chapterLayout` describe blocks with:

```js
describe('heroPlacement', () => {
  it('is deterministic and one per chapter', () => {
    expect(heroPlacement(2)).toEqual(heroPlacement(2))
    expect(heroPlacement(1).file).toBe('dolore_main.jpg')
  })

  it('alternates sides matching the camera S-curve and sits forward of the zone', () => {
    expect(heroPlacement(0).x).toBeLessThan(0)
    expect(heroPlacement(1).x).toBeGreaterThan(0)
    CHAPTERS.forEach((c) => expect(heroPlacement(c.index).z).toBe(c.z + 1.5))
  })

  it('compresses x with lateralScale', () => {
    expect(Math.abs(heroPlacement(0, 0.55).x)).toBeCloseTo(Math.abs(heroPlacement(0, 1).x) * 0.55, 5)
  })
})

describe('garment data & video', () => {
  it('every chapter has a data list of label/value pairs', () => {
    CHAPTERS.forEach((c) => {
      expect(c.data.length).toBeGreaterThan(0)
      c.data.forEach((d) => {
        expect(typeof d.label).toBe('string')
        expect(typeof d.value).toBe('string')
      })
    })
  })

  it('video flag is boolean and videoSrc builds the path', () => {
    CHAPTERS.forEach((c) => expect(typeof c.video).toBe('boolean'))
    expect(videoSrc('dolore')).toBe('/outfits-video/dolore.mp4')
  })
})
```

Update the import line accordingly (`heroPlacement`, `videoSrc` instead of `chapterLayout`). Keep the CHAPTERS describe block as-is.

- [ ] **Step 2: Run — new tests fail** (`heroPlacement` not exported).

- [ ] **Step 3: Rewrite photoManifest.js** — delete `mulberry32` and `chapterLayout`, add:

```js
// Garment data shown in the dossier. Values are user-edited; empty string
// renders as an em-dash until filled.
const garmentData = (overrides = {}) =>
  ['PATCHWORK', 'FABRIC', 'CUT', 'ATELIER'].map((label) => ({
    label,
    value: overrides[label] ?? (label === 'ATELIER' ? 'Sartoria Pieri, 2026' : ''),
  }))
```

Add to each SIN entry: `data: garmentData()`, and `video: false` (flipped per sin when an approved clip lands in `public/outfits-video/`).

```js
export const videoSrc = (slug) => `/outfits-video/${slug}.mp4`

// One hero per chapter, replacing v1's scatter. x echoes the camera
// S-curve side (camera weaves to ∓1.4; hero sits at ∓0.9 on the same side).
export function heroPlacement(chapterIndex, lateralScale = 1) {
  const chapter = CHAPTERS[chapterIndex]
  const side = chapterIndex % 2 === 0 ? -1 : 1
  return {
    file: chapter.hero,
    x: side * 0.9 * lateralScale,
    y: 0,
    z: chapter.z + 1.5,
    rotY: side * -0.06,
    rotZ: 0,
    scale: 1.9,
    drift: { speed: 0.35, phase: chapterIndex * 1.7, amp: 0.07 },
  }
}
```

- [ ] **Step 4: `npm test`** — all green (chapterLayout tests gone, new ones pass).
- [ ] **Step 5: Commit** `"Story v2: hero placement + garment data manifest"` (only `src/webgl/story`).

---

### Task 2: HeroPlane — video texture with still fallback

**Files:** Create `src/webgl/story/HeroPlane.jsx`.

- [ ] **Step 1: Write the component:**

```jsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { FogPlaneMaterial } from './fogPlaneMaterial.js'

const PLANE_W = 1.76
const PLANE_H = 2.2

const toSRGB = (t) => {
  t.colorSpace = THREE.SRGBColorSpace
}

// One sin's hero. Plays a subtle video loop when an approved clip exists
// (chapter.video), with the still photo as poster and fallback. The page
// only renders the canvas path when motion is allowed, so no
// prefers-reduced-motion check is needed here.
export default function HeroPlane({ placement, stillUrl, videoUrl, onClick }) {
  const mesh = useRef()
  const mat = useRef()
  const [hovered, setHovered] = useState(false)
  const [videoEl, setVideoEl] = useState(null)
  const stillTexture = useTexture(stillUrl, toSRGB)

  useEffect(() => {
    if (!videoUrl) return undefined
    const el = document.createElement('video')
    el.src = videoUrl
    el.muted = true
    el.loop = true
    el.playsInline = true
    el.preload = 'auto'
    const onCanPlay = () => {
      el.play()
        .then(() => setVideoEl(el))
        .catch(() => {}) // autoplay denied → keep the still
    }
    const onError = () => {
      if (import.meta.env.DEV) console.warn('Hero video failed:', videoUrl)
      setVideoEl(null)
    }
    el.addEventListener('canplaythrough', onCanPlay, { once: true })
    el.addEventListener('error', onError)
    el.load()
    return () => {
      el.removeEventListener('canplaythrough', onCanPlay)
      el.removeEventListener('error', onError)
      el.pause()
      el.removeAttribute('src')
      el.load()
      setVideoEl(null)
    }
  }, [videoUrl])

  const videoTexture = useMemo(() => {
    if (!videoEl) return null
    const t = new THREE.VideoTexture(videoEl)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [videoEl])

  useEffect(() => () => videoTexture?.dispose(), [videoTexture])

  useEffect(() => () => {
    document.body.style.cursor = ''
  }, [])

  useFrame((state) => {
    if (!mesh.current || !mat.current) return
    const { drift, y, scale } = placement
    const t = state.clock.elapsedTime
    mesh.current.position.y = y + Math.sin(t * drift.speed + drift.phase) * drift.amp
    const targetBleach = hovered ? 0 : 1
    mat.current.uBleach = THREE.MathUtils.lerp(mat.current.uBleach, targetBleach, 0.08)
    const targetScale = scale * (hovered ? 1.04 : 1)
    mesh.current.scale.x = THREE.MathUtils.lerp(mesh.current.scale.x, targetScale, 0.1)
    mesh.current.scale.y = mesh.current.scale.x
    const d = state.camera.position.z - placement.z
    mat.current.uOpacity = THREE.MathUtils.smoothstep(d, 0.5, 2.5)
    mat.current.uTime = t
  })

  return (
    <mesh
      ref={mesh}
      position={[placement.x, placement.y, placement.z]}
      rotation={[0, placement.rotY, placement.rotZ]}
      scale={placement.scale}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = ''
      }}
    >
      <planeGeometry args={[PLANE_W, PLANE_H]} />
      <fogPlaneMaterial
        ref={mat}
        key={FogPlaneMaterial.key}
        map={videoTexture ?? stillTexture}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
```

- [ ] **Step 2: lint** the file. **Step 3: Commit** `"Story v2: HeroPlane with video texture + still fallback"`.

---

### Task 3: ChapterZone v2 — single hero; remove dead scatter code

**Files:** Modify `src/webgl/story/ChapterZone.jsx`; delete `src/webgl/story/PhotoPlane.jsx` if unreferenced.

- [ ] **Step 1: Rewrite ChapterZone** (keep PlaneBoundary class unchanged):

```jsx
import React, { Suspense } from 'react'
import { CHAPTERS, heroPlacement, webSrc, videoSrc } from './photoManifest.js'
import HeroPlane from './HeroPlane.jsx'

// ... PlaneBoundary unchanged ...

// One sin = one hero plane. Detail photos live in the DOM dossier, not here.
export default function ChapterZone({ chapterIndex, lateralScale, onHeroClick }) {
  const chapter = CHAPTERS[chapterIndex]
  const placement = heroPlacement(chapterIndex, lateralScale)
  return (
    <PlaneBoundary>
      <Suspense fallback={null}>
        <HeroPlane
          placement={placement}
          stillUrl={webSrc(chapter.slug, chapter.hero)}
          videoUrl={chapter.video ? videoSrc(chapter.slug) : null}
          onClick={() => onHeroClick(chapterIndex)}
        />
      </Suspense>
    </PlaneBoundary>
  )
}
```

- [ ] **Step 2: Rename the prop through StoryCanvas** — in `StoryCanvas.jsx` change `onPhotoClick` to `onHeroClick` (prop name + pass-through).
- [ ] **Step 3:** `grep -rn "PhotoPlane" src/` — if only its own file matches, `git rm src/webgl/story/PhotoPlane.jsx`.
- [ ] **Step 4:** lint changed files; `npm test`; `npm run build`.
- [ ] **Step 5: Commit** `"Story v2: one hero per chapter; drop scatter planes"`.

---

### Task 4: Dossier — component, styles, page wiring

**Files:** Create `src/StoryDossier.jsx`; modify `src/Collection1Story.jsx`, `src/Collection1Story.css`.

- [ ] **Step 1: Create `src/StoryDossier.jsx`:**

```jsx
import React, { useEffect, useRef } from 'react'
import { CHAPTERS, webSrc } from './webgl/story/photoManifest.js'

// Editorial detail view for one sin: hero large on the left, panel with the
// look's other photos + garment data on the right. Sits below the lightbox
// (z 8 < 10) so full-res photo zoom stacks on top.
export default function StoryDossier({ chapterIndex, onPhotoClick, onClose }) {
  const chapter = CHAPTERS[chapterIndex]
  const closeRef = useRef(null)
  useEffect(() => {
    closeRef.current?.focus()
  }, [])
  const details = chapter.photos.filter((f) => f !== chapter.hero)

  return (
    <div
      className="story-dossier"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${chapter.slug} dossier`}
    >
      <figure className="dossier-hero" onClick={(e) => e.stopPropagation()}>
        <img src={webSrc(chapter.slug, chapter.hero)} alt={`${chapter.slug} look`} />
      </figure>
      <aside className="dossier-panel" onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} className="dossier-close" aria-label="Close" onClick={onClose}>×</button>
        <header>
          <span className="dossier-numeral">{chapter.numeral}</span>
          <h2>{chapter.slug.toUpperCase()}</h2>
        </header>
        <div className="dossier-grid">
          {details.map((file) => (
            <button
              key={file}
              type="button"
              onClick={() => onPhotoClick(chapterIndex, chapter.photos.indexOf(file))}
              aria-label={`Open ${chapter.slug} detail photo`}
            >
              <img src={webSrc(chapter.slug, file)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
        <dl className="dossier-data">
          {chapter.data.map(({ label, value }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value || '—'}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  )
}
```

- [ ] **Step 2: Wire `Collection1Story.jsx`:**
  - Add state `const [dossier, setDossier] = useState(null)` (chapterIndex | null).
  - `openDossier = useCallback((i) => setDossier(i), [])`; change the `<StoryCanvas>` prop from `onPhotoClick={openLightbox}` to `onHeroClick={openDossier}` (matches Task 3's rename).
  - Replace the lightbox-only effect with two effects:

```jsx
  const locked = dossier != null || lightbox != null
  useEffect(() => {
    if (!locked) return undefined
    lenisRef.current?.stop()
    return () => lenisRef.current?.start()
  }, [locked])

  useEffect(() => {
    if (dossier == null && !lightbox) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (lightbox) setLightbox(null)
        else setDossier(null)
      }
      if (lightbox) {
        if (e.key === 'ArrowRight') stepLightbox(1)
        if (e.key === 'ArrowLeft') stepLightbox(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dossier, lightbox, stepLightbox])
```

  - Render (canvas path, before the lightbox):

```jsx
      {dossier != null && (
        <StoryDossier
          chapterIndex={dossier}
          onPhotoClick={openLightbox}
          onClose={() => setDossier(null)}
        />
      )}
```

  - Fallback path unchanged (`StoryFallback` keeps `onPhotoClick={openLightbox}` — the grid already shows every photo).

- [ ] **Step 3: CSS** — append to `Collection1Story.css`:

```css
/* Dossier */
.story-dossier {
  position: fixed;
  inset: 0;
  z-index: 8;
  display: flex;
  background: rgba(217, 215, 210, 0.55);
  backdrop-filter: blur(6px);
}
.dossier-hero {
  flex: 0 0 42%;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: dossier-hero-in 0.55s ease both;
}
.dossier-hero img {
  max-width: 80%;
  max-height: 84vh;
  object-fit: contain;
  box-shadow: 0 24px 80px rgba(40, 36, 30, 0.35);
}
@keyframes dossier-hero-in {
  from { transform: translateX(8vw) scale(0.92); opacity: 0; }
  to { transform: none; opacity: 1; }
}
.dossier-panel {
  flex: 1;
  position: relative;
  background: rgba(244, 242, 238, 0.96);
  border-left: 1px solid #999;
  padding: 8vh 4vw;
  overflow-y: auto;
  animation: dossier-panel-in 0.55s ease both;
}
@keyframes dossier-panel-in {
  from { transform: translateX(100%); }
  to { transform: none; }
}
.dossier-numeral {
  display: block;
  letter-spacing: 0.5em;
  font-size: 0.9rem;
  opacity: 0.6;
}
.dossier-panel h2 {
  font-size: clamp(1.6rem, 3.4vw, 2.6rem);
  letter-spacing: 0.28em;
  font-style: italic;
  font-weight: 400;
  margin: 0.3rem 0 2rem;
}
.dossier-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.9rem;
}
.dossier-grid button {
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
}
.dossier-grid button:focus-visible {
  outline: 2px solid #3b372f;
  outline-offset: 3px;
}
.dossier-grid img {
  width: 100%;
  display: block;
  filter: saturate(0.6);
  transition: filter 0.35s ease;
}
.dossier-grid button:hover img,
.dossier-grid button:focus-visible img {
  filter: none;
}
.dossier-data {
  margin-top: 3rem;
  border-top: 1px solid #b5b0a8;
  padding-top: 1.4rem;
}
.dossier-data div {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  letter-spacing: 0.2em;
  padding: 0.45rem 0;
}
.dossier-data dd {
  margin: 0;
  opacity: 0.65;
}
.dossier-close {
  position: absolute;
  top: 1.2rem;
  right: 1.4rem;
  background: none;
  border: none;
  font-size: 1.6rem;
  cursor: pointer;
  color: #3b372f;
}
@media (max-width: 700px) {
  .story-dossier { flex-direction: column; overflow-y: auto; }
  .dossier-hero { flex: 0 0 auto; padding: 8vh 0 2vh; }
  .dossier-hero img { max-height: 44vh; }
  .dossier-panel { animation-name: dossier-hero-in; }
}
```

- [ ] **Step 4:** lint + `npm run build`. **Step 5: Commit** `"Story v2: dossier detail view with garment data"`.

---

### Task 5: Browser verification — v2 flow

Dev server + Playwright (route `/collections/collection1-story`):
- [ ] Each chapter shows exactly ONE photo plane (screenshot chapters 1–2; compare against v1's clusters)
- [ ] Click hero → dossier opens: hero left, panel right with grid (n−1 thumbnails) + data list with em-dashes + ATELIER value
- [ ] Click grid photo → lightbox opens OVER dossier (full-res /outfits/ src); Esc closes lightbox first (dossier still open), Esc again closes dossier
- [ ] Backdrop click + × both close the dossier; scroll locked while open, restored after
- [ ] Mobile 390×844: dossier stacks vertically, scrollable
- [ ] Console clean. Fix minimally + commit if broken; no commit if clean.

---

### Task 6 (ORCHESTRATOR-SIDE — not a subagent task): Higgsfield hero loops

For each sin hero photo (`public/outfits/<sin>/<hero>`): generate a 3–5 s subtle img2vid loop (fabric sway, breathing, light drift; static framing; NO garment morphing) via the higgsfield-generate skill. Show each clip to the user next to the source still for the **fidelity gate**. Approved → encode/copy to `public/outfits-video/<sin>.mp4` (H.264, ≤1024px, muted) and flip that sin's `video: true` in photoManifest.js. Rejected → retry once with adjusted prompt or leave the still.

- [ ] Generate 5 clips, present for approval, install approved ones, flip flags, commit `"Story v2: living hero loops (user-approved)"` (only outfits-video + photoManifest.js).

---

### Task 7: Final pass

- [ ] `npm test` + lint + build green
- [ ] Browser: videos autoplay on heroes that have them (verify `document.querySelector` is N/A — videos are off-DOM; instead screenshot heroes and check motion between two frames 1s apart); hover-to-color still works on video heroes
- [ ] Re-capture walkthrough screenshots → `story-walkthrough/v2/`
- [ ] Commit any tweaks; report.
