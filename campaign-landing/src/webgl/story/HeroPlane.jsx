import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { FogPlaneMaterial } from './fogPlaneMaterial.js'
import { revealAt } from './reveal.js'

const PLANE_W = 1.76
const PLANE_H = 2.2

// Stable reference: drei re-runs its onLoad layout-effect when this changes.
const toSRGB = (t) => {
  t.colorSpace = THREE.SRGBColorSpace
}

// One sin's hero: the transparent-background cutout floating over the smoke.
// If keyedVideoUrl is set, a green-screen loop replaces the still and the
// shader chroma-keys it live (true fabric motion, transparent). The page
// only renders the canvas path when motion is allowed, so no
// prefers-reduced-motion check here.
export default function HeroPlane({ placement, url, keyedVideoUrl, onClick }) {
  const mesh = useRef()
  const mat = useRef()
  const [hovered, setHovered] = useState(false)
  const [videoEl, setVideoEl] = useState(null)
  const texture = useTexture(url, toSRGB)

  useEffect(() => {
    if (!keyedVideoUrl) return undefined
    let cancelled = false
    const el = document.createElement('video')
    el.src = keyedVideoUrl
    el.muted = true
    el.loop = true
    el.playsInline = true
    el.preload = 'auto'
    const onCanPlay = () => {
      el.play()
        // cancelled guard: play() can resolve after cleanup tore el down
        .then(() => !cancelled && setVideoEl(el))
        .catch(() => {}) // autoplay denied → keep the still
    }
    const onError = () => {
      if (import.meta.env.DEV) console.warn('Hero keyed video failed:', keyedVideoUrl)
      setVideoEl(null)
    }
    el.addEventListener('canplaythrough', onCanPlay, { once: true })
    el.addEventListener('error', onError)
    el.load()
    return () => {
      cancelled = true
      el.removeEventListener('canplaythrough', onCanPlay)
      el.removeEventListener('error', onError)
      el.pause()
      el.removeAttribute('src')
      el.load()
      setVideoEl(null)
    }
  }, [keyedVideoUrl])

  const videoTexture = useMemo(() => {
    if (!videoEl) return null
    const t = new THREE.VideoTexture(videoEl)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [videoEl])

  useEffect(() => () => videoTexture?.dispose(), [videoTexture])

  // Reset cursor if we unmount mid-hover (chapter zones unmount on scroll).
  useEffect(() => () => {
    document.body.style.cursor = ''
  }, [])

  useFrame((state) => {
    if (!mesh.current || !mat.current) return
    const { drift, y, scale } = placement
    const t = state.clock.elapsedTime
    // Slow vertical drift + gentle sway around the placement's base pose.
    mesh.current.position.y = y + Math.sin(t * drift.speed + drift.phase) * drift.amp
    mesh.current.rotation.z = placement.rotZ + Math.sin(t * 0.3 + drift.phase) * 0.02
    // Hover: ease toward color + slight scale-up.
    const targetBleach = hovered ? 0 : 1
    mat.current.uBleach = THREE.MathUtils.lerp(mat.current.uBleach, targetBleach, 0.08)
    const targetScale = scale * (hovered ? 1.04 : 1)
    mesh.current.scale.x = THREE.MathUtils.lerp(mesh.current.scale.x, targetScale, 0.1)
    mesh.current.scale.y = mesh.current.scale.x
    // Rivelazione: hidden in the dark until the light shaft finds it on
    // approach, then the giant pass-by dissolve at the chapter's end
    // (revealAt = approach reveal × pass-fade, shared with LightShaft).
    mat.current.uOpacity = revealAt(state.camera.position.z, placement.z)
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
      {/* segments: the cloth ripple displaces vertices in the shader */}
      <planeGeometry args={[PLANE_W, PLANE_H, 24, 32]} />
      <fogPlaneMaterial
        ref={mat}
        key={FogPlaneMaterial.key}
        map={videoTexture ?? texture}
        uKeyEnabled={videoTexture ? 1 : 0}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
