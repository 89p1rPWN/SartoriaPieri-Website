import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import StoryCanvas from './webgl/story/StoryCanvas.jsx'
import StoryFallback from './StoryFallback.jsx'
import StoryDossier from './StoryDossier.jsx'
import SmokeBackground from './SmokeBackground.jsx'
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
  // Abisso descent: smoke streams upward + darkens as you sink (read per
  // frame by SmokeBackground), vignette closes in via direct style writes.
  const abyssRef = useRef({ scroll: 0, dim: 1 })
  const vignetteRef = useRef(null)
  const [active, setActive] = useState(-1)
  const [lightbox, setLightbox] = useState(null) // {chapterIndex, photoIndex} | null
  const [dossier, setDossier] = useState(null) // chapterIndex | null
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
        abyssRef.current.scroll = self.progress * 3
        abyssRef.current.dim = 1 - self.progress * 0.55
        if (vignetteRef.current) {
          vignetteRef.current.style.opacity = 0.25 + self.progress * 0.6
        }
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
      lenisRef.current = null
    }
  }, [useCanvas, progressRef])

  const openLightbox = useCallback(
    (chapterIndex, photoIndex) => setLightbox({ chapterIndex, photoIndex }),
    [],
  )
  const openDossier = useCallback((chapterIndex) => setDossier(chapterIndex), [])
  const stepLightbox = useCallback((dir) =>
    setLightbox((lb) => {
      if (!lb) return lb
      const photos = CHAPTERS[lb.chapterIndex].photos
      const next = (lb.photoIndex + dir + photos.length) % photos.length
      return { ...lb, photoIndex: next }
    }), [])

  // Scroll lock while any overlay (dossier or lightbox) is open.
  const locked = dossier != null || lightbox != null
  useEffect(() => {
    if (!locked) return undefined
    lenisRef.current?.stop()
    return () => lenisRef.current?.start()
  }, [locked])

  // Esc cascade: lightbox closes first, then the dossier under it.
  useEffect(() => {
    if (dossier == null && !lightbox) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (lightbox) setLightbox(null)
        else setDossier(null)
      }
      if (lightbox) {
        if (e.key === 'ArrowRight') stepLightbox(1)
        if (e.key === 'ArrowLeft') stepLightbox(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dossier, lightbox, stepLightbox])

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
      <SmokeBackground className="story-smoke" smokeColor="#6e6a63" depthRef={abyssRef} />
      <StoryCanvas
        progressRef={progressRef}
        active={active}
        lateralScale={lateralScale}
        onHeroClick={openDossier}
      />
      <div ref={vignetteRef} className="story-vignette" aria-hidden="true" />
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

      {dossier != null && (
        <StoryDossier
          chapterIndex={dossier}
          onPhotoClick={openLightbox}
          onClose={() => setDossier(null)}
        />
      )}
      {lightbox && (
        <Lightbox lightbox={lightbox} onStep={stepLightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  )
}

function Lightbox({ lightbox, onStep, onClose }) {
  const chapter = CHAPTERS[lightbox.chapterIndex]
  const file = chapter.photos[lightbox.photoIndex]
  const closeRef = useRef(null)
  useEffect(() => {
    closeRef.current?.focus()
  }, [])
  return (
    <div
      className="story-lightbox"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${chapter.slug} photo ${lightbox.photoIndex + 1} of ${chapter.photos.length}`}
    >
      <figure onClick={(e) => e.stopPropagation()}>
        <img src={fullSrc(chapter.slug, file)} alt={`${chapter.slug} look ${lightbox.photoIndex + 1}`} />
        <figcaption>
          {chapter.slug.toUpperCase()} — {lightbox.photoIndex + 1}/{chapter.photos.length}
        </figcaption>
        <button className="lb-prev" aria-label="Previous" onClick={() => onStep(-1)}>←</button>
        <button className="lb-next" aria-label="Next" onClick={() => onStep(1)}>→</button>
        <button ref={closeRef} className="lb-close" aria-label="Close" onClick={onClose}>×</button>
      </figure>
    </div>
  )
}
