import React, { Suspense } from 'react'
import { CHAPTERS, heroPlacement, webSrc, videoSrc } from './photoManifest.js'
import HeroPlane from './HeroPlane.jsx'

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
