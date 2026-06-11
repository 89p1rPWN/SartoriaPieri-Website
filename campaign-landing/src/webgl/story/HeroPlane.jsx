import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { FogPlaneMaterial } from './fogPlaneMaterial.js'

const PLANE_W = 1.76
const PLANE_H = 2.2

// Stable reference: drei re-runs its onLoad layout-effect when this changes.
const toSRGB = (t) => {
  t.colorSpace = THREE.SRGBColorSpace
}

// One sin's hero: the transparent-background cutout floating over the smoke.
// The approved video loop plays in the dossier instead (its baked studio
// background can't be made transparent). The page only renders the canvas
// path when motion is allowed, so no prefers-reduced-motion check here.
export default function HeroPlane({ placement, url, onClick }) {
  const mesh = useRef()
  const mat = useRef()
  const [hovered, setHovered] = useState(false)
  const texture = useTexture(url, toSRGB)

  // Reset cursor if we unmount mid-hover (chapter zones unmount on scroll).
  useEffect(() => () => {
    document.body.style.cursor = ''
  }, [])

  useFrame((state) => {
    if (!mesh.current || !mat.current) return
    const { drift, y, scale } = placement
    const t = state.clock.elapsedTime
    // Slow vertical drift around the placement's base y.
    mesh.current.position.y = y + Math.sin(t * drift.speed + drift.phase) * drift.amp
    // Hover: ease toward color + slight scale-up.
    const targetBleach = hovered ? 0 : 1
    mat.current.uBleach = THREE.MathUtils.lerp(mat.current.uBleach, targetBleach, 0.08)
    const targetScale = scale * (hovered ? 1.04 : 1)
    mesh.current.scale.x = THREE.MathUtils.lerp(mesh.current.scale.x, targetScale, 0.1)
    mesh.current.scale.y = mesh.current.scale.x
    // Fade out as the camera passes (camera moves toward -z; d shrinks).
    // Tight window (0.4..1.6): the cutout grows to a giant pass-by moment —
    // the scroll "zoom" — and only dissolves right at the chapter's end.
    const d = state.camera.position.z - placement.z
    mat.current.uOpacity = THREE.MathUtils.smoothstep(d, 0.3, 1.1)
    mat.current.uTime = t
  })

  return (
    <mesh
      ref={mesh}
      position={[placement.x, placement.y, placement.z]}
      rotation={[0, placement.rotY, placement.rotZ]}
      scale={placement.scale}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = ''
      }}
    >
      <planeGeometry args={[PLANE_W, PLANE_H]} />
      <fogPlaneMaterial
        ref={mat}
        key={FogPlaneMaterial.key}
        map={texture}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
