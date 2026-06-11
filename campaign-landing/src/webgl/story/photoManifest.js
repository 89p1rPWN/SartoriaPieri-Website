// Static content manifest for the collection story. Photos live in
// public/outfits/<sin>/ (originals, lightbox) and public/outfits-web/<sin>/
// (1024px copies, WebGL textures — see scripts/resize-outfits.sh).

export const ZONE_SPACING = 14

const range = (n) => Array.from({ length: n }, (_, i) => `${i + 1}.jpg`)

// Garment data shown in the dossier. Values are user-edited; empty string
// renders as an em-dash until filled.
const garmentData = (overrides = {}) =>
  ['PATCHWORK', 'FABRIC', 'CUT', 'ATELIER'].map((label) => ({
    label,
    value: overrides[label] ?? (label === 'ATELIER' ? 'Sartoria Pieri, 2026' : ''),
  }))

const SINS = [
  { slug: 'depravazione', numeral: 'I', photos: range(8), hero: '1.jpg', data: garmentData(), video: true },
  { slug: 'dolore', numeral: 'II', photos: [...range(6), 'dolore_main.jpg'], hero: 'dolore_main.jpg', data: garmentData(), video: true },
  // perversione/trauma 1.jpg are process-collage pages, not outfit shots —
  // heroes point at the true full-look photos.
  { slug: 'perversione', numeral: 'III', photos: range(9), hero: '2.jpg', data: garmentData(), video: true },
  { slug: 'trauma', numeral: 'IV', photos: range(10), hero: '3.jpg', data: garmentData(), video: true },
  { slug: 'vergogna', numeral: 'V', photos: [...range(8), 'vergogna_main.jpg'], hero: 'vergogna_main.jpg', data: garmentData(), video: true },
]

export const CHAPTERS = SINS.map((sin, index) => ({
  ...sin,
  index,
  z: -(index + 1) * ZONE_SPACING,
}))

export const webSrc = (slug, file) => `/outfits-web/${slug}/${file}`
export const fullSrc = (slug, file) => `/outfits/${slug}/${file}`
export const videoSrc = (slug) => `/outfits-video/${slug}.mp4`

// One hero per chapter, replacing v1's scatter. x echoes the camera
// S-curve side (camera weaves to ∓1.4; hero sits at ∓0.9 on the same side).
export function heroPlacement(chapterIndex, lateralScale = 1) {
  const chapter = CHAPTERS[chapterIndex]
  const side = chapterIndex % 2 === 0 ? -1 : 1
  // Portrait (lateralScale < 1): the frustum is ~3× narrower, so the hero
  // needs a deeper standoff from the camera knot (z = chapter.z + 4) and a
  // smaller plane, or it fills and clips the frame at the chapter midpoint.
  const portrait = lateralScale < 1
  return {
    file: chapter.hero,
    x: side * 0.9 * lateralScale,
    y: 0,
    z: chapter.z + (portrait ? -1 : 1.5),
    rotY: side * -0.06,
    rotZ: 0,
    scale: portrait ? 1.15 : 1.9,
    drift: { speed: 0.35, phase: chapterIndex * 1.7, amp: 0.07 },
  }
}
