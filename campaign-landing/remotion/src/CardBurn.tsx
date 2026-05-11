import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import { Smoke } from "./Smoke";

export const CARD_BURN_FPS = 24;
export const CARD_BURN_DURATION = 205;
export const CARD_BURN_SIZE = 1440;

const CARD_BBOX = {
  left: 0.21,
  top: 0.24,
  right: 0.74,
  bottom: 0.58,
};

const IGNITION = { x: 0.66, y: 0.555 };

export const CardBurn: React.FC = () => {
  const frame = useCurrentFrame();

  const burnProgress = interpolate(
    frame,
    [10, 160],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }
  );

  const charRadius = interpolate(burnProgress, [0, 1], [0, 130]);

  // Pixel-based radii — CSS radial-gradient "100%" is to-farthest-corner which is
  // too generous, so we work in absolute px in the card-local coord box.
  const cardW = (CARD_BBOX.right - CARD_BBOX.left) * CARD_BURN_SIZE;
  const cardH = (CARD_BBOX.bottom - CARD_BBOX.top) * CARD_BURN_SIZE;
  const halfDiag = Math.hypot(cardW, cardH) / 2;
  const fireRadiusPx = interpolate(burnProgress, [0, 1], [40, halfDiag * 1.6]);
  const emberRadiusPx = interpolate(burnProgress, [0, 1], [20, halfDiag * 1.2]);

  const fireOpacity = interpolate(burnProgress, [0, 0.08, 0.85, 1], [0, 1, 1, 0.55]);
  const emberOpacity = interpolate(burnProgress, [0, 0.2, 0.6, 1], [0, 0.4, 0.85, 0.7]);

  const fadeToBlack = interpolate(
    frame,
    [168, CARD_BURN_DURATION - 5],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) }
  );

  const heatHaze = interpolate(burnProgress, [0, 0.4, 0.85, 1], [0, 3, 5, 0]);

  // Extend fire div upward so flames can rise above the card naturally.
  const fireExtendTop = cardH * 0.55;
  const cardPx = {
    left: CARD_BBOX.left * CARD_BURN_SIZE,
    top: CARD_BBOX.top * CARD_BURN_SIZE,
    width: cardW,
    height: cardH,
  };
  const firePx = {
    left: cardPx.left,
    top: cardPx.top - fireExtendTop,
    width: cardW,
    height: cardH + fireExtendTop,
  };

  const ignitionLocal = {
    cx: ((IGNITION.x - CARD_BBOX.left) / (CARD_BBOX.right - CARD_BBOX.left)) * 100,
    cy: ((IGNITION.y - CARD_BBOX.top) / (CARD_BBOX.bottom - CARD_BBOX.top)) * 100,
  };
  const ignitionFireLocal = {
    cx: ignitionLocal.cx,
    cy: ((IGNITION.y * CARD_BURN_SIZE - firePx.top) / firePx.height) * 100,
  };

  const fireMask = `radial-gradient(circle ${fireRadiusPx * 1.1}px at ${ignitionFireLocal.cx}% ${ignitionFireLocal.cy}%, rgba(0,0,0,1) 0px, rgba(0,0,0,1) ${fireRadiusPx * 0.55}px, rgba(0,0,0,0) ${fireRadiusPx * 1.05}px)`;
  const emberMask = `radial-gradient(circle ${emberRadiusPx * 1.1}px at ${ignitionLocal.cx}% ${ignitionLocal.cy}%, rgba(0,0,0,1) 0px, rgba(0,0,0,1) ${emberRadiusPx * 0.45}px, rgba(0,0,0,0) ${emberRadiusPx * 1.0}px)`;

  const fireScale = interpolate(burnProgress, [0, 1], [1.0, 1.4]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill style={{ filter: `blur(${heatHaze * 0.35}px)` }}>
        <Img
          src={staticFile("hand-card-poster-v4.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
      </AbsoluteFill>

      {/* Smoldering embers — real footage, screen-blend, masked to inner consumed area */}
      <div
        style={{
          position: "absolute",
          left: cardPx.left,
          top: cardPx.top,
          width: cardPx.width,
          height: cardPx.height,
          overflow: "hidden",
          pointerEvents: "none",
          mixBlendMode: "screen",
          opacity: emberOpacity,
          WebkitMaskImage: emberMask,
          maskImage: emberMask,
        }}
      >
        <OffthreadVideo
          src={staticFile("stock/fire-B-fading.mp4")}
          startFrom={20}
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${fireScale}) rotate(8deg)`,
            transformOrigin: "center",
            filter: "saturate(1.1)",
          }}
        />
      </div>

      {/* Char overlay — covers the consumed card area with dark burnt paper */}
      <div
        style={{
          position: "absolute",
          left: cardPx.left,
          top: cardPx.top,
          width: cardPx.width,
          height: cardPx.height,
          pointerEvents: "none",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ overflow: "visible", display: "block" }}
        >
          <defs>
            <radialGradient
              id="charFront"
              cx={`${ignitionLocal.cx}%`}
              cy={`${ignitionLocal.cy}%`}
              r={`${charRadius}%`}
            >
              <stop offset="0%" stopColor="rgb(255,255,255)" />
              <stop offset="78%" stopColor="rgb(255,255,255)" />
              <stop offset="100%" stopColor="rgb(0,0,0)" />
            </radialGradient>

            <filter id="charFilter" x="-15%" y="-15%" width="130%" height="130%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.09 0.13"
                numOctaves="5"
                seed="7"
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="12"
                xChannelSelector="R"
                yChannelSelector="G"
                result="distorted"
              />
              <feColorMatrix
                in="distorted"
                type="matrix"
                values="1 0 0 0 0
                        1 0 0 0 0
                        1 0 0 0 0
                        1 0 0 0 0"
                result="rToAll"
              />
              <feComponentTransfer in="rToAll">
                <feFuncR type="discrete" tableValues="0 0 0 0 0 0 0 0.022 0.014 0.008 0.005" />
                <feFuncG type="discrete" tableValues="0 0 0 0 0 0 0 0.012 0.006 0.003 0.002" />
                <feFuncB type="discrete" tableValues="0 0 0 0 0 0 0 0.006 0.003 0.002 0.001" />
                <feFuncA type="discrete" tableValues="0 0 0 0 0 0 0 1 1 1 1" />
              </feComponentTransfer>
            </filter>
          </defs>

          {burnProgress > 0 && (
            <rect
              x="-15"
              y="-15"
              width="130"
              height="130"
              fill="url(#charFront)"
              filter="url(#charFilter)"
            />
          )}
        </svg>
      </div>

      {/* Main fire — real footage, screen-blend, masked to burn front (slightly larger than char) */}
      <div
        style={{
          position: "absolute",
          left: firePx.left,
          top: firePx.top,
          width: firePx.width,
          height: firePx.height,
          overflow: "hidden",
          pointerEvents: "none",
          mixBlendMode: "screen",
          opacity: fireOpacity,
          WebkitMaskImage: fireMask,
          maskImage: fireMask,
        }}
      >
        <OffthreadVideo
          src={staticFile("stock/fire-A-burning-black.mp4")}
          startFrom={50}
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center bottom",
            transform: `scale(${fireScale * 1.15})`,
            transformOrigin: `${ignitionFireLocal.cx}% ${ignitionFireLocal.cy}%`,
            filter: "saturate(1.05) brightness(1.15) contrast(1.05)",
          }}
        />
      </div>

      {/* Smoke (existing SVG plumes) */}
      <Smoke progress={burnProgress} frame={frame} cardBbox={CARD_BBOX} size={CARD_BURN_SIZE} />

      {/* Final fade to black */}
      <AbsoluteFill
        style={{
          backgroundColor: "#000",
          opacity: fadeToBlack * 0.95,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
