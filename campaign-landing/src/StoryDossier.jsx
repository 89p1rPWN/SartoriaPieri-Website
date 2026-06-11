import React, { useEffect, useRef } from 'react'
import { CHAPTERS, webSrc, videoSrc } from './webgl/story/photoManifest.js'

// Editorial detail view for one sin: hero large on the left, panel with the
// look's other photos + garment data on the right. Sits below the lightbox
// (z 8 < 10) so full-res photo zoom stacks on top.
export default function StoryDossier({ chapterIndex, onPhotoClick, onClose }) {
  const chapter = CHAPTERS[chapterIndex]
  const closeRef = useRef(null)
  useEffect(() => {
    closeRef.current?.focus()
  }, [])
  const details = chapter.photos.filter((f) => f !== chapter.hero)

  return (
    <div
      className="story-dossier"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${chapter.slug} dossier`}
    >
      <figure className="dossier-hero" onClick={(e) => e.stopPropagation()}>
        {chapter.video ? (
          <video
            src={videoSrc(chapter.slug)}
            poster={webSrc(chapter.slug, chapter.hero)}
            autoPlay
            muted
            loop
            playsInline
            aria-label={`${chapter.slug} look, living portrait`}
          />
        ) : (
          <img src={webSrc(chapter.slug, chapter.hero)} alt={`${chapter.slug} look`} />
        )}
      </figure>
      <aside className="dossier-panel" onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} className="dossier-close" aria-label="Close" onClick={onClose}>×</button>
        <header>
          <span className="dossier-numeral">{chapter.numeral}</span>
          <h2>{chapter.slug.toUpperCase()}</h2>
        </header>
        <div className="dossier-grid">
          {details.map((file) => (
            <button
              key={file}
              type="button"
              onClick={() => onPhotoClick(chapterIndex, chapter.photos.indexOf(file))}
              aria-label={`Open ${chapter.slug} detail photo`}
            >
              <img src={webSrc(chapter.slug, file)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
        <dl className="dossier-data">
          {chapter.data.map(({ label, value }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value || '—'}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  )
}
