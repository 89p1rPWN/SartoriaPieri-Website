import * as THREE from 'three'

// Rivelazione curve, shared by LightShaft and HeroPlane so the light and
// the outfit appear as one event: 0 far away, 1 once the camera is near
// the chapter, then a pass-fade as the camera goes through.
export function revealAt(cameraZ, z) {
  const d = cameraZ - z
  const approach = 1 - THREE.MathUtils.smoothstep(d, 7, 13)
  const passFade = THREE.MathUtils.smoothstep(d, 0.3, 1.1)
  return approach * passFade
}
