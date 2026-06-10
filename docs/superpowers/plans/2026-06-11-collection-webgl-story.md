# Collection WebGL Story Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scroll-driven WebGL story for the collection page — camera dollies through a pale-fog 3D void past five chapter zones (the five sins), each filled with that look's photos as floating clickable planes.

**Architecture:** A tall (600vh) empty scroll container drives a GSAP ScrollTrigger whose progress feeds a ref read every frame by a fixed React-Three-Fiber canvas. The camera follows a CatmullRom spline through five zones along −Z. Photos are textured planes with a custom bleach/grain/fog shader; clicking opens a DOM lightbox. Reduced-motion/no-WebGL users get a static grid fallback.

**Tech Stack:** React 19, @react-three/fiber, @react-three/drei, three, GSAP ScrollTrigger, Lenis, Vite, vitest (new devDep).

**Spec:** `docs/superpowers/specs/2026-06-10-collection-webgl-story-design.md`

**Working directory for all commands:** `/home/89p13/Projects/SartoriaPieri/campaign-landing` unless stated otherwise.

---

## File map

| File | Responsibility |
|---|---|
| `scripts/resize-outfits.sh` (repo root) | Generate `public/outfits-web/` 1024px texture copies |
| `src/webgl/story/photoManifest.js` | Static chapter/photo data + deterministic plane layout |
| `src/webgl/story/useStoryScroll.js` | Scroll-progress constants + chapter math (pure, tested) |
| `src/webgl/story/fogPlaneMaterial.js` | Bleach/grain/fog shader material |
| `src/webgl/story/PhotoPlane.jsx` | One textured plane: drift, hover, near-camera fade, click |
| `src/webgl/story/ChapterZone.jsx` | Mounts one sin's planes lazily (Suspense) |
| `src/webgl/story/StoryCanvas.jsx` | Canvas, camera spline rig, parallax, zone mounting |
| `src/StoryFallback.jsx` | Static grid for reduced-motion / no-WebGL |
| `src/Collection1Story.jsx` | Page: Lenis + ScrollTrigger wiring, overlays, lightbox |
| `src/Collection1Story.css` | Overlay typography, lightbox, grain, fallback grid |
| `src/main.jsx` (modify) | Add `/collections/collection1-story` route |
| `src/webgl/story/__tests__/photoManifest.test.js` | Manifest + layout unit tests |
| `src/webgl/story/__tests__/useStoryScroll.test.js` | Chapter math unit tests |

Photo inventory (numbered `.jpg` only; `_nobg` pngs/webp/mp4 are excluded):

- depravazione: 1–8.jpg (hero `1.jpg`)
- dolore: 1–6.jpg + `dolore_main.jpg` (hero `dolore_main.jpg`)
- perversione: 1–9.jpg (hero `1.jpg`)
- trauma: 1–10.jpg (hero `1.jpg`)
- vergogna: 1–8.jpg + `vergogna_main.jpg` (hero `vergogna_main.jpg`)

All photos are 1080×1350 (4:5 portrait).

---

### Task 1: Tooling — vitest + web-size textures

**Files:**
- Create: `/home/89p13/Projects/SartoriaPieri/scripts/resize-outfits.sh`
- Modify: `campaign-landing/package.json` (add vitest + test script)

- [ ] **Step 1: Install vitest**

```bash
cd /home/89p13/Projects/SartoriaPieri/campaign-landing && npm install -D vitest
```

- [ ] **Step 2: Add test script to package.json**

In `campaign-landing/package.json`, add to `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 3: Create the resize script**

Create `/home/89p13/Projects/SartoriaPieri/scripts/resize-outfits.sh`:

```bash
#!/usr/bin/env bash
# Generates web-sized (max edge 1024px, q72) copies of the numbered outfit
# photos for use as WebGL textures. Originals stay untouched and are used
# by the lightbox.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/campaign-landing/public/outfits"
DST="$ROOT/campaign-landing/public/outfits-web"

for dir in "$SRC"/*/; do
  sin="$(basename "$dir")"
  mkdir -p "$DST/$sin"
  for f in "$dir"*.jpg; do
    out="$DST/$sin/$(basename "$f")"
    magick "$f" -resize '1024x1024>' -quality 72 "$out"
    echo "wrote $out"
  done
done
```

- [ ] **Step 4: Run it and verify output**

```bash
chmod +x /home/89p13/Projects/SartoriaPieri/scripts/resize-outfits.sh && /home/89p13/Projects/SartoriaPieri/scripts/resize-outfits.sh
```

Expected: `wrote ...` lines; then verify:

```bash
ls /home/89p13/Projects/SartoriaPieri/campaign-landing/public/outfits-web/dolore/
identify /home/89p13/Projects/SartoriaPieri/campaign-landing/public/outfits-web/dolore/1.jpg
```

Expected: `1.jpg ... 6.jpg dolore_main.jpg`, and dimensions `819x1024` (1080×1350 scaled to max edge 1024).

- [ ] **Step 5: Commit**

```bash
cd /home/89p13/Projects/SartoriaPieri && git add scripts/resize-outfits.sh campaign-landing/package.json campaign-landing/package-lock.json campaign-landing/public/outfits-web && git commit -m "Story: tooling — vitest + web-size outfit textures"
```

---

### Task 2: photoManifest — chapters + deterministic layout

**Files:**
- Create: `campaign-landing/src/webgl/story/photoManifest.js`
- Test: `campaign-landing/src/webgl/story/__tests__/photoManifest.test.js`

- [ ] **Step 1: Write the failing test**

Create `campaign-landing/src/webgl/story/__tests__/photoManifest.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { CHAPTERS, ZONE_SPACING, chapterLayout, webSrc, fullSrc } from '../photoManifest.js'

describe('CHAPTERS', () => {
  it('has the five sins in order with roman numerals', () => {
    expect(CHAPTERS.map((c) => c.slug)).toEqual([
      'depravazione', 'dolore', 'perversione', 'trauma', 'vergogna',
    ])
    expect(CHAPTERS.map((c) => c.numeral)).toEqual(['I', 'II', 'III', 'IV', 'V'])
  })

  it('places zones at decreasing z, one spacing apart', () => {
    CHAPTERS.forEach((c, i) => expect(c.z).toBe(-(i + 1) * ZONE_SPACING))
  })

  it('every hero is one of the chapter photos', () => {
    CHAPTERS.forEach((c) => expect(c.photos).toContain(c.hero))
  })

  it('builds web and full src paths', () => {
    expect(webSrc('dolore', '2.jpg')).toBe('/outfits-web/dolore/2.jpg')
    expect(fullSrc('dolore', '2.jpg')).toBe('/outfits/dolore/2.jpg')
  })
})

describe('chapterLayout', () => {
  it('is deterministic', () => {
    expect(chapterLayout(2)).toEqual(chapterLayout(2))
  })

  it('returns one placement per photo, hero largest and nearest', () => {
    const layout = chapterLayout(1) // dolore
    expect(layout).toHaveLength(CHAPTERS[1].photos.length)
    const hero = layout.find((p) => p.isHero)
    const others = layout.filter((p) => !p.isHero)
    expect(hero.file).toBe('dolore_main.jpg')
    others.forEach((o) => expect(hero.scale).toBeGreaterThan(o.scale))
  })

  it('compresses lateral spread with lateralScale', () => {
    const wide = chapterLayout(0, 1)
    const narrow = chapterLayout(0, 0.55)
    wide.forEach((p, i) => {
      expect(Math.abs(narrow[i].x)).toBeCloseTo(Math.abs(p.x) * 0.55, 5)
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/89p13/Projects/SartoriaPieri/campaign-landing && npx vitest run src/webgl/story/__tests__/photoManifest.test.js
```

Expected: FAIL — cannot resolve `../photoManifest.js`.

- [ ] **Step 3: Write the implementation**

Create `campaign-landing/src/webgl/story/photoManifest.js`:

```js
// Static content manifest for the collection story. Photos live in
// public/outfits/<sin>/ (originals, lightbox) and public/outfits-web/<sin>/
// (1024px copies, WebGL textures — see scripts/resize-outfits.sh).

export const ZONE_SPACING = 14

const range = (n) => Array.from({ length: n }, (_, i) => `${i + 1}.jpg`)

const SINS = [
  { slug: 'depravazione', numeral: 'I', photos: range(8), hero: '1.jpg' },
  { slug: 'dolore', numeral: 'II', photos: [...range(6), 'dolore_main.jpg'], hero: 'dolore_main.jpg' },
  { slug: 'perversione', numeral: 'III', photos: range(9), hero: '1.jpg' },
  { slug: 'trauma', numeral: 'IV', photos: range(10), hero: '1.jpg' },
  { slug: 'vergogna', numeral: 'V', photos: [...range(8), 'vergogna_main.jpg'], hero: 'vergogna_main.jpg' },
]

export const CHAPTERS = SINS.map((sin, index) => ({
  ...sin,
  index,
  z: -(index + 1) * ZONE_SPACING,
}))

export const webSrc = (slug, file) => `/outfits-web/${slug}/${file}`
export const fullSrc = (slug, file) => `/outfits/${slug}/${file}`

// Deterministic PRNG so the scatter is stable across reloads and tests.
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Plane placements for one chapter. lateralScale < 1 compresses x for
// portrait screens. Photos are 4:5; plane geometry is 1.76 x 2.2 world
// units at scale 1 (set in PhotoPlane).
export function chapterLayout(chapterIndex, lateralScale = 1) {
  const chapter = CHAPTERS[chapterIndex]
  const rand = mulberry32(chapterIndex * 9301 + 49297)
  return chapter.photos.map((file, i) => {
    const isHero = file === chapter.hero
    const side = i % 2 === 0 ? -1 : 1
    return {
      file,
      isHero,
      x: (isHero ? side * 1.2 : side * (1.6 + rand() * 3.4)) * lateralScale,
      y: isHero ? 0 : (rand() - 0.5) * 2.4,
      z: chapter.z + (isHero ? 1.5 : (rand() - 0.5) * 6),
      rotY: (rand() - 0.5) * 0.14,
      rotZ: (rand() - 0.5) * 0.1,
      scale: isHero ? 1.45 : 0.85 + rand() * 0.35,
      drift: {
        speed: 0.3 + rand() * 0.4,
        phase: rand() * Math.PI * 2,
        amp: 0.08 + rand() * 0.08,
      },
    }
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /home/89p13/Projects/SartoriaPieri/campaign-landing && npx vitest run src/webgl/story/__tests__/photoManifest.test.js
```

Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
cd /home/89p13/Projects/SartoriaPieri && git add campaign-landing/src/webgl/story && git commit -m "Story: photo manifest + deterministic chapter layout"
```

---

### Task 3: useStoryScroll — progress constants + chapter math

**Files:**
- Create: `campaign-landing/src/webgl/story/useStoryScroll.js`
- Test: `campaign-landing/src/webgl/story/__tests__/useStoryScroll.test.js`

- [ ] **Step 1: Write the failing test**

Create `campaign-landing/src/webgl/story/__tests__/useStoryScroll.test.js`:

```js
import { describe, it, expect } from 'vitest'
import {
  INTRO_FRACTION, OUTRO_FRACTION, CHAPTER_COUNT, SEGMENT,
  activeChapter, chapterLocalProgress,
} from '../useStoryScroll.js'

describe('activeChapter', () => {
  it('returns -1 during the intro', () => {
    expect(activeChapter(0)).toBe(-1)
    expect(activeChapter(INTRO_FRACTION - 0.001)).toBe(-1)
  })

  it('returns chapter index across the middle band', () => {
    expect(activeChapter(INTRO_FRACTION)).toBe(0)
    expect(activeChapter(INTRO_FRACTION + SEGMENT * 2.5)).toBe(2)
    expect(activeChapter(1 - OUTRO_FRACTION - 0.001)).toBe(CHAPTER_COUNT - 1)
  })

  it('returns CHAPTER_COUNT during the outro', () => {
    expect(activeChapter(1 - OUTRO_FRACTION)).toBe(CHAPTER_COUNT)
    expect(activeChapter(1)).toBe(CHAPTER_COUNT)
  })
})

describe('chapterLocalProgress', () => {
  it('is 0 before the chapter and 1 after it', () => {
    expect(chapterLocalProgress(0, 2)).toBe(0)
    expect(chapterLocalProgress(1, 2)).toBe(1)
  })

  it('is 0.5 at the chapter midpoint', () => {
    const mid = INTRO_FRACTION + SEGMENT * 2.5
    expect(chapterLocalProgress(mid, 2)).toBeCloseTo(0.5, 5)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/89p13/Projects/SartoriaPieri/campaign-landing && npx vitest run src/webgl/story/__tests__/useStoryScroll.test.js
```

Expected: FAIL — cannot resolve `../useStoryScroll.js`.

- [ ] **Step 3: Write the implementation**

Create `campaign-landing/src/webgl/story/useStoryScroll.js`:

```js
import { useRef } from 'react'

// Scroll timeline: [ intro | 5 equal chapter segments | outro ], all as
// fractions of total scroll progress (0..1).
export const INTRO_FRACTION = 0.08
export const OUTRO_FRACTION = 0.08
export const CHAPTER_COUNT = 5
export const SEGMENT = (1 - INTRO_FRACTION - OUTRO_FRACTION) / CHAPTER_COUNT

// -1 = intro, 0..4 = chapter index, CHAPTER_COUNT = outro.
export function activeChapter(progress) {
  if (progress < INTRO_FRACTION) return -1
  if (progress >= 1 - OUTRO_FRACTION) return CHAPTER_COUNT
  return Math.min(CHAPTER_COUNT - 1, Math.floor((progress - INTRO_FRACTION) / SEGMENT))
}

// 0..1 within chapter i's segment, clamped.
export function chapterLocalProgress(progress, i) {
  const start = INTRO_FRACTION + i * SEGMENT
  return Math.min(1, Math.max(0, (progress - start) / SEGMENT))
}

// Shared mutable progress holder — written by ScrollTrigger in the page,
// read every frame inside the canvas (no React re-render per scroll tick).
export function useStoryScroll() {
  return useRef({ progress: 0 })
}
```

- [ ] **Step 4: Run all tests to verify pass**

```bash
cd /home/89p13/Projects/SartoriaPieri/campaign-landing && npm test
```

Expected: PASS (both test files).

- [ ] **Step 5: Commit**

```bash
cd /home/89p13/Projects/SartoriaPieri && git add campaign-landing/src/webgl/story && git commit -m "Story: scroll timeline math (intro/chapters/outro)"
```

---

### Task 4: fogPlaneMaterial — bleach/grain/fog shader

**Files:**
- Create: `campaign-landing/src/webgl/story/fogPlaneMaterial.js`

No unit test — shader correctness is verified visually in Task 7's dev-server check.

- [ ] **Step 1: Write the material**

Create `campaign-landing/src/webgl/story/fogPlaneMaterial.js`:

```js
import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

// Textured plane material for the story:
// - uBleach 1 = washed look (desaturated, lifted blacks, grain); 0 = full
//   color (hover state)
// - manual fog toward uFogColor by view depth (scene has no THREE.Fog;
//   the canvas is transparent over a CSS gradient)
// - uOpacity for near-camera fade as the camera passes a plane
export const FogPlaneMaterial = shaderMaterial(
  {
    map: null,
    uBleach: 1,
    uOpacity: 1,
    uTime: 0,
    uFogColor: new THREE.Color('#c9c6bf'),
    uFogNear: 6,
    uFogFar: 26,
  },
  /* glsl */ `
    varying vec2 vUv;
    varying float vFogDepth;
    void main() {
      vUv = uv;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vFogDepth = -mvPosition.z;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  /* glsl */ `
    uniform sampler2D map;
    uniform float uBleach;
    uniform float uOpacity;
    uniform float uTime;
    uniform vec3 uFogColor;
    uniform float uFogNear;
    uniform float uFogFar;
    varying vec2 vUv;
    varying float vFogDepth;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec4 tex = texture2D(map, vUv);
      float g = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
      vec3 col = mix(tex.rgb, vec3(g), uBleach * 0.55); // desaturate
      col = mix(col, vec3(1.0), uBleach * 0.16);        // lift blacks
      float grain = (hash(vUv * 700.0 + fract(uTime) * 13.0) - 0.5) * 0.06;
      col += grain * uBleach;
      float fogF = smoothstep(uFogNear, uFogFar, vFogDepth);
      col = mix(col, uFogColor, fogF);
      float alpha = uOpacity * (1.0 - fogF * 0.85);
      gl_FragColor = vec4(col, alpha);
    }
  `,
)

extend({ FogPlaneMaterial })
```

- [ ] **Step 2: Verify it parses (lint)**

```bash
cd /home/89p13/Projects/SartoriaPieri/campaign-landing && npx eslint src/webgl/story/fogPlaneMaterial.js
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /home/89p13/Projects/SartoriaPieri && git add campaign-landing/src/webgl/story/fogPlaneMaterial.js && git commit -m "Story: bleach/grain/fog plane shader"
```

---

### Task 5: PhotoPlane — drift, hover, fade, click

**Files:**
- Create: `campaign-landing/src/webgl/story/PhotoPlane.jsx`

- [ ] **Step 1: Write the component**

Create `campaign-landing/src/webgl/story/PhotoPlane.jsx`:

```jsx
import React, { useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { FogPlaneMaterial } from './fogPlaneMaterial.js'

// 4:5 portrait plane. Photos are 1080x1350.
const PLANE_W = 1.76
const PLANE_H = 2.2

export default function PhotoPlane({ placement, url, onClick }) {
  const mesh = useRef()
  const mat = useRef()
  const [hovered, setHovered] = useState(false)
  const texture = useTexture(url, (t) => {
    t.colorSpace = THREE.SRGBColorSpace
  })

  useFrame((state) => {
    const { drift, y, scale } = placement
    const t = state.clock.elapsedTime
    // Slow vertical drift around the placement's base y.
    mesh.current.position.y = y + Math.sin(t * drift.speed + drift.phase) * drift.amp
    // Hover: ease toward color + slight scale-up.
    const targetBleach = hovered ? 0 : 1
    mat.current.uBleach = THREE.MathUtils.lerp(mat.current.uBleach, targetBleach, 0.08)
    const targetScale = scale * (hovered ? 1.04 : 1)
    mesh.current.scale.x = THREE.MathUtils.lerp(mesh.current.scale.x, targetScale, 0.1)
    mesh.current.scale.y = mesh.current.scale.x
    // Fade out as the camera passes (camera moves toward -z; d shrinks).
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
        map={texture}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
```

- [ ] **Step 2: Lint**

```bash
cd /home/89p13/Projects/SartoriaPieri/campaign-landing && npx eslint src/webgl/story/PhotoPlane.jsx
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /home/89p13/Projects/SartoriaPieri && git add campaign-landing/src/webgl/story/PhotoPlane.jsx && git commit -m "Story: PhotoPlane with drift, hover-to-color, pass-fade"
```

---

### Task 6: ChapterZone — lazy-mounted sin cluster

**Files:**
- Create: `campaign-landing/src/webgl/story/ChapterZone.jsx`

- [ ] **Step 1: Write the component**

Create `campaign-landing/src/webgl/story/ChapterZone.jsx`:

```jsx
import React, { Suspense, useMemo } from 'react'
import { CHAPTERS, chapterLayout, webSrc } from './photoManifest.js'
import PhotoPlane from './PhotoPlane.jsx'

// A failed texture load silently omits that plane (per spec) instead of
// breaking the whole chapter's Suspense tree.
class PlaneBoundary extends React.Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error) {
    if (import.meta.env.DEV) console.warn('PhotoPlane texture failed:', error)
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

// One sin's photo cluster. Mounted only when the camera is within one zone
// (StoryCanvas decides); Suspense means planes appear once textures load —
// the fog hides pop-in.
export default function ChapterZone({ chapterIndex, lateralScale, onPhotoClick }) {
  const chapter = CHAPTERS[chapterIndex]
  const layout = useMemo(
    () => chapterLayout(chapterIndex, lateralScale),
    [chapterIndex, lateralScale],
  )

  return (
    <group>
      {layout.map((placement, photoIndex) => (
        <PlaneBoundary key={placement.file}>
          <Suspense fallback={null}>
            <PhotoPlane
              placement={placement}
              url={webSrc(chapter.slug, placement.file)}
              onClick={() => onPhotoClick(chapterIndex, photoIndex)}
            />
          </Suspense>
        </PlaneBoundary>
      ))}
    </group>
  )
}
```

- [ ] **Step 2: Lint**

```bash
cd /home/89p13/Projects/SartoriaPieri/campaign-landing && npx eslint src/webgl/story/ChapterZone.jsx
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /home/89p13/Projects/SartoriaPieri && git add campaign-landing/src/webgl/story/ChapterZone.jsx && git commit -m "Story: ChapterZone lazy photo cluster"
```

---

### Task 7: StoryCanvas — camera spline rig + parallax

**Files:**
- Create: `campaign-landing/src/webgl/story/StoryCanvas.jsx`

- [ ] **Step 1: Write the component**

Create `campaign-landing/src/webgl/story/StoryCanvas.jsx`:

```jsx
import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { CHAPTERS, ZONE_SPACING } from './photoManifest.js'
import ChapterZone from './ChapterZone.jsx'
import { CHAPTER_COUNT } from './useStoryScroll.js'

// Camera path: gentle lateral S-curve weaving past the zones, ending a
// little beyond the last one.
function useCameraCurve() {
  return useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 6),
        ...CHAPTERS.map(
          (c, i) => new THREE.Vector3(i % 2 === 0 ? -1.4 : 1.4, 0, c.z + 4),
        ),
        new THREE.Vector3(0, 0, CHAPTERS[CHAPTER_COUNT - 1].z - ZONE_SPACING * 0.6),
      ]),
    [],
  )
}

function CameraRig({ progressRef }) {
  const { camera, pointer } = useThree()
  const curve = useCameraCurve()
  const lookTarget = useRef(new THREE.Vector3(0, 0, 0))

  useFrame(() => {
    const p = THREE.MathUtils.clamp(progressRef.current.progress, 0, 1)
    const pos = curve.getPoint(p)
    const ahead = curve.getPoint(Math.min(p + 0.03, 1))
    // Pointer parallax: small lateral/vertical offset + implicit tilt via lookAt.
    pos.x += pointer.x * 0.3
    pos.y += pointer.y * -0.2
    camera.position.lerp(pos, 0.12)
    lookTarget.current.lerp(ahead, 0.12)
    camera.lookAt(lookTarget.current)
  })
  return null
}

// activeChapter: -1 intro .. CHAPTER_COUNT outro (state from the page, so
// React mounts/unmounts zones; per-frame motion stays in refs).
export default function StoryCanvas({ progressRef, active, lateralScale, onPhotoClick }) {
  const mounted = CHAPTERS.filter((c) => {
    const clamped = Math.min(CHAPTER_COUNT - 1, Math.max(0, active))
    return Math.abs(c.index - clamped) <= 1
  })

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      camera={{ fov: 50, near: 0.1, far: 60, position: [0, 0, 6] }}
      style={{ position: 'fixed', inset: 0 }}
    >
      <CameraRig progressRef={progressRef} />
      {mounted.map((c) => (
        <ChapterZone
          key={c.slug}
          chapterIndex={c.index}
          lateralScale={lateralScale}
          onPhotoClick={onPhotoClick}
        />
      ))}
    </Canvas>
  )
}
```

- [ ] **Step 2: Lint**

```bash
cd /home/89p13/Projects/SartoriaPieri/campaign-landing && npx eslint src/webgl/story/StoryCanvas.jsx
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /home/89p13/Projects/SartoriaPieri && git add campaign-landing/src/webgl/story/StoryCanvas.jsx && git commit -m "Story: canvas + camera spline rig with pointer parallax"
```

---

### Task 8: Collection1Story page + CSS + route

**Files:**
- Create: `campaign-landing/src/Collection1Story.jsx`
- Create: `campaign-landing/src/Collection1Story.css`
- Modify: `campaign-landing/src/main.jsx` (add route)

- [ ] **Step 1: Write the page component**

Create `campaign-landing/src/Collection1Story.jsx`:

```jsx
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import StoryCanvas from './webgl/story/StoryCanvas.jsx'
import StoryFallback from './StoryFallback.jsx'
import { CHAPTERS, fullSrc } from './webgl/story/photoManifest.js'
import { useStoryScroll, activeChapter, CHAPTER_COUNT } from './webgl/story/useStoryScroll.js'
import './Collection1Story.css'

gsap.registerPlugin(ScrollTrigger)

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export default function Collection1Story() {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const webgl = typeof window !== 'undefined' && supportsWebGL()

  const progressRef = useStoryScroll()
  const scrollRef = useRef(null)
  const lenisRef = useRef(null)
  const [active, setActive] = useState(-1)
  const [lightbox, setLightbox] = useState(null) // {chapterIndex, photoIndex} | null
  const [lateralScale] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(orientation: portrait)').matches
      ? 0.55
      : 1,
  )

  const useCanvas = webgl && !reduced

  useEffect(() => {
    if (!useCanvas) return undefined
    const lenis = new Lenis({ syncTouch: true })
    lenisRef.current = lenis
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    const st = ScrollTrigger.create({
      trigger: scrollRef.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        progressRef.current.progress = self.progress
        // Future audio (out of scope v1) subscribes to this, per spec.
        window.dispatchEvent(new CustomEvent('story:progress', { detail: self.progress }))
        setActive((prev) => {
          const next = activeChapter(self.progress)
          return next === prev ? prev : next
        })
      },
    })

    return () => {
      st.kill()
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [useCanvas, progressRef])

  // Lightbox: lock scroll while open, Esc to close.
  useEffect(() => {
    if (!lightbox) return undefined
    lenisRef.current?.stop()
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight') stepLightbox(1)
      if (e.key === 'ArrowLeft') stepLightbox(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      lenisRef.current?.start()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox])

  const openLightbox = useCallback(
    (chapterIndex, photoIndex) => setLightbox({ chapterIndex, photoIndex }),
    [],
  )
  const stepLightbox = (dir) =>
    setLightbox((lb) => {
      if (!lb) return lb
      const photos = CHAPTERS[lb.chapterIndex].photos
      const next = (lb.photoIndex + dir + photos.length) % photos.length
      return { ...lb, photoIndex: next }
    })

  if (!useCanvas) {
    return (
      <div className="story-page">
        <StoryFallback onPhotoClick={openLightbox} />
        {lightbox && (
          <Lightbox lightbox={lightbox} onStep={stepLightbox} onClose={() => setLightbox(null)} />
        )}
      </div>
    )
  }

  return (
    <div className="story-page">
      <StoryCanvas
        progressRef={progressRef}
        active={active}
        lateralScale={lateralScale}
        onPhotoClick={openLightbox}
      />
      <div className="story-grain" aria-hidden="true" />

      {/* DOM overlays */}
      <div className={`story-card story-intro ${active === -1 ? 'visible' : ''}`}>
        <h1>SARTORIA PIERI</h1>
        <p className="story-sub">I CINQUE PECCATI</p>
        <p className="story-hint">scroll</p>
      </div>
      {CHAPTERS.map((c) => (
        <div key={c.slug} className={`story-title ${active === c.index ? 'visible' : ''}`}>
          <span className="story-numeral">{c.numeral}</span>
          <h2>{c.slug.toUpperCase()}</h2>
        </div>
      ))}
      <div className={`story-card story-outro ${active === CHAPTER_COUNT ? 'visible' : ''}`}>
        <p className="story-sub">FINE</p>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/contact">Contact</Link>
        </nav>
      </div>

      {/* Scroll spacer that drives everything */}
      <div ref={scrollRef} className="story-scroll" />

      {lightbox && (
        <Lightbox lightbox={lightbox} onStep={stepLightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  )
}

function Lightbox({ lightbox, onStep, onClose }) {
  const chapter = CHAPTERS[lightbox.chapterIndex]
  const file = chapter.photos[lightbox.photoIndex]
  return (
    <div className="story-lightbox" onClick={onClose} role="dialog" aria-modal="true">
      <figure onClick={(e) => e.stopPropagation()}>
        <img src={fullSrc(chapter.slug, file)} alt={`${chapter.slug} look ${lightbox.photoIndex + 1}`} />
        <figcaption>
          {chapter.slug.toUpperCase()} — {lightbox.photoIndex + 1}/{chapter.photos.length}
        </figcaption>
        <button className="lb-prev" aria-label="Previous" onClick={() => onStep(-1)}>←</button>
        <button className="lb-next" aria-label="Next" onClick={() => onStep(1)}>→</button>
        <button className="lb-close" aria-label="Close" onClick={onClose}>×</button>
      </figure>
    </div>
  )
}
```

- [ ] **Step 2: Write the CSS**

Create `campaign-landing/src/Collection1Story.css`:

```css
.story-page {
  background: linear-gradient(180deg, #d9d7d2 0%, #b8b5ae 60%, #a39f97 100%);
  min-height: 100vh;
  color: #3b372f;
  font-family: Georgia, 'Times New Roman', serif;
}

.story-scroll {
  height: 600vh;
  pointer-events: none;
}

/* Animated film grain over everything (cheaper than a postprocessing pass) */
.story-grain {
  position: fixed;
  inset: -50%;
  pointer-events: none;
  z-index: 3;
  opacity: 0.05;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E");
  animation: story-grain-shift 0.6s steps(3) infinite;
}
@keyframes story-grain-shift {
  0% { transform: translate(0, 0); }
  33% { transform: translate(-2%, 1%); }
  66% { transform: translate(1%, -2%); }
  100% { transform: translate(0, 0); }
}

/* Overlay cards & chapter titles */
.story-card,
.story-title {
  position: fixed;
  z-index: 2;
  pointer-events: none;
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.story-card.visible,
.story-title.visible {
  opacity: 1;
  transform: translateY(0);
}

.story-intro,
.story-outro {
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.story-intro h1 {
  font-size: clamp(2.2rem, 6vw, 4.5rem);
  letter-spacing: 0.35em;
  font-weight: 400;
  margin: 0;
}
.story-sub {
  letter-spacing: 0.5em;
  font-size: clamp(0.8rem, 1.6vw, 1.1rem);
  margin-top: 1.2rem;
}
.story-hint {
  position: absolute;
  bottom: 6vh;
  font-size: 0.75rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  animation: story-hint-bob 2.2s ease-in-out infinite;
}
@keyframes story-hint-bob {
  0%, 100% { transform: translateY(0); opacity: 0.6; }
  50% { transform: translateY(8px); opacity: 1; }
}
.story-outro nav {
  pointer-events: auto;
  margin-top: 2rem;
  display: flex;
  gap: 3rem;
}
.story-outro a {
  color: inherit;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  font-size: 0.85rem;
  text-decoration: none;
  border-bottom: 1px solid currentColor;
  padding-bottom: 0.3rem;
}

.story-title {
  left: 6vw;
  bottom: 10vh;
}
.story-numeral {
  display: block;
  font-size: clamp(0.9rem, 1.8vw, 1.2rem);
  letter-spacing: 0.5em;
  opacity: 0.6;
}
.story-title h2 {
  font-size: clamp(1.8rem, 5vw, 3.6rem);
  letter-spacing: 0.28em;
  font-weight: 400;
  font-style: italic;
  margin: 0.3rem 0 0;
}

/* Lightbox */
.story-lightbox {
  position: fixed;
  inset: 0;
  z-index: 10;
  background: rgba(20, 19, 17, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
}
.story-lightbox figure {
  position: relative;
  margin: 0;
  max-width: min(86vw, 720px);
}
.story-lightbox img {
  width: 100%;
  max-height: 84vh;
  object-fit: contain;
  display: block;
}
.story-lightbox figcaption {
  color: #d9d7d2;
  text-align: center;
  letter-spacing: 0.35em;
  font-size: 0.8rem;
  margin-top: 1rem;
}
.story-lightbox button {
  position: absolute;
  background: none;
  border: none;
  color: #d9d7d2;
  font-size: 1.6rem;
  cursor: pointer;
  padding: 0.6rem;
}
.lb-prev { left: -3.2rem; top: 50%; transform: translateY(-50%); }
.lb-next { right: -3.2rem; top: 50%; transform: translateY(-50%); }
.lb-close { top: -2.8rem; right: 0; }
@media (max-width: 700px) {
  .lb-prev { left: 0.2rem; }
  .lb-next { right: 0.2rem; }
}

/* Fallback grid (reduced motion / no WebGL) */
.story-fallback {
  padding: 14vh 6vw;
}
.story-fallback section {
  margin-bottom: 12vh;
}
.story-fallback h2 {
  font-size: clamp(1.6rem, 4vw, 2.8rem);
  letter-spacing: 0.28em;
  font-style: italic;
  font-weight: 400;
}
.story-fallback .fb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.2rem;
  margin-top: 2rem;
}
.story-fallback img {
  width: 100%;
  display: block;
  filter: saturate(0.5) brightness(1.04);
  cursor: pointer;
  transition: filter 0.4s ease;
}
.story-fallback img:hover {
  filter: none;
}
```

- [ ] **Step 3: Create a placeholder StoryFallback so the page compiles**

Create `campaign-landing/src/StoryFallback.jsx` (full version in Task 10; minimal now so imports resolve):

```jsx
import React from 'react'
import { CHAPTERS, webSrc } from './webgl/story/photoManifest.js'

export default function StoryFallback({ onPhotoClick }) {
  return (
    <div className="story-fallback">
      {CHAPTERS.map((c) => (
        <section key={c.slug}>
          <h2>{c.numeral} — {c.slug.toUpperCase()}</h2>
          <div className="fb-grid">
            {c.photos.map((file, photoIndex) => (
              <img
                key={file}
                src={webSrc(c.slug, file)}
                alt={`${c.slug} look ${photoIndex + 1}`}
                loading="lazy"
                onClick={() => onPhotoClick(c.index, photoIndex)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Add the route**

In `campaign-landing/src/main.jsx`, add the import alongside the others:

```jsx
import Collection1Story from './Collection1Story.jsx'
```

and the route next to the existing collection route:

```jsx
<Route path="/collections/collection1-story" element={<Collection1Story />} />
```

- [ ] **Step 5: Build + visual smoke test**

```bash
cd /home/89p13/Projects/SartoriaPieri/campaign-landing && npx eslint src/Collection1Story.jsx src/StoryFallback.jsx && npm run build
```

Expected: lint clean, build succeeds.

Then start the dev server (`npm run dev`, background) and with the Playwright browser tools:
1. Navigate to `http://localhost:5173/collections/collection1-story`
2. Screenshot at top — expect fog gradient + intro card ("SARTORIA PIERI / I CINQUE PECCATI") + grain
3. Scroll to ~25% — expect DEPRAVAZIONE or DOLORE photos floating in fog, chapter title bottom-left
4. Scroll to bottom — expect FINE outro card with working Home/Contact links
5. Check the console for errors (no shader compile errors, no 404s on `/outfits-web/...`)

- [ ] **Step 6: Commit**

```bash
cd /home/89p13/Projects/SartoriaPieri && git add campaign-landing/src/Collection1Story.jsx campaign-landing/src/Collection1Story.css campaign-landing/src/StoryFallback.jsx campaign-landing/src/main.jsx && git commit -m "Story: page, overlays, route, fallback grid"
```

---

### Task 9: Lightbox verification + hover polish

The lightbox component shipped in Task 8; this task verifies the full interaction loop in the browser and fixes what's off.

- [ ] **Step 1: Browser-verify lightbox flow**

With the dev server running, via Playwright tools:
1. Scroll until a chapter's photos are in view
2. Click a photo plane → lightbox opens with the **full-res** image (`/outfits/...`, not `/outfits-web/...`) — verify via the img src in a snapshot
3. Caption reads e.g. `DOLORE — 3/7`
4. Arrow keys and on-screen arrows cycle within the chapter (wraps around)
5. Esc, the × button, and backdrop click each close it
6. While open, scrolling is locked (page doesn't move); after close, scrolling works again

- [ ] **Step 2: Browser-verify hover**

Hover a plane (Playwright `browser_hover` on the canvas at a plane's screen position): cursor becomes pointer. Screenshot before/after hover — hovered photo visibly gains saturation/contrast (uBleach → 0).

- [ ] **Step 3: Fix anything broken, lint, commit**

```bash
cd /home/89p13/Projects/SartoriaPieri && git add -A campaign-landing/src && git commit -m "Story: lightbox + hover interaction verified"
```

---

### Task 10: Fallback + reduced-motion verification

**Files:**
- Already created: `campaign-landing/src/StoryFallback.jsx` (extend only if verification finds gaps)

- [ ] **Step 1: Verify reduced-motion path**

Via Playwright: emulate `prefers-reduced-motion: reduce` (use `browser_run_code_unsafe` page context or relaunch with emulation), navigate to the story route. Expected: no canvas; static chapter grid with all five sins, images load from `/outfits-web/`, click opens the same lightbox.

- [ ] **Step 2: Verify portrait compression**

Resize viewport to 390×844 (iPhone-ish). Reload. Expected: planes stay within frame horizontally as you scroll (lateralScale 0.55). Screenshot one chapter midpoint for the record.

- [ ] **Step 3: Commit any fixes**

```bash
cd /home/89p13/Projects/SartoriaPieri && git add -A campaign-landing/src && git commit -m "Story: fallback + portrait verification fixes"
```

---

### Task 11: Final pass — full test suite, build, walkthrough

- [ ] **Step 1: Run everything**

```bash
cd /home/89p13/Projects/SartoriaPieri/campaign-landing && npm test && npx eslint src/webgl/story src/Collection1Story.jsx src/StoryFallback.jsx && npm run build
```

Expected: tests pass, lint clean, build succeeds.

- [ ] **Step 2: Full Playwright walkthrough with screenshots**

Capture and save screenshots at: intro, each of the five chapter midpoints, outro, lightbox open. Eyeball each: fog density readable, titles legible against fog, no plane clipping hard through the camera (the pass-fade should prevent it).

- [ ] **Step 3: Performance sanity**

In the browser, scroll fast end-to-end; watch for jank/long frames in the console timing (`browser_run_code_unsafe` with a simple rAF FPS meter for ~5s mid-scroll). Expected ≥ 50 fps desktop. If below: first lever is `dpr={[1, 1.5]}`, second is reducing grain shader cost.

- [ ] **Step 4: Final commit**

```bash
cd /home/89p13/Projects/SartoriaPieri && git add -A campaign-landing docs && git commit -m "Story: collection WebGL scroll story complete (dev route)"
```

**Deliberately not in this plan** (per spec): audio, swapping the route to `/collections/collection1` (user decision after review), deleting old Collection1 pages.
