import React, { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { revealAt } from './reveal.js'

// Fake god-ray: an open additive cone from the chasm mouth above, with a
// vertical gradient texture. Switches on as the camera approaches the
// chapter (same distance logic as the hero's reveal) and dies as it passes.
const beamTexture = (() => {
  const c = document.createElement('canvas')
  c.width = 1
  c.height = 256
  const ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0, 'rgba(235, 230, 220, 0.65)')
  g.addColorStop(0.55, 'rgba(235, 230, 220, 0.18)')
  g.addColorStop(1, 'rgba(235, 230, 220, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 1, 256)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = THREE.ClampToEdgeWrapping
  return t
})()

export default function LightShaft({ x, z }) {
  const mat = useRef()
  useFrame((state) => {
    if (!mat.current) return
    const reveal = revealAt(state.camera.position.z, z)
    // Slow breathing flicker, like light through drifting mist far above.
    const flicker = 0.85 + 0.15 * Math.sin(state.clock.elapsedTime * 1.7 + x)
    mat.current.opacity = reveal * 0.5 * flicker
  })
  return (
    <mesh position={[x, 4.6, z - 0.6]}>
      <cylinderGeometry args={[0.45, 2.4, 7.5, 32, 1, true]} />
      <meshBasicMaterial
        ref={mat}
        map={beamTexture}
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
