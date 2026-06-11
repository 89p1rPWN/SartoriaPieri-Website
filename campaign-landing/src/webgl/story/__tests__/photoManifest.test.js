import { describe, it, expect } from 'vitest'
import { CHAPTERS, ZONE_SPACING, heroPlacement, videoSrc, webSrc, fullSrc } from '../photoManifest.js'

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

describe('heroPlacement', () => {
  it('is deterministic and one per chapter', () => {
    expect(heroPlacement(2)).toEqual(heroPlacement(2))
    expect(heroPlacement(1).file).toBe('dolore_main.jpg')
  })

  it('alternates sides matching the camera S-curve and stands off the camera knot', () => {
    expect(heroPlacement(0).x).toBeLessThan(0)
    expect(heroPlacement(1).x).toBeGreaterThan(0)
    // Camera knot sits at c.z + 4; hero at c.z - 1 gives a 5-unit standoff so
    // the full plane fits the frustum at the chapter midpoint.
    CHAPTERS.forEach((c) => expect(heroPlacement(c.index).z).toBe(c.z - 1))
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
