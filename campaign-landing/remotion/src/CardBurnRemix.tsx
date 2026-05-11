import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";

export const REMIX_FPS = 24;
export const REMIX_SIZE = 1440;
const INTRO_FRAMES = 10;          // ~0.4s of the new black-bg poster before burn
const INTRO_CROSSFADE = 6;        // last 6 frames of intro overlap with v2 start
const V2_SKIP_START = 18;         // drop the static intro frames of v2
const V2_SKIP_END = 30;           // drop the bare-smoke tail of v2
const V2_FRAMES = 205 - V2_SKIP_START - V2_SKIP_END;
const OUTRO_FRAMES = 18;          // 0.75s fade-out
export const REMIX_DURATION = (INTRO_FRAMES - INTRO_CROSSFADE) + V2_FRAMES + OUTRO_FRAMES;

export const CardBurnRemix: React.FC = () => {
  const frame = useCurrentFrame();

  const videoStart = INTRO_FRAMES - INTRO_CROSSFADE;
  const burnFrame = Math.max(0, frame - videoStart);
  const gradeMix = interpolate(burnFrame, [0, 40, V2_FRAMES], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Intro poster opacity: solid → fades out across the crossfade
  const introOpacity = interpolate(
    frame,
    [0, INTRO_FRAMES - INTRO_CROSSFADE, INTRO_FRAMES],
    [1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) }
  );

  // Fade-to-black overlay: starts subtle at v2's smoke-only tail, then full black for outro.
  const endStart = videoStart + V2_FRAMES - 24;
  const fadeBlack = interpolate(
    frame,
    [endStart, videoStart + V2_FRAMES, REMIX_DURATION - 6],
    [0, 0.65, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) }
  );

  // Warm haze that breathes with the fire (peaks mid-burn).
  const warmHaze = interpolate(
    burnFrame,
    [0, 60, 130, V2_FRAMES],
    [0, 0.18, 0.22, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* INTRO: new black-bg poster (matches the live <img> behind the video) */}
      <AbsoluteFill style={{ opacity: introOpacity }}>
        <Img
          src={staticFile("hand-card-poster-v4-black.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {/* BURN: real v2 footage with grading filter applied */}
      <Sequence from={videoStart} durationInFrames={V2_FRAMES + OUTRO_FRAMES}>
        <AbsoluteFill
          style={{
            filter: `contrast(${1 + 0.08 * gradeMix}) saturate(${1 + 0.06 * gradeMix}) brightness(${1 - 0.02 * gradeMix})`,
          }}
        >
          <OffthreadVideo
            src={staticFile("hand-video-v2.mp4")}
            startFrom={V2_SKIP_START}
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Warm fire-light haze: screen-blended orange wash that breathes with the burn */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(255,120,40,1) 0%, rgba(255,80,20,0.5) 35%, rgba(0,0,0,0) 80%)",
          mixBlendMode: "screen",
          opacity: warmHaze,
          pointerEvents: "none",
        }}
      />

      {/* Soft vignette to push attention center */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 50% 55%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Final fade-to-black */}
      <AbsoluteFill
        style={{
          backgroundColor: "#000",
          opacity: fadeBlack,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
