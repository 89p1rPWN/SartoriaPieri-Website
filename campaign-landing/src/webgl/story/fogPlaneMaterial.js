import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

// Textured plane material for the story:
// - uBleach 1 = washed look (desaturated, lifted blacks, grain); 0 = full
//   color (hover state)
// - manual fog toward uFogColor by view depth (scene has no THREE.Fog;
//   the canvas is transparent over the SmokeBackground canvas)
// - uOpacity for near-camera fade as the camera passes a plane
// - texture alpha respected (hero cutout PNGs float over the smoke)
export const FogPlaneMaterial = shaderMaterial(
  {
    map: null,
    uBleach: 1,
    uOpacity: 1,
    uTime: 0,
    uFogColor: new THREE.Color('#141414'), // smoke shader's dark floor (clamp .08)
    uFogNear: 6,
    uFogFar: 26,
    uWave: 1, // cloth ripple strength; 0 disables
  },
  /* glsl */ `
    uniform float uTime;
    uniform float uWave;
    varying vec2 vUv;
    varying float vFogDepth;
    void main() {
      vUv = uv;
      vec3 p = position;
      // Cloth-in-a-draft ripple: the hem (uv.y = 0) moves most, shoulders
      // stay pinned, so the cutout figure reads as alive, not warping.
      float hem = 1.0 - uv.y;
      p.x += sin(uv.y * 5.0 + uTime * 1.1) * 0.035 * hem * uWave;
      p.z += sin(uv.y * 3.5 - uTime * 0.8 + uv.x * 3.0) * 0.06 * hem * uWave;
      vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
      vFogDepth = -mvPosition.z;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  /* glsl */ `
    uniform sampler2D map;
    uniform float uBleach;
    uniform float uOpacity;
    uniform float uTime;
    uniform vec3 uFogColor;
    uniform float uFogNear;
    uniform float uFogFar;
    varying vec2 vUv;
    varying float vFogDepth;

    // mediump-safe hash (Hoskins) — sin-based hashes band on mobile GPUs
    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      vec4 tex = texture2D(map, vUv);
      float g = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
      vec3 col = mix(tex.rgb, vec3(g), uBleach * 0.55); // desaturate
      col = mix(col, vec3(1.0), uBleach * 0.16);        // lift blacks
      float grain = (hash(vUv * 700.0 + fract(uTime) * 13.0) - 0.5) * 0.06;
      col += grain * uBleach;
      float fogF = smoothstep(uFogNear, uFogFar, vFogDepth);
      col = mix(col, uFogColor, fogF);
      // tex.a: cutout transparency. 0.85 (not 1.0): keep a 15% floor so far
      // planes hand off softly to the smoke; uFogColor stays in its family.
      float alpha = tex.a * uOpacity * (1.0 - fogF * 0.85);
      gl_FragColor = vec4(col, alpha);
    }
  `,
)

extend({ FogPlaneMaterial })
