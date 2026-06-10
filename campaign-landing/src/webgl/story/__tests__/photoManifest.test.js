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

  it('returns one placement per photo, hero is the largest', () => {
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
