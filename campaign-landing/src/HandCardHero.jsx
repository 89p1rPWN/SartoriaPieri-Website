import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import './HandCardHero.css';

// Hotspot positions in % of the 1:1 frame (aspect-locked .hc-frame).
// Word row "ABOUT • CAMPAIGN • COLLECTION • CONTACT" sits at ~y=39.5%.
const INITIAL_POS = {
  ABOUT:      { top: 37.5, left: 27.5, width: 7.0, height: 5.5 },
  CAMPAIGN:   { top: 37.5, left: 35.0, width: 10.5, height: 5.5 },
  COLLECTION: { top: 37.5, left: 46.0, width: 12.0, height: 5.5 },
  CONTACT:    { top: 37.5, left: 58.5, width: 10.0, height: 5.5 },
};

export default function HandCardHero() {
  const videoRef = useRef(null);
  const destinationRef = useRef('/');
  const [phase, setPhase] = useState('idle');
  const navigate = useNavigate();

  useEffect(() => {
    gsap.set('.hc-stage', { opacity: 0, scale: 1.06, filter: 'blur(18px) brightness(0.45)' });
    gsap.set('.hc-vignette', { opacity: 0 });
    gsap.set('.hc-hot', { opacity: 0 });

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to('.hc-stage', { opacity: 1, scale: 1, filter: 'blur(0px) brightness(1)', duration: 2.0 }, 0);
    tl.to('.hc-vignette', { opacity: 1, duration: 1.4 }, 0.3);
    tl.to('.hc-hot', { opacity: 1, duration: 0.6 }, 1.6);
    return () => tl.kill();
  }, []);

  const ignite = (destination) => {
    if (phase !== 'idle') return;
    destinationRef.current = destination;
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.muted = false;
    v.volume = 1.0;
    const start = () => {
      setPhase('burning');
      gsap.to('.hc-hot', { opacity: 0, duration: 0.25 });
    };
    const p = v.play();
    if (p && typeof p.then === 'function') p.then(start).catch(start);
    else start();
  };

  const onVideoEnded = () => {
    setPhase('gone');
    gsap.to('.hc-aftermath', { opacity: 1, duration: 0.25, ease: 'power2.out' });
    setTimeout(() => {
      const dest = destinationRef.current || '/';
      navigate(dest);
    }, 150);
  };

  return (
    <div className={`hc-page hc-phase-${phase}`}>
      <div className="hc-stage">
        <div className="hc-frame">
          <img src="/hand-card-poster-v4-black.png" alt="" className="hc-card-img" draggable={false} />

          <video
            ref={videoRef}
            className={`hc-video ${phase !== 'idle' ? 'hc-video-on' : ''}`}
            src="/hand-video-v6.mp4"
            poster="/hand-card-poster-v4-black.png"
            playsInline
            preload="auto"
            onEnded={onVideoEnded}
          />

          <div className="hc-hotspots">
            {Object.entries(INITIAL_POS).map(([key, pos]) => (
              <button
                key={key}
                type="button"
                aria-label={key}
                className="hc-hot"
                style={{
                    top: `${pos.top}%`,
                    left: `${pos.left}%`,
                    width: `${pos.width}%`,
                    height: `${pos.height}%`,
                }}
                onClick={() => ignite(key === 'COLLECTION' ? '/collections/collection1' : `/${key.toLowerCase()}`)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="hc-aftermath" />
    </div>
  );
}