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
