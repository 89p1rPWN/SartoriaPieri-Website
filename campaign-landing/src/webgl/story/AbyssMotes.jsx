import React, { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

// Faint motes drifting upward through the whole camera path — relative to
// the descending viewer they read as ash rising past you while you sink
// into the abyss. ~220 points, negligible cost.
const COUNT = 220
const SPREAD_X = 10
const SPREAD_Y = 8
const Z_NEAR = 8
const Z_DEPTH = 92 // covers camera path z 6 .. -84

// Seeded scatter computed once at module load (render must stay pure).
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Soft radial sprite so motes render round, not as raw GL point squares.
const moteTexture = (() => {
  const c = document.createElement('canvas')
  c.width = 32
  c.height = 32
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 32, 32)
  return new THREE.CanvasTexture(c)
})()

const { positions, speeds } = (() => {
  const rand = mulberry32(20260611)
  const positions = new Float32Array(COUNT * 3)
  const speeds = new Float32Array(COUNT)
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (rand() - 0.5) * SPREAD_X
    positions[i * 3 + 1] = (rand() - 0.5) * SPREAD_Y
    positions[i * 3 + 2] = Z_NEAR - rand() * Z_DEPTH
    speeds[i] = 0.15 + rand() * 0.35
  }
  return { positions, speeds }
})()

export default function AbyssMotes() {
  const points = useRef()

  useFrame((state, delta) => {
    if (!points.current) return
    const pos = points.current.geometry.attributes.position
    for (let i = 0; i < COUNT; i++) {
      let y = pos.getY(i) + speeds[i] * delta
      if (y > SPREAD_Y / 2) y = -SPREAD_Y / 2
      pos.setY(i, y)
    }
    pos.needsUpdate = true
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#9a948a"
        map={moteTexture}
        transparent
        opacity={0.4}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}
