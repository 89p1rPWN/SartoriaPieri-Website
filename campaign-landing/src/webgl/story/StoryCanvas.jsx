import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { CHAPTERS, ZONE_SPACING } from './photoManifest.js'
import ChapterZone from './ChapterZone.jsx'
import AbyssMotes from './AbyssMotes.jsx'
import { CHAPTER_COUNT } from './useStoryScroll.js'

// Camera path: gentle lateral S-curve weaving past the zones, ending a
// little beyond the last one.
function useCameraCurve() {
  return useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 6),
        ...CHAPTERS.map(
          (c, i) => new THREE.Vector3(i % 2 === 0 ? -1.4 : 1.4, 0, c.z + 4),
        ),
        new THREE.Vector3(0, 0, CHAPTERS[CHAPTER_COUNT - 1].z - ZONE_SPACING * 0.6),
      ]),
    [],
  )
}

function CameraRig({ progressRef }) {
  const { camera, pointer } = useThree()
  const curve = useCameraCurve()
  const lookTarget = useRef(new THREE.Vector3(0, 0, 0))

  useFrame(() => {
    const p = THREE.MathUtils.clamp(progressRef.current.progress, 0, 1)
    const pos = curve.getPoint(p)
    const ahead = curve.getPoint(Math.min(p + 0.03, 1))
    // Pointer parallax: small lateral/vertical offset + implicit tilt via lookAt.
    pos.x += pointer.x * 0.3
    pos.y += pointer.y * -0.2
    camera.position.lerp(pos, 0.12)
    lookTarget.current.lerp(ahead, 0.12)
    camera.lookAt(lookTarget.current)
  })
  return null
}

// activeChapter: -1 intro .. CHAPTER_COUNT outro (state from the page, so
// React mounts/unmounts zones; per-frame motion stays in refs).
export default function StoryCanvas({ progressRef, active, lateralScale, onHeroClick }) {
  const mounted = CHAPTERS.filter((c) => {
    const clamped = Math.min(CHAPTER_COUNT - 1, Math.max(0, active))
    return Math.abs(c.index - clamped) <= 1
  })

  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      camera={{ fov: 50, near: 0.1, far: 60, position: [0, 0, 6] }}
      style={{ position: 'fixed', inset: 0 }}
    >
      <CameraRig progressRef={progressRef} />
      <AbyssMotes />
      {mounted.map((c) => (
        <ChapterZone
          key={c.slug}
          chapterIndex={c.index}
          lateralScale={lateralScale}
          onHeroClick={onHeroClick}
        />
      ))}
    </Canvas>
  )
}
