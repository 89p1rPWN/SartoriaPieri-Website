import React from "react";
import { interpolate } from "remotion";

interface Props {
  progress: number;
  frame: number;
  ignition: { x: number; y: number };
  cardBbox: { left: number; top: number; right: number; bottom: number };
  size: number;
}

const EMBER_COUNT = 64;

function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

interface Ember {
  seed: number;
  birthFrame: number;
  lifeFrames: number;
  ox: number;
  oy: number;
  drift: number;
  size: number;
  hue: number;
}

const embers: Ember[] = Array.from({ length: EMBER_COUNT }, (_, i) => {
  const seed = i + 1;
  return {
    seed,
    birthFrame: Math.floor(hash(seed * 3.1) * 130) + 10,
    lifeFrames: 35 + Math.floor(hash(seed * 7.7) * 35),
    ox: (hash(seed * 5.3) - 0.5) * 0.5,
    oy: (hash(seed * 9.1) - 0.5) * 0.3,
    drift: (hash(seed * 11.7) - 0.5) * 0.18,
    size: 2 + hash(seed * 13.3) * 6,
    hue: 18 + hash(seed * 17.9) * 22,
  };
});

export const Embers: React.FC<Props> = ({ progress, frame, ignition, cardBbox, size }) => {
  const cardW = (cardBbox.right - cardBbox.left) * size;
  const cardH = (cardBbox.bottom - cardBbox.top) * size;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        mixBlendMode: "screen",
      }}
    >
      {embers.map((e) => {
        const age = frame - e.birthFrame;
        if (age < 0 || age > e.lifeFrames) return null;
        if (progress < 0.05) return null;

        const life = age / e.lifeFrames;
        const rise = life * (180 + hash(e.seed * 19.1) * 220);

        const baseX = ignition.x + e.ox * (0.2 + progress * 0.7);
        const baseY = ignition.y + e.oy * (0.2 + progress * 0.5);

        const px = baseX * size + e.drift * rise + Math.sin(life * 6 + e.seed) * 12;
        const py = baseY * size - rise;

        const opacity = (1 - life) * (0.6 + hash(e.seed * 23.7) * 0.4);
        const flicker = 0.7 + Math.sin(frame * 0.6 + e.seed) * 0.3;

        const sz = e.size * (1 - life * 0.4);
        const color = `hsl(${e.hue}, 95%, ${65 - life * 30}%)`;

        return (
          <div
            key={e.seed}
            style={{
              position: "absolute",
              left: px - sz / 2,
              top: py - sz / 2,
              width: sz,
              height: sz,
              borderRadius: "50%",
              background: color,
              opacity: opacity * flicker,
              boxShadow: `0 0 ${sz * 4}px ${sz * 0.8}px ${color}`,
              filter: "blur(0.3px)",
            }}
          />
        );
      })}
    </div>
  );
};
