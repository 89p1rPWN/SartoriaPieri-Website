import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createDistortionMaterial } from './distortionMaterial';

export default function ImagePlane({ texture, position, spacing, scrollProgressRef, index, totalCount }) {
  const meshRef = useRef();
  const materialRef = useRef();

  // Plane dimensions — 3:4 aspect, sized to fill viewport at zoom 120
  const width = 4.5;
  const height = 6;

  const material = useMemo(() => {
    if (!texture) return null;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    const mat = createDistortionMaterial(texture);
    materialRef.current = mat;
    return mat;
  }, [texture]);

  useFrame((state) => {
    if (!materialRef.current) return;

    const progress = scrollProgressRef.current;
    // Where the "viewport center" is in world Y based on scroll
    const viewCenterY = -progress * (totalCount - 1) * spacing;
    const planeY = position[1];
    const distance = Math.abs(planeY - viewCenterY);
    const proximity = 1.0 - Math.min(distance / (spacing * 1.2), 1.0);
    const smoothProximity = proximity * proximity * (3 - 2 * proximity); // smoothstep

    materialRef.current.uniforms.uProgress.value = smoothProximity;
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;

    // Slight Z offset based on proximity — closer images come forward
    if (meshRef.current) {
      meshRef.current.position.z = smoothProximity * 0.3;
      // Subtle scale pulse when centered
      const scale = 1.0 + smoothProximity * 0.04;
      meshRef.current.scale.set(scale, scale, 1);
    }
  });

  if (!material) return null;

  return (
    <mesh ref={meshRef} position={position} material={material}>
      <planeGeometry args={[width, height, 32, 32]} />
    </mesh>
  );
}
