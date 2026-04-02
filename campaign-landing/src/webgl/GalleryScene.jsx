import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture, Preload } from '@react-three/drei';
import * as THREE from 'three';
import useScrollSync from './useScrollSync';

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
  uniform float uProgress;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;

    // Subtle radial warp during transition
    vec2 center = uv - 0.5;
    float dist = length(center);
    float warp = 0.03 * (1.0 - uProgress);
    uv += center * dist * warp;

    vec4 color = texture2D(uTexture, uv);

    // Slight desaturation when transitioning out
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    color.rgb = mix(vec3(gray), color.rgb, 0.6 + 0.4 * uProgress);

    color.a *= uOpacity;
    gl_FragColor = color;
  }
`;

function createPortalMaterial(texture) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: texture },
      uOpacity: { value: 1.0 },
      uScale: { value: 1.0 },
      uDepth: { value: 0.0 },
      uProgress: { value: 1.0 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
  });
}

function PortalGallery({ images, rawProgressRef }) {
  const smoothRef = useScrollSync(rawProgressRef, 0.05);
  const paths = useMemo(() => images.map(img => img.src), [images]);
  const textures = useTexture(paths);

  const currentRef = useRef(null);
  const nextRef = useRef(null);
  const currentMatRef = useRef(null);
  const nextMatRef = useRef(null);
  const prevIdxRef = useRef(0);

  // Plane sizing
  const { viewport } = useThree();
  const aspect = 3 / 4;
  const planeH = viewport.height * 0.78;
  const planeW = planeH * aspect;

  // Create materials once
  const currentMat = useMemo(() => {
    const mat = createPortalMaterial(textures[0]);
    currentMatRef.current = mat;
    return mat;
  }, [textures]);

  const nextMat = useMemo(() => {
    const mat = createPortalMaterial(textures[0]);
    mat.uniforms.uOpacity.value = 0;
    nextMatRef.current = mat;
    return mat;
  }, [textures]);

  useFrame(() => {
    const progress = smoothRef.current;
    const total = images.length;
    const continuous = progress * (total - 1);
    const idx = Math.floor(continuous);
    const t = continuous - idx; // 0..1 fraction between images
    const nextIdx = Math.min(idx + 1, total - 1);

    const cMat = currentMatRef.current;
    const nMat = nextMatRef.current;
    if (!cMat || !nMat) return;

    // Update textures
    cMat.uniforms.uTexture.value = textures[idx];
    nMat.uniforms.uTexture.value = textures[nextIdx];

    // Current image: stays full, pushes back and fades as t increases
    cMat.uniforms.uOpacity.value = 1.0 - t * 0.6;
    cMat.uniforms.uScale.value = 1.0 - t * 0.08;
    cMat.uniforms.uDepth.value = -t * 2.0;
    cMat.uniforms.uProgress.value = 1.0 - t;

    // Next image: emerges from portal — starts tiny and deep, scales up
    // Use a smooth ease for the portal emergence
    const ease = t * t * (3 - 2 * t); // smoothstep
    nMat.uniforms.uOpacity.value = ease;
    nMat.uniforms.uScale.value = 0.3 + ease * 0.7;
    nMat.uniforms.uDepth.value = 3.0 - ease * 3.0;
    nMat.uniforms.uProgress.value = ease;
  });

  return (
    <>
      {/* Current image (behind) */}
      <mesh ref={currentRef} material={currentMat} renderOrder={1}>
        <planeGeometry args={[planeW, planeH, 1, 1]} />
      </mesh>
      {/* Next image (emerging in front) */}
      <mesh ref={nextRef} material={nextMat} renderOrder={2}>
        <planeGeometry args={[planeW, planeH, 1, 1]} />
      </mesh>
    </>
  );
}

export default function GalleryScene({ images, rawProgressRef }) {
  return (
    <Canvas
      orthographic
      camera={{ zoom: 100, position: [0, 0, 10], near: 0.1, far: 100 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      onCreated={({ gl }) => {
        gl.setClearColor('#d8d8d8', 1);
      }}
      dpr={[1, 2]}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1,
        pointerEvents: 'none',
      }}
    >
      <Suspense fallback={null}>
        <PortalGallery images={images} rawProgressRef={rawProgressRef} />
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
