import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import './Collection1.css'; // Importing the design foundation

gsap.registerPlugin(ScrollTrigger);

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

export default function Collection1() {
  const containerRef = useRef(null);
  const scrollTrackRef = useRef(null);
  const mainImgRef = useRef(null);
  const nextImgRef = useRef(null);
  const thumbsRef = useRef([]);
  const lenisRef = useRef(null);
  const currentIdx = useRef(0);
  
  const [activeIdx, setActiveIdx] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [entered, setEntered] = useState(false);

  // ══════ CORE IMAGE SWAP ENGINE ══════ 
  const swapImage = useCallback((idx) => {
    if (idx === currentIdx.current) return;
    
    const main = mainImgRef.current;
    const next = nextImgRef.current;
    if (!main || !next) return;

    gsap.killTweensOf([main, next]);

    // Stage the NEXT image
    next.src = imageList[idx].src;
    
    // Cinematic Reveal (Blur + Scale + Opacity)
    const tl = gsap.timeline();
    
    tl.fromTo(next, 
      { opacity: 0, scale: 1.08, filter: 'blur(25px) contrast(1.2)' },
      { opacity: 1, scale: 1, filter: 'blur(0px) contrast(1.1)', duration: 0.8, ease: 'expo.out' }
    );
    
    tl.to(main, { 
      opacity: 0, 
      scale: 0.95,
      filter: 'blur(10px)',
      duration: 0.4, 
      ease: 'power2.in',
      onComplete: () => {
        main.src = imageList[idx].src;
        gsap.set(main, { opacity: 1, scale: 1, filter: 'blur(0px) contrast(1.1)' });
        gsap.set(next, { opacity: 0 });
      }
    }, 0);

    currentIdx.current = idx;
    setActiveIdx(idx);
    
    // Auto-scroll the thumbnail strip if needed
    if (thumbsRef.current[idx]) {
      thumbsRef.current[idx].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    setEntered(true);

    // Initial Preload
    imageList.slice(0, 4).forEach(item => {
      const img = new Image();
      img.src = item.src;
    });

    // --- LENIS INERTIAL SCROLL ---
    const lenis = new Lenis({
      duration: 1.6,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.1,
    });
    lenisRef.current = lenis;

    function raf(time) {
      lenis.raf(time);
      ScrollTrigger.update();
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // --- SCROLLTRIGGER ORCHESTRATOR ---
    const total = imageList.length;
    const st = ScrollTrigger.create({
      trigger: scrollTrackRef.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        setScrollProgress(self.progress);
        const idx = Math.min(total - 1, Math.floor(self.progress * total));
        if (idx !== currentIdx.current) {
          swapImage(idx);
        }
      },
    });

    // Visual Intro
    gsap.from(".theater-main-container", {
      opacity: 0,
      scale: 0.9,
      z: -200,
      duration: 2.5,
      ease: "power4.out",
      delay: 0.5
    });

    return () => {
      lenis.destroy();
      st.kill();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [swapImage]);

  const handleThumbClick = (idx) => {
    const track = scrollTrackRef.current;
    if (!track) return;
    const scrollMax = track.offsetHeight - window.innerHeight;
    const target = track.offsetTop + (idx / imageList.length) * scrollMax + (scrollMax / (imageList.length * 2));
    lenisRef.current?.scrollTo(target, { duration: 1.8 });
  };

  return (
    <div className="archive-container" ref={containerRef}>
      
      {/* SCANLINE / CRT FILTER */}
      <div className="crt-overlay">
        <div className="crt-scanlines" />
        <svg style={{ position: 'fixed', width: '100%', height: '100%' }}>
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" opacity="0.03" />
        </svg>
      </div>

      <div className="scroll-progress-line">
        <div className="progress-inner" style={{ height: `${scrollProgress * 100}%` }} />
      </div>

      <nav className="fixed-nav" style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 1000,
        display: 'flex', justifyContent: 'space-between', padding: 'clamp(1.5rem, 3vw, 3rem) clamp(1.5rem, 5vw, 5rem)'
      }}>
        <Link to="/" className="nav-logo" style={{ textDecoration: 'none', color: '#fff', fontWeight: 900, letterSpacing: '0.2rem' }}>SARTORIAPIERI</Link>
        <Link to="/" className="nav-back" style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', letterSpacing: '0.1rem' }}>EXIT ARCHIVE</Link>
      </nav>

      <section className="archive-hero">
        <div className="hero-aura" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ 
            fontSize: '0.6rem', 
            letterSpacing: '0.6em', 
            color: 'var(--color-accent)', 
            textTransform: 'uppercase', 
            marginBottom: '1rem',
            opacity: entered ? 1 : 0,
            transform: entered ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 1s cubic-bezier(0.19, 1, 0.22, 1) 0.3s'
          }}>Ref. Archive_01A</p>
          <h1 style={{ 
            fontSize: 'clamp(4rem, 12vw, 10rem)', 
            fontWeight: 100, 
            lineHeight: 0.85, 
            margin: 0,
            opacity: entered ? 1 : 0,
            transform: entered ? 'translateY(0)' : 'translateY(40px)',
            transition: 'all 1.2s cubic-bezier(0.19, 1, 0.22, 1) 0.5s'
          }}>MORPHOLOGY</h1>
          <h2 style={{ 
            fontSize: 'clamp(2rem, 5vw, 4rem)', 
            fontWeight: 200, 
            fontStyle: 'italic', 
            color: 'rgba(255,255,255,0.2)',
            opacity: entered ? 1 : 0,
            transform: entered ? 'translateY(0)' : 'translateY(40px)',
            transition: 'all 1.2s cubic-bezier(0.19, 1, 0.22, 1) 0.7s'
          }}>Winter / Spring 26</h2>
        </div>
      </section>

      {/* ══════ ARCHIVE THEATER TRACK ══════ */}
      <div ref={scrollTrackRef} className="archive-track" style={{ height: `${imageList.length * 150}vh` }}>
        
        <div className="archive-theater">
          <div className="theater-main-container">
            <div className="image-vignette" />
            <img ref={mainImgRef} src={imageList[0].src} className="theater-image" alt="Main View" />
            <img ref={nextImgRef} src={imageList[0].src} className="theater-image" alt="Next View" style={{ opacity: 0 }} />
          </div>

          <div className="theater-captions">
            <div className="look-id">{imageList[activeIdx].title}</div>
            <h3 className="look-title">{imageList[activeIdx].subtitle}</h3>
            <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginTop: '1rem', textTransform: 'uppercase' }}>
              {imageList[activeIdx].meta}
            </p>
          </div>

          <div className="thumbnail-strip">
            {imageList.map((look, i) => (
              <div 
                key={i} 
                className={`thumb-link ${activeIdx === i ? 'active' : ''}`}
                ref={el => thumbsRef.current[i] = el}
                onClick={() => handleThumbClick(i)}
              >
                <img src={look.src} className="thumb-image" alt={look.title} />
              </div>
            ))}
          </div>

          <div style={{ position: 'absolute', bottom: 'clamp(1.5rem, 3vw, 3rem)', right: 'clamp(1.5rem, 5vw, 5rem)', opacity: 0.15, fontSize: '0.6rem', letterSpacing: '0.4em' }}>
            {String(activeIdx + 1).padStart(2, '0')} / {imageList.length}
          </div>
        </div>
      </div>

      <footer style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
          <h4 style={{ fontSize: '0.6rem', letterSpacing: '0.5em', color: 'rgba(255,255,255,0.2)', marginBottom: '2rem' }}>END OF ARCHIVE</h4>
          <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 900, border: '1px solid rgba(255,255,255,0.2)', padding: '1rem 2rem', letterSpacing: '0.1rem' }}>RETURN HOME</Link>
        </div>
      </footer>
    </div>
  );
}
