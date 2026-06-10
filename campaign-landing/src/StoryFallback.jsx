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
              <img
                key={file}
                src={webSrc(c.slug, file)}
                alt={`${c.slug} look ${photoIndex + 1}`}
                loading="lazy"
                onClick={() => onPhotoClick(c.index, photoIndex)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
