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

  it('transitions between chapters at exact segment boundaries', () => {
    for (let i = 1; i < CHAPTER_COUNT; i++) {
      expect(activeChapter(INTRO_FRACTION + SEGMENT * i)).toBe(i)
    }
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
