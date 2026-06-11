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

// cutout: transparent-background PNG of the hero, used as the in-flow plane
// texture over the smoke. The hero jpg remains the dossier/lightbox image
// and the video poster.
const SINS = [
  { slug: 'depravazione', numeral: 'I', photos: range(8), hero: '1.jpg', cutout: '1_nobg.png', data: garmentData(), video: true, keyedVideo: false },
  { slug: 'dolore', numeral: 'II', photos: [...range(6), 'dolore_main.jpg'], hero: 'dolore_main.jpg', cutout: 'dolore_nobg.png', data: garmentData(), video: true, keyedVideo: true },
  // perversione/trauma 1.jpg are process-collage pages, not outfit shots —
  // heroes point at the true full-look photos.
  { slug: 'perversione', numeral: 'III', photos: range(9), hero: '2.jpg', cutout: '2_nobg.png', data: garmentData(), video: true, keyedVideo: false },
  { slug: 'trauma', numeral: 'IV', photos: range(10), hero: '3.jpg', cutout: '3_nobg.png', data: garmentData(), video: true, keyedVideo: false },
  { slug: 'vergogna', numeral: 'V', photos: [...range(8), 'vergogna_main.jpg'], hero: 'vergogna_main.jpg', cutout: 'vergogna_nobg.png', data: garmentData(), video: true, keyedVideo: false },
]

export const CHAPTERS = SINS.map((sin, index) => ({
  ...sin,
  index,
  z: -(index + 1) * ZONE_SPACING,
}))

export const webSrc = (slug, file) => `/outfits-web/${slug}/${file}`
export const fullSrc = (slug, file) => `/outfits/${slug}/${file}`
export const videoSrc = (slug) => `/outfits-video/${slug}.mp4`
// Green-screen loop, chroma-keyed in the plane shader (transparent flow hero
// with true fabric motion). Generated from the cutout on flat #00B140.
export const keyedVideoSrc = (slug) => `/outfits-video/${slug}-keyed.mp4`

// One hero per chapter, replacing v1's scatter. x echoes the camera
// S-curve side (camera weaves to ∓1.4; hero sits at ∓0.9 on the same side).
export function heroPlacement(chapterIndex, lateralScale = 1) {
  const chapter = CHAPTERS[chapterIndex]
  const side = chapterIndex % 2 === 0 ? -1 : 1
  // 5-unit standoff from the camera knot (c.z + 4): any closer and the
  // plane overflows the frustum height at the chapter midpoint. Portrait
  // additionally shrinks the plane for its ~3×-narrower frustum.
  const portrait = lateralScale < 1
  return {
    file: chapter.hero,
    x: side * 0.9 * lateralScale,
    y: 0,
    z: chapter.z - 1,
    rotY: side * -0.06,
    rotZ: 0,
    scale: portrait ? 1.15 : 1.9,
    drift: { speed: 0.35, phase: chapterIndex * 1.7, amp: 0.07 },
  }
}
