import React from 'react'
import { CHAPTERS, webSrc } from './webgl/story/photoManifest.js'

export default function StoryFallback({ onPhotoClick }) {
  return (
    <div className="story-fallback">
      {CHAPTERS.map((c) => (
        <section key={c.slug}>
          <h2>{c.numeral} — {c.slug.toUpperCase()}</h2>
          <div className="fb-grid">
            {c.photos.map((file, photoIndex) => (
              <button
                key={file}
                type="button"
                className="fb-photo"
                onClick={() => onPhotoClick(c.index, photoIndex)}
                aria-label={`Open ${c.slug} look ${photoIndex + 1}`}
              >
                <img src={webSrc(c.slug, file)} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
