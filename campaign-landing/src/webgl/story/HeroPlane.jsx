import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { FogPlaneMaterial } from './fogPlaneMaterial.js'

const PLANE_W = 1.76
const PLANE_H = 2.2

const toSRGB = (t) => {
  t.colorSpace = THREE.SRGBColorSpace
}

// One sin's hero. Plays a subtle video loop when an approved clip exists
// (chapter.video), with the still photo as poster and fallback. The page
// only renders the canvas path when motion is allowed, so no
// prefers-reduced-motion check is needed here.
export default function HeroPlane({ placement, stillUrl, videoUrl, onClick }) {
  const mesh = useRef()
  const mat = useRef()
  const [hovered, setHovered] = useState(false)
  const [videoEl, setVideoEl] = useState(null)
  const stillTexture = useTexture(stillUrl, toSRGB)

  useEffect(() => {
    if (!videoUrl) return undefined
    const el = document.createElement('video')
    el.src = videoUrl
    el.muted = true
    el.loop = true
    el.playsInline = true
    el.preload = 'auto'
    const onCanPlay = () => {
      el.play()
        .then(() => setVideoEl(el))
        .catch(() => {}) // autoplay denied → keep the still
    }
    const onError = () => {
      if (import.meta.env.DEV) console.warn('Hero video failed:', videoUrl)
      setVideoEl(null)
    }
    el.addEventListener('canplaythrough', onCanPlay, { once: true })
    el.addEventListener('error', onError)
    el.load()
    return () => {
      el.removeEventListener('canplaythrough', onCanPlay)
      el.removeEventListener('error', onError)
      el.pause()
      el.removeAttribute('src')
      el.load()
      setVideoEl(null)
    }
  }, [videoUrl])

  const videoTexture = useMemo(() => {
    if (!videoEl) return null
    const t = new THREE.VideoTexture(videoEl)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [videoEl])

  useEffect(() => () => videoTexture?.dispose(), [videoTexture])

  useEffect(() => () => {
    document.body.style.cursor = ''
  }, [])

  useFrame((state) => {
    if (!mesh.current || !mat.current) return
    const { drift, y, scale } = placement
    const t = state.clock.elapsedTime
    mesh.current.position.y = y + Math.sin(t * drift.speed + drift.phase) * drift.amp
    const targetBleach = hovered ? 0 : 1
    mat.current.uBleach = THREE.MathUtils.lerp(mat.current.uBleach, targetBleach, 0.08)
    const targetScale = scale * (hovered ? 1.04 : 1)
    mesh.current.scale.x = THREE.MathUtils.lerp(mesh.current.scale.x, targetScale, 0.1)
    mesh.current.scale.y = mesh.current.scale.x
    const d = state.camera.position.z - placement.z
    mat.current.uOpacity = THREE.MathUtils.smoothstep(d, 0.5, 2.5)
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
        map={videoTexture ?? stillTexture}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
