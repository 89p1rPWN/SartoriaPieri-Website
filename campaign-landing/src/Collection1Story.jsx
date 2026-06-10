import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import StoryCanvas from './webgl/story/StoryCanvas.jsx'
import StoryFallback from './StoryFallback.jsx'
import { CHAPTERS, fullSrc } from './webgl/story/photoManifest.js'
import { useStoryScroll, activeChapter, CHAPTER_COUNT } from './webgl/story/useStoryScroll.js'
import './Collection1Story.css'

gsap.registerPlugin(ScrollTrigger)

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export default function Collection1Story() {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const webgl = typeof window !== 'undefined' && supportsWebGL()

  const progressRef = useStoryScroll()
  const scrollRef = useRef(null)
  const lenisRef = useRef(null)
  const [active, setActive] = useState(-1)
  const [lightbox, setLightbox] = useState(null) // {chapterIndex, photoIndex} | null
  const [lateralScale] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(orientation: portrait)').matches
      ? 0.55
      : 1,
  )

  const useCanvas = webgl && !reduced

  useEffect(() => {
    if (!useCanvas) return undefined
    const lenis = new Lenis({ syncTouch: true })
    lenisRef.current = lenis
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    const st = ScrollTrigger.create({
      trigger: scrollRef.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        progressRef.current.progress = self.progress
        // Future audio (out of scope v1) subscribes to this, per spec.
        window.dispatchEvent(new CustomEvent('story:progress', { detail: self.progress }))
        setActive((prev) => {
          const next = activeChapter(self.progress)
          return next === prev ? prev : next
        })
      },
    })

    return () => {
      st.kill()
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [useCanvas, progressRef])

  // Lightbox: lock scroll while open, Esc to close.
  useEffect(() => {
    if (!lightbox) return undefined
    lenisRef.current?.stop()
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight') stepLightbox(1)
      if (e.key === 'ArrowLeft') stepLightbox(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      lenisRef.current?.start()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox])

  const openLightbox = useCallback(
    (chapterIndex, photoIndex) => setLightbox({ chapterIndex, photoIndex }),
    [],
  )
  const stepLightbox = (dir) =>
    setLightbox((lb) => {
      if (!lb) return lb
      const photos = CHAPTERS[lb.chapterIndex].photos
      const next = (lb.photoIndex + dir + photos.length) % photos.length
      return { ...lb, photoIndex: next }
    })

  if (!useCanvas) {
    return (
      <div className="story-page">
        <StoryFallback onPhotoClick={openLightbox} />
        {lightbox && (
          <Lightbox lightbox={lightbox} onStep={stepLightbox} onClose={() => setLightbox(null)} />
        )}
      </div>
    )
  }

  return (
    <div className="story-page">
      <StoryCanvas
        progressRef={progressRef}
        active={active}
        lateralScale={lateralScale}
        onPhotoClick={openLightbox}
      />
      <div className="story-grain" aria-hidden="true" />

      {/* DOM overlays */}
      <div className={`story-card story-intro ${active === -1 ? 'visible' : ''}`}>
        <h1>SARTORIA PIERI</h1>
        <p className="story-sub">I CINQUE PECCATI</p>
        <p className="story-hint">scroll</p>
      </div>
      {CHAPTERS.map((c) => (
        <div key={c.slug} className={`story-title ${active === c.index ? 'visible' : ''}`}>
          <span className="story-numeral">{c.numeral}</span>
          <h2>{c.slug.toUpperCase()}</h2>
        </div>
      ))}
      <div className={`story-card story-outro ${active === CHAPTER_COUNT ? 'visible' : ''}`}>
        <p className="story-sub">FINE</p>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/contact">Contact</Link>
        </nav>
      </div>

      {/* Scroll spacer that drives everything */}
      <div ref={scrollRef} className="story-scroll" />

      {lightbox && (
        <Lightbox lightbox={lightbox} onStep={stepLightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  )
}

function Lightbox({ lightbox, onStep, onClose }) {
  const chapter = CHAPTERS[lightbox.chapterIndex]
  const file = chapter.photos[lightbox.photoIndex]
  return (
    <div className="story-lightbox" onClick={onClose} role="dialog" aria-modal="true">
      <figure onClick={(e) => e.stopPropagation()}>
        <img src={fullSrc(chapter.slug, file)} alt={`${chapter.slug} look ${lightbox.photoIndex + 1}`} />
        <figcaption>
          {chapter.slug.toUpperCase()} — {lightbox.photoIndex + 1}/{chapter.photos.length}
        </figcaption>
        <button className="lb-prev" aria-label="Previous" onClick={() => onStep(-1)}>←</button>
        <button className="lb-next" aria-label="Next" onClick={() => onStep(1)}>→</button>
        <button className="lb-close" aria-label="Close" onClick={onClose}>×</button>
      </figure>
    </div>
  )
}
