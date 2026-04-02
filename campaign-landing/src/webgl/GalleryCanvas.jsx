import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  uniform float uScale;
  uniform float uDepth;

  void main() {
    vUv = uv;
    vec3 pos = position;
    pos.z += uDepth;
    pos.xy *= uScale;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uOpacity;
  uniform float uTransition;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;

    // Subtle warp during transition
    vec2 center = uv - 0.5;
    float dist = length(center);
    uv += center * dist * 0.04 * (1.0 - uTransition);

    vec4 color = texture2D(uTexture, uv);

    // Slight desaturation when transitioning
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    color.rgb = mix(vec3(gray), color.rgb, 0.5 + 0.5 * uTransition);

    color.a = uOpacity;
    gl_FragColor = color;
  }
`;

function makeMaterial(texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: texture },
      uOpacity: { value: 1.0 },
      uScale: { value: 1.0 },
      uDepth: { value: 0.0 },
      uTransition: { value: 1.0 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthTest: false,
  });
}

function PortalPlanes({ images, progressRef }) {
  const { viewport } = useThree();
  const paths = useMemo(() => images.map(img => img.src), [images]);
  const textures = useTexture(paths);

  const smoothProgress = useRef(0);
  const currentMatRef = useRef(null);
  const nextMatRef = useRef(null);

  // Plane size — tall portrait centered
  const planeH = viewport.height * 0.75;
  const planeW = planeH * (3 / 4);

  const currentMat = useMemo(() => {
    const m = makeMaterial(textures[0]);
    currentMatRef.current = m;
    return m;
  }, [textures]);

  const nextMat = useMemo(() => {
    const m = makeMaterial(textures[0]);
    m.uniforms.uOpacity.value = 0;
    nextMatRef.current = m;
    return m;
  }, [textures]);

  useFrame(() => {
    // Lerp for smoothness
    smoothProgress.current += (progressRef.current - smoothProgress.current) * 0.08;

    const total = images.length;
    const continuous = smoothProgress.current * (total - 1);
    const idx = Math.min(Math.floor(continuous), total - 2);
    const t = continuous - idx; // 0..1 between images
    const nextIdx = idx + 1;

    const cMat = currentMatRef.current;
    const nMat = nextMatRef.current;
    if (!cMat || !nMat) return;

    // Update textures
    if (cMat.uniforms.uTexture.value !== textures[idx]) {
      cMat.uniforms.uTexture.value = textures[idx];
    }
    if (nMat.uniforms.uTexture.value !== textures[nextIdx]) {
      nMat.uniforms.uTexture.value = textures[nextIdx];
    }

    // Smoothstep ease
    const ease = t * t * (3 - 2 * t);

    // Current: recedes, shrinks, fades
    cMat.uniforms.uOpacity.value = 1.0 - ease * 0.7;
    cMat.uniforms.uScale.value = 1.0 - ease * 0.12;
    cMat.uniforms.uDepth.value = -ease * 1.5;
    cMat.uniforms.uTransition.value = 1.0 - ease;

    // Next: emerges from portal — small and deep → full size
    nMat.uniforms.uOpacity.value = ease;
    nMat.uniforms.uScale.value = 0.2 + ease * 0.8;
    nMat.uniforms.uDepth.value = 2.0 - ease * 2.0;
    nMat.uniforms.uTransition.value = ease;
  });

  return (
    <>
      <mesh material={currentMat} renderOrder={0}>
        <planeGeometry args={[planeW, planeH, 1, 1]} />
      </mesh>
      <mesh material={nextMat} renderOrder={1}>
        <planeGeometry args={[planeW, planeH, 1, 1]} />
      </mesh>
    </>
  );
}

export default function GalleryCanvas({ images, progressRef }) {
  return (
    <Canvas
      orthographic
      camera={{ zoom: 100, position: [0, 0, 10], near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <PortalPlanes images={images} progressRef={progressRef} />
      </Suspense>
    </Canvas>
  );
}
