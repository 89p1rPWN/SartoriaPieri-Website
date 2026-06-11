import React, { useEffect, useRef } from 'react'

// The descent backdrop: generated abyss loops crossfaded by scroll progress
// so the whole journey stays inside the chasm. Layer opacities, a slow
// depth zoom and darkening are driven per frame from progressRef (written
// by ScrollTrigger) — no React re-renders.
const LAYERS = [
  // mid-descent walls: visible from the start (the intro plunge plate
  // dissolves into it), hands off to the deep layer near the bottom
  { src: '/outfits-video/abisso-mid.mp4', from: 0, full: 0, hold: 0.6, to: 0.82 },
  // the deep: fades in for the last chapters and the outro
  { src: '/outfits-video/abisso-deep.mp4', from: 0.6, full: 0.82, hold: 1, to: 1.01 },
]

const layerOpacity = (p, L) => {
  if (p < L.from) return 0
  if (p < L.full) return (p - L.from) / (L.full - L.from)
  if (p < L.hold) return 1
  return Math.max(0, 1 - (p - L.hold) / (L.to - L.hold))
}

export default function AbyssBackdrop({ progressRef }) {
  const rootRef = useRef(null)

  useEffect(() => {
    let raf
    const tick = () => {
      const root = rootRef.current
      if (root) {
        const p = progressRef.current.progress
        root.style.filter = `brightness(${1 - p * 0.45})`
        root.querySelectorAll('video').forEach((video, i) => {
          const o = layerOpacity(p, LAYERS[i])
          video.style.opacity = o
          video.style.transform = `scale(${1.05 + p * 0.25})`
          // Don't decode layers that aren't visible.
          if (o === 0 && !video.paused) video.pause()
          else if (o > 0 && video.paused) video.play().catch(() => {})
        })
      }
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [progressRef])

  return (
    <div ref={rootRef} className="story-abyss" aria-hidden="true">
      {LAYERS.map((L) => (
        <video key={L.src} src={L.src} muted loop playsInline preload="auto" />
      ))}
    </div>
  )
}
