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
