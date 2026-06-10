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
