import React from "react";
import { interpolate, Easing } from "remotion";

interface Props {
  progress: number;
  frame: number;
  cardBbox: { left: number; top: number; right: number; bottom: number };
  size: number;
}

function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const PLUMES = Array.from({ length: 8 }, (_, i) => {
  const seed = i + 1;
  return {
    seed,
    xOffset: (hash(seed * 4.7) - 0.5) * 0.4,
    delay: Math.floor(hash(seed * 9.3) * 50),
    speed: 0.65 + hash(seed * 13.1) * 0.7,
    width: 0.18 + hash(seed * 17.5) * 0.2,
  };
});

export const Smoke: React.FC<Props> = ({ progress, frame, cardBbox, size }) => {
  if (progress < 0.1) return null;

  const cx = (cardBbox.left + cardBbox.right) / 2;
  const baseY = (cardBbox.top + cardBbox.bottom) / 2;

  const overallOpacity = interpolate(
    progress,
    [0.1, 0.45, 0.95, 1],
    [0, 0.45, 0.4, 0.18],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        mixBlendMode: "screen",
        opacity: overallOpacity,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size} ${size}`}
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="smokeNoise" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.004 0.012"
              numOctaves="4"
              seed="3"
              result="noise"
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="240" />
            <feGaussianBlur stdDeviation="22" />
          </filter>
        </defs>

        {PLUMES.map((p) => {
          const localFrame = frame - p.delay;
          if (localFrame < 0) return null;
          const t = Math.min(localFrame / 160, 1);
          const eased = Easing.out(Easing.quad)(t);
          const rise = eased * 0.72 * size * p.speed;
          const drift = Math.sin(localFrame * 0.04 + p.seed) * 30;
          const plumeCx = (cx + p.xOffset * 0.12) * size + drift;
          const plumeCy = baseY * size - rise;
          const w = p.width * size * (0.4 + eased * 0.7);
          const h = size * (0.35 + eased * 0.6);
          const op = (1 - t * 0.55) * 0.55;

          return (
            <ellipse
              key={p.seed}
              cx={plumeCx}
              cy={plumeCy}
              rx={w / 2}
              ry={h / 2}
              fill={`rgba(170,160,155,${op})`}
              filter="url(#smokeNoise)"
            />
          );
        })}
      </svg>
    </div>
  );
};
