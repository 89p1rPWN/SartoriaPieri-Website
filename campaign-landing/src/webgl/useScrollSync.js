import { useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Bridges DOM scroll progress (from ScrollTrigger) into R3F's render loop
 * with smooth damping/lerp for luxurious motion feel.
 */
export default function useScrollSync(rawProgressRef, damping = 0.07) {
  const smoothRef = useRef(0);

  useFrame(() => {
    const target = rawProgressRef.current;
    smoothRef.current += (target - smoothRef.current) * damping;
    // Clamp to avoid floating point drift
    if (Math.abs(smoothRef.current - target) < 0.0001) {
      smoothRef.current = target;
    }
  });

  return smoothRef;
}
