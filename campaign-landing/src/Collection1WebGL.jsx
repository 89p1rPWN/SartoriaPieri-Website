import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import GalleryCanvas from './webgl/GalleryCanvas';
import './Collection1WebGL.css';

const imageList = [
  { src: '/DSC09424.jpg', title: 'LOOK 01', subtitle: 'Deconstructed Overcoat', meta: 'Architectural Wool Blend' },
  { src: '/DSC09477.jpg', title: 'LOOK 02', subtitle: 'Sculptural Silhouette', meta: 'Bonded Crepe Structure' },
  { src: '/DSC09553.jpg', title: 'LOOK 03', subtitle: 'Raw Edge Tailoring', meta: 'Exposed Seam Methodology' },
  { src: '/DSC09604.jpg', title: 'LOOK 04', subtitle: 'Draped Construct', meta: 'Liquid Silk Overlay' },
  { src: '/DSC09638.jpg', title: 'LOOK 05', subtitle: 'Monochrome Tension', meta: 'Contrasting Canvas' },
  { src: '/DSC09668.jpg', title: 'LOOK 06', subtitle: 'Architectural Form', meta: 'Rigid Geometries' },
  { src: '/DSC09722.jpg', title: 'LOOK 07', subtitle: 'Shadow Layer', meta: 'Semi-Transparent Organza' },
  { src: '/DSC09793.jpg', title: 'LOOK 08', subtitle: 'Noir Silhouette', meta: 'Matte Technical Fabric' },
  { src: '/DSC09795.jpg', title: 'LOOK 09', subtitle: 'Fractured Line', meta: 'Laser-Cut Fragmentations' },
  { src: '/DSC09870.jpg', title: 'LOOK 10', subtitle: 'Void Structure', meta: 'Negative Space Draping' },
  { src: '/DSC09939.jpg', title: 'LOOK 11', subtitle: 'Woven Absence', meta: 'Hand-Knit Displacement' },
  { src: '/DSC09951.jpg', title: 'LOOK 12', subtitle: 'Final Form', meta: 'Composite Core Tailoring' },
];

export default function Collection1WebGL() {
  const scrollRef = useRef(null);
  const progressRef = useRef(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const [viewMode, setViewMode] = useState('gallery');

  // Simple native scroll tracking — no Lenis, no ScrollTrigger
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll <= 0) return;
      const progress = el.scrollTop / maxScroll;
      progressRef.current = progress;
      const idx = Math.min(imageList.length - 1, Math.floor(progress * imageList.length));
      setActiveIdx(idx);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const handleThumbClick = useCallback((idx) => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    const target = (idx / imageList.length) * maxScroll + (maxScroll / (imageList.length * 2));
    el.scrollTo({ top: target, behavior: 'smooth' });
  }, []);

  return (
    <div className="c1w-root" ref={scrollRef}>
      {/* Scroll spacer — drives the animation */}
      <div className="c1w-scroll-spacer" style={{ height: `${imageList.length * 100}vh` }} />

      {/* ══════ FIXED OVERLAY LAYER ══════ */}
      <div className="c1w-fixed-layer">
        {/* WebGL Canvas */}
        <div className="c1w-canvas-wrapper">
          <div className="c1w-accent-line" />
          <GalleryCanvas images={imageList} progressRef={progressRef} />
        </div>

        {/* Header */}
        <header className="c1w-header">
          <div className="c1w-header-left">
            <p className="c1w-header-desc">
              THIS SPACE DOESN'T JUST SHOW<br />
              COLLECT RESULTS.<br />
              IT PRESERVES PROCESS.
            </p>
          </div>
          <div className="c1w-header-right">
            <p className="c1w-header-statement">CLARITY, STRUCTURE, AND PRESENCE.</p>
          </div>
        </header>

        {/* Left: Project list */}
        <aside className="c1w-project-list">
          {imageList.map((item, i) => (
            <div
              key={i}
              className={`c1w-project-item ${activeIdx === i ? 'active' : ''}`}
              onClick={() => handleThumbClick(i)}
            >
              <span className="c1w-project-num">({String(i + 1).padStart(3, '0')})</span>
              <span className="c1w-project-name">{item.subtitle.toUpperCase()}</span>
              <span className="c1w-project-link">SEE CASE</span>
            </div>
          ))}
        </aside>

        {/* Right: Metadata + Thumbnails */}
        <aside className="c1w-right-panel">
          <div className="c1w-meta-text">
            <p>THIS SPACE HOLDS</p>
            <p>PROJECTS.</p>
            <p>RESET.</p>
            <p>VISUAL SYSTEMS.</p>
          </div>
          <div className="c1w-thumb-strip">
            {imageList.map((look, i) => (
              <div
                key={i}
                className={`c1w-thumb ${activeIdx === i ? 'active' : ''}`}
                onClick={() => handleThumbClick(i)}
              >
                <img src={look.src} alt={look.title} />
              </div>
            ))}
          </div>
        </aside>

        {/* Bottom bar */}
        <footer className="c1w-bottom-bar">
          <span className="c1w-bottom-label">LATEST WORKS</span>
          <div className="c1w-view-toggle">
            <button
              className={`c1w-toggle-btn ${viewMode === 'gallery' ? 'active' : ''}`}
              onClick={() => setViewMode('gallery')}
            >GALLERY</button>
            <button
              className={`c1w-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >LIST</button>
          </div>
          <span className="c1w-bottom-archive">ARCHIVE 2026&copy;</span>
        </footer>
      </div>
    </div>
  );
}
