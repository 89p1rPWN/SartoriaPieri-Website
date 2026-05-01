import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import './App.css';

gsap.registerPlugin(ScrollTrigger);

function DraggableFig({ className, src, alt, label }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let dragging = false;
    let sx, sy, ol, ot;

    const down = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragging = true;
      sx = (e.touches ? e.touches[0] : e).clientX;
      sy = (e.touches ? e.touches[0] : e).clientY;
      ol = el.offsetLeft;
      ot = el.offsetTop;
      el.style.zIndex = '9999';
    };
    const move = (e) => {
      if (!dragging) return;
      e.preventDefault();
      const cx = (e.touches ? e.touches[0] : e).clientX;
      const cy = (e.touches ? e.touches[0] : e).clientY;
      el.style.left = (ol + cx - sx) + 'px';
      el.style.top = (ot + cy - sy) + 'px';
      el.style.right = 'auto';
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      const pLeft = (parseFloat(el.style.left) / window.innerWidth * 100).toFixed(1);
      const pTop = (parseFloat(el.style.top) / window.innerHeight * 100).toFixed(1);
      console.log(`%c[${label}] left: ${pLeft}%  top: ${pTop}%`, 'color:#cc0000;font-size:14px;font-weight:bold');
    };

    el.addEventListener('mousedown', down);
    el.addEventListener('touchstart', down, { passive: false });
    document.addEventListener('mousemove', move);
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('mouseup', up);
    document.addEventListener('touchend', up);
    return () => {
      el.removeEventListener('mousedown', down);
      el.removeEventListener('touchstart', down);
      document.removeEventListener('mousemove', move);
      document.removeEventListener('touchmove', move);
      document.removeEventListener('mouseup', up);
      document.removeEventListener('touchend', up);
    };
  }, [label]);

  return (
    <div ref={ref} className={`hero-fig ${className}`} style={{ cursor: 'grab', pointerEvents: 'all', userSelect: 'none' }}>
      <img src={src} alt={alt} draggable={false} style={{ pointerEvents: 'none' }} />
    </div>
  );
}

function App() {
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const storyRef = useRef(null);
  const craftRef = useRef(null);
  const ghostTextRef = useRef(null);
  const lenisRef = useRef(null);

  useEffect(() => {
    // 1. Initial State Sync (Ensure branding and figures materialize from nothing)
    // Removed gsap.set to prevent hard-lock if JS fails/stalls.

    // 1. Smooth Scroll Inertia (Lenis)
    const lenis = new Lenis({
      duration: 1.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.8,
    });
    lenisRef.current = lenis;

    let rafId;
    function raf(time) {
      lenis.raf(time);
      ScrollTrigger.update();
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // ══════ HERO ENTRANCE — decaying paper ══════
    let cancelled = false;
    const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·/—·#§¶†‡";
    const isSpace = (c) => c === ' ' || c.charCodeAt(0) === 160;
    const scrambleEls = Array.from(document.querySelectorAll('.scramble'));
    scrambleEls.forEach(el => {
      if (!el.dataset.final) el.dataset.final = el.textContent;
    });

    const scrambleActive = new WeakMap();
    const runScramble = (el, finalText, duration = 1.0) => {
      const token = Symbol();
      scrambleActive.set(el, token);
      const chars = finalText.split('');
      const start = performance.now();
      const tick = (now) => {
        if (cancelled || scrambleActive.get(el) !== token) return;
        const progress = Math.min((now - start) / (duration * 1000), 1);
        const settled = Math.floor(chars.length * progress);
        let out = '';
        for (let i = 0; i < chars.length; i++) {
          const c = chars[i];
          if (i < settled || c === ' ' || c === ' ') out += c;
          else out += CHARSET[(Math.random() * CHARSET.length) | 0];
        }
        el.textContent = out;
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = finalText;
      };
      requestAnimationFrame(tick);
    };

    const garbleInstant = (el) => {
      const final = el.dataset.final || el.textContent;
      const token = Symbol();
      scrambleActive.set(el, token);
      el.textContent = final.split('').map(c =>
        (c === ' ' || c === ' ') ? c : CHARSET[(Math.random() * CHARSET.length) | 0]
      ).join('');
    };

    // Pre-scramble all text so the entry reveal has garbage to settle from
    scrambleEls.forEach(el => garbleInstant(el));

    const heroTl = gsap.timeline();
    heroTl.to(containerRef.current, { opacity: 1, duration: 0.01 }, 0);
    heroTl.to(".hero-curtain", { opacity: 0, duration: 1.8, ease: "power2.inOut" }, 0.3);
    heroTl.fromTo("nav", { opacity: 0 }, { opacity: 1, duration: 1.5, ease: "power2.out" }, 1.4);
    heroTl.fromTo(".paper-decay-mask", { opacity: 0, scale: 1.18, filter: "blur(30px) contrast(2)" }, { opacity: 1, scale: 1, filter: "blur(0px) contrast(1)", duration: 2.4, ease: "power3.out" }, 1.1);
    heroTl.fromTo(".paper-edges", { opacity: 0 }, { opacity: 1, duration: 1.8, ease: "power2.out" }, 1.4);
    heroTl.fromTo(".scramble", { opacity: 0, filter: "blur(12px)" }, { opacity: 1, filter: "blur(0px)", duration: 1.2, stagger: 0.1, ease: "power2.out" }, 1.6);
    scrambleEls.forEach((el, i) => {
      heroTl.call(() => runScramble(el, el.dataset.final, 1.1), [], 1.6 + i * 0.1);
    });
    heroTl.fromTo(".suite-scroll", { opacity: 0 }, { opacity: 1, duration: 1.2, ease: "power2.out" }, 3.0);
    heroTl.fromTo(".red-accent-line", { scaleY: 0, transformOrigin: "top" }, { scaleY: 1, duration: 2, ease: "power2.out" }, 1.5);

    // ══════ SCROLL EXIT — re-scramble + ink-bleed dissolve ══════
    const heroExit = gsap.timeline({
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 2,
        onLeave: () => {
          scrambleEls.forEach(el => garbleInstant(el));
        },
        onEnterBack: () => {
          scrambleEls.forEach((el, i) => {
            setTimeout(() => runScramble(el, el.dataset.final, 0.8), i * 70);
          });
        },
      },
    });

    heroExit.to(".paper-content", { y: -60, opacity: 0, filter: "blur(14px)", duration: 1 }, 0);
    heroExit.to(".paper-decay-mask", { opacity: 0, filter: "blur(6px)", duration: 1 }, 0);
    heroExit.to(".paper-edges", { opacity: 0, duration: 0.8 }, 0);
    heroExit.to(".suite-corner, .suite-scroll", { opacity: 0, duration: 0.5 }, 0);

    // ══════ NEW: DEEPER LOOK PARALLAX ══════
    gsap.to(".img-offset-1", {
      scrollTrigger: { trigger: ".deeper-look", start: "top bottom", end: "bottom top", scrub: 1 },
      yPercent: -20,
      ease: "none"
    });
    gsap.to(".img-offset-2", {
      scrollTrigger: { trigger: ".deeper-look", start: "top bottom", end: "bottom top", scrub: 1.5 },
      yPercent: -40,
      ease: "none"
    });

    // ══════ NEW: BRAND STORY PARALLAX ══════
    gsap.fromTo(".story-heading",
      { opacity: 0, y: 50, filter: "blur(10px)" },
      {
        scrollTrigger: { trigger: ".story-text-container", start: "top 80%", toggleActions: "play none none reverse" },
        opacity: 1, y: 0, filter: "blur(0px)", duration: 1.5, ease: "power3.out"
      }
    );

    gsap.fromTo(".story-paragraph",
      { opacity: 0, y: 30 },
      {
        scrollTrigger: { trigger: ".story-text-container", start: "top 75%", toggleActions: "play none none reverse" },
        opacity: 1, y: 0, duration: 1.5, ease: "power3.out", delay: 0.2
      }
    );

    gsap.to(".story-parallax-1", {
      scrollTrigger: { trigger: ".brand-story", start: "top bottom", end: "bottom top", scrub: 1 },
      yPercent: -20,
      ease: "none"
    });
    gsap.to(".story-parallax-2", {
      scrollTrigger: { trigger: ".brand-story", start: "top bottom", end: "bottom top", scrub: 1.5 },
      yPercent: -35,
      ease: "none"
    });
    gsap.to(".story-parallax-3", {
      scrollTrigger: { trigger: ".brand-story", start: "top bottom", end: "bottom top", scrub: 1.2 },
      yPercent: -15,
      ease: "none"
    });

    // ══════ NEW: FILM STRIP SCROLL SYNC ══════
    gsap.to(".film-strip", {
      scrollTrigger: {
        trigger: ".vision-reveal",
        start: "top bottom",
        end: "bottom top",
        scrub: 2
      },
      xPercent: -30,
      ease: "none"
    });

    // ══════ NEW: OUTFITS SHOWCASE PARALLAX ══════
    gsap.utils.toArray('.outfit-card').forEach((card, i) => {
      gsap.fromTo(card,
        { opacity: 0, scale: 0.95, y: 100 },
        {
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            toggleActions: "play none none reverse"
          },
          opacity: 1, scale: 1, y: 0,
          duration: 1.5,
          ease: "expo.out"
        }
      );

      const img = card.querySelector('.outfit-img');
      if (img) {
        gsap.to(img, {
          scrollTrigger: {
            trigger: card,
            start: "top bottom",
            end: "bottom top",
            scrub: 1
          },
          yPercent: -15,
          ease: "none"
        });
      }
    });

    gsap.fromTo(".outfits-heading",
      { opacity: 0, y: 50, filter: "blur(10px)" },
      {
        scrollTrigger: { trigger: ".outfits-showcase", start: "top 80%", toggleActions: "play none none reverse" },
        opacity: 1, y: 0, filter: "blur(0px)", duration: 1.5, ease: "power3.out"
      }
    );

    // ══════ NEW: DARK GALLERY PARALLAX ══════
    gsap.utils.toArray('.dg-item').forEach((item, i) => {
      gsap.fromTo(item,
        { opacity: 0, y: 80, scale: 0.95 },
        {
          scrollTrigger: {
            trigger: item,
            start: "top 90%",
            toggleActions: "play none none reverse"
          },
          opacity: 1, y: 0, scale: 1, duration: 1.2, ease: "expo.out"
        }
      );
    });

    // ══════ NEW: CRAFTSMANSHIP PARALLAX ══════
    gsap.to(".craft-sketch-img", {
      scrollTrigger: { trigger: ".craftsmanship", start: "top bottom", end: "bottom top", scrub: 1 },
      yPercent: 40,
      ease: "none"
    });

    gsap.to(".s-1", {
      scrollTrigger: { trigger: ".brand-story", start: "top bottom", end: "bottom top", scrub: 1.2 },
      yPercent: -150,
      rotation: 10,
      ease: "none"
    });
    gsap.to(".s-2", {
      scrollTrigger: { trigger: ".craftsmanship", start: "top bottom", end: "bottom top", scrub: 0.8 },
      yPercent: -80,
      rotation: -15,
      ease: "none"
    });
    gsap.to(".s-3", {
      scrollTrigger: { trigger: ".outfits-showcase", start: "top bottom", end: "bottom top", scrub: 1.5 },
      yPercent: -120,
      ease: "none"
    });

    // ══════ NEW: LOOKS SIDEBAR PARALLAX ══════
    gsap.to(".looks-sidebar", {
      scrollTrigger: {
        trigger: ".all-looks-grid",
        start: "top bottom",
        end: "bottom top",
        scrub: 1
      },
      y: 100,
      ease: "none"
    });

    // ══════ NEW: PREVIOUS CAMPAIGN ITEMS ══════
    gsap.utils.toArray('.prev-item').forEach((item, i) => {
      gsap.from(item, {
        scrollTrigger: {
          trigger: item,
          start: "top 95%",
          toggleActions: "play none none reverse"
        },
        opacity: 0,
        y: 100,
        delay: i * 0.1,
        duration: 1.5,
        ease: "expo.out"
      });
    });

    // ══════ NEW: CLAIM TITLE PINCH / ZOOM ══════
    gsap.from(".claim-title", {
      scrollTrigger: {
        trigger: ".claim-section",
        start: "top bottom",
        end: "center center",
        scrub: true
      },
      scale: 0.5,
      opacity: 0,
      filter: "blur(20px)"
    });

    // Modern Staggered Reveal for Sections
    gsap.utils.toArray('.section-title, .section-title-center').forEach(title => {
      gsap.fromTo(title,
        { opacity: 0, y: 50, filter: "blur(20px)" },
        {
          scrollTrigger: { trigger: title, start: "top 95%", toggleActions: "play none none reverse" },
          opacity: 1, y: 0, filter: "blur(0px)", duration: 2, ease: "power4.out"
        }
      );
    });

    // Content block reveals
    gsap.from(".info-side, .info-block", {
      scrollTrigger: {
        trigger: ".deeper-look",
        start: "top 80%",
        toggleActions: "play none none reverse"
      },
      opacity: 0,
      y: 40,
      stagger: 0.2,
      scale: 0.98,
      duration: 1.5,
      ease: "power2.out"
    });

    // Portfolio Grid Stagger
    gsap.from(".look-thumbnails img", {
      scrollTrigger: {
        trigger: ".look-thumbnails",
        start: "top 90%",
        toggleActions: "play none none reverse"
      },
      opacity: 0,
      y: 60,
      rotate: (i) => i % 2 === 0 ? 5 : -5,
      stagger: 0.1,
      duration: 1.5,
      ease: "power4.out"
    });

    // Ensure first sections are always ready
    gsap.to(heroRef.current, { opacity: 1, duration: 0.1 });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      lenis.destroy();
      ScrollTrigger.getAll().forEach(t => t.kill());
      heroTl.kill();
      heroExit.kill();
      // Restore final text so a remount sees clean values
      scrambleEls.forEach(el => {
        if (el.dataset.final) el.textContent = el.dataset.final;
      });
    };
  }, []);

  return (
    <div className="app-container" ref={containerRef}>
      {/* Cinematic curtain */}
      <div className="hero-curtain" />

      <nav>
        <div className="logo-group">
          <div className="logo">SARTORIAPIERI</div>
          <div className="nav-links">
            <a href="#about">ABOUT</a>
            <a href="#campaign">CAMPAIGN</a>
            <Link to="/collections/collection1">COLLECTION</Link>
          </div>
        </div>
        <div className="nav-action">
          <a href="#contact" className="contact-btn">CONTACT <span className="arrow">→</span></a>
        </div>
      </nav>

      <div className="red-accent-line"></div>

      {/* FLOATING SIGNATURES & SKETCHES */}
      <div className="floating-symbols" aria-hidden="true">
        <div className="symbol s-1">
          <svg viewBox="0 0 200 100" className="sig-path"><path d="M10,80 Q25,30 40,70 T60,20 T80,80 Q90,30 110,60 T140,40 T170,80" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
          <span className="sig-label">Authentic Signature - 01</span>
        </div>
        <div className="symbol s-2">
          <svg viewBox="0 0 100 100" className="sig-path"><circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeDasharray="4 4" /><line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" /><line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" /></svg>
          <span className="sig-label">PATTERN METRICS</span>
        </div>
        <div className="symbol s-3">
          <img src="/sketch-bg.png" alt="floating background sketch" className="floating-sketch-img" />
        </div>
      </div>

      {/* HERO — DECAYING PAPER */}
      <section className="hero hero-paper" ref={heroRef}>
        <svg className="paper-svg-defs" aria-hidden="true">
          <defs>
            <filter id="ink-bleed">
              <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="3" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G">
                <animate attributeName="scale" values="0;0" dur="0.01s" fill="freeze" />
              </feDisplacementMap>
            </filter>
            <filter id="paper-reveal">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="7" />
              <feDisplacementMap in="SourceGraphic" scale="60" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>

        <div className="paper-decay-mask" aria-hidden="true" />
        <div className="paper-edges" aria-hidden="true" />

        <div className="suite-corner suite-corner-tl scramble">SP / ARCHIVE</div>
        <div className="suite-corner suite-corner-tr scramble">N° 01 — V</div>
        <div className="suite-corner suite-corner-bl scramble">FIRENZE · ITALIA</div>
        <div className="suite-corner suite-corner-br scramble">FW · MMXXVI</div>

        <div className="suite-content paper-content" ref={ghostTextRef}>
          <div className="paper-kicker scramble">SARTORIA PIERI ARCHIVE 01</div>
          <h1 className="paper-title scramble">S&nbsp;P&nbsp;L&nbsp;E&nbsp;N&nbsp;D&nbsp;O&nbsp;R&nbsp;&nbsp;&nbsp;A&nbsp;N&nbsp;I&nbsp;M&nbsp;A&nbsp;E</h1>
          <div className="paper-date scramble">04·24·2026 — FIRENZE</div>

          <div className="paper-body">
            <p className="scramble">INSPIRED BY DEPRAVAZIONE · DOLORE · PERVERSIONE</p>
            <p className="scramble">CURATED THROUGH TRAUMA, VERGOGNA, AND SOUL</p>
            <p className="scramble">BY SARTORIA PIERI</p>
          </div>
        </div>

        <div className="suite-scroll">
          <span>SCROLL</span>
          <span className="suite-arrow">↓</span>
        </div>
      </section>

      {/* SECTION 1.5: BRAND STORY */}
      <section className="brand-story" ref={storyRef}>
        <div className="story-container">
          <div className="story-text-container">
            <h2 className="story-heading">EMOTION WOVEN IN</h2>
            <p className="story-paragraph">
              We believe that clothing is more than just fabric; it is the physical manifestation of feeling.
              Our focus is embedding raw emotion into every stitch, draping, and silhouette.
              Every outfit has its story, echoing the silent narratives of those who wear them.
            </p>
          </div>
          <div className="story-gallery">
            <div className="story-img-wrapper img-left">
              <img src="/DSC09424.jpg" alt="Brand Story 1" className="story-parallax-1" />
            </div>
            <div className="story-img-wrapper img-center">
              <img src="/DSC09477.jpg" alt="Brand Story 2" className="story-parallax-2" />
            </div>
            <div className="story-img-wrapper img-right">
              <img src="/DSC09604.jpg" alt="Brand Story 3" className="story-parallax-3" />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1.55: CRAFTSMANSHIP & SKETCHES */}
      <section className="craftsmanship" ref={craftRef}>
        <div className="craft-background">
          <img src="/sketch-bg.png" alt="Craftsmanship sketch" className="craft-sketch-img" />
        </div>
        <div className="craft-content">
          <h2>THE HANDCRAFT <br />OF EMOTION</h2>
          <p>
            Before the fabric touches the skin or gracefully drapes along a silhouette, it is born on paper.
            Every raw line, every chaotic scribbled measurement represents the absolute mapping of an emotion.
            Our craft begins here—where the graphite meets the idea.
          </p>
          <div className="craft-metrics">
            <div className="metric"><span>104</span><small>Hours per garment</small></div>
            <div className="metric"><span>15</span><small>Atelier artisans</small></div>
          </div>
        </div>
      </section>

      {/* SECTION 1.6: OUTFITS SHOWCASE */}
      <section className="outfits-showcase">
        <div className="outfits-container">
          <div className="outfits-header">
            <h2 className="outfits-heading">THE NARRATIVE IN EVERY THREAD</h2>
            <p className="outfits-sub">
              Each piece serves as a chapter, an unfolding dialogue between fabric and the self.
              We craft armors of vulnerability, silhouettes that stand as monuments to personal history.
            </p>
          </div>
          <div className="outfits-grid">
            <div className="outfit-card">
              <div className="outfit-img-container">
                <img src="/DSC09668.jpg" alt="Outfit 1" className="outfit-img" />
              </div>
              <div className="outfit-info">
                <h4>LOOK 01</h4>
                <p>The gentle geometry of solitude, draped in midnight wool.</p>
              </div>
            </div>
            <div className="outfit-card card-offset">
              <div className="outfit-img-container">
                <img src="/DSC09722.jpg" alt="Outfit 2" className="outfit-img" />
              </div>
              <div className="outfit-info">
                <h4>LOOK 02</h4>
                <p>Structured layers reflecting the complexity of modern elegance.</p>
              </div>
            </div>
            <div className="outfit-card">
              <div className="outfit-img-container">
                <img src="/DSC09793.jpg" alt="Outfit 3" className="outfit-img" />
              </div>
              <div className="outfit-info">
                <h4>LOOK 03</h4>
                <p>A continuous narrative born from raw, unyielding textures.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: DISCOVER OUR COLLECTIONS (CINEMATIC BREAK) */}
      <section className="vision-reveal">
        <div className="film-strip">
          <img src="/trio-1.png" className="t-chroma" alt="s1" />
          <img src="/fashion-hero.png" className="t-chroma" alt="s2" />
          <img src="/trio-2.png" className="t-chroma" alt="s3" />
          <img src="/lookbook.png" className="t-chroma" alt="s4" />
          <img src="/silhouette-hero.png" className="t-chroma" alt="s5" />
        </div>
        <div className="vision-text">
          <h2 className="discover-collections-title">DISCOVER OUR COLLECTIONS</h2>
        </div>
      </section>

      {/* SECTION 2: DEEPER LOOK */}
      <section className="deeper-look">
        <div className="section-title-center">A DEEPER LOOK INSIDE THE CAMPAIGN</div>
        <div className="deeper-content">
          <div className="info-side left">
            <h3>HIGHLIGHTS</h3>
            <p>Monochrome silhouettes playing with shadow and scale.</p>
          </div>
          <div className="overlapping-images">
            <img src="/lookbook.png" alt="Detail 01" className="img-offset-1" />
            <img src="/silhouette-hero.png" alt="Detail 02" className="img-offset-2" />
          </div>
          <div className="info-side right">
            <h3>DESIGN PHILOSOPHY</h3>
            <p>Structural avant-garde patterns from Seoul to Paris.</p>
          </div>
        </div>
      </section>

      {/* SECTION 2.5: DARK GALLERY (FOTO SARTORIAPIERI) */}
      <section className="dark-gallery">
        <div className="dark-gallery-header">
          <h2>THE ATELIER VISION</h2>
          <p>Unveiling the essence behind the aesthetic.</p>
        </div>
        <div className="dark-gallery-grid">
          <div className="dg-item dg-item-1">
            <img src="/DSC09793.jpg" alt="Atelier detail 1" />
          </div>
          <div className="dg-item dg-item-2">
            <img src="/DSC09638.jpg" alt="Atelier detail 2" />
          </div>
          <div className="dg-item dg-item-3">
            <img src="/DSC09870.jpg" alt="Atelier detail 3" />
          </div>
          <div className="dg-item dg-item-4">
            <img src="/DSC09939.jpg" alt="Atelier detail 4" />
          </div>
          <div className="dg-item dg-item-5">
            <img src="/DSC09951.jpg" alt="Atelier detail 5" />
          </div>
        </div>
      </section>

      {/* SECTION: VISION REVEAL MOVED UP */}

      {/* SECTION 4: ALL LOOKS */}
      <section className="all-looks-grid" id="lookbook">
        <div className="looks-sidebar">
          <h2 className="section-title">ALL LOOKS</h2>
          <div className="meta-info">
            <div className="meta-item"><span>COLLECTION</span><strong>Persona</strong></div>
            <div className="meta-item"><span>EDITION</span><strong>2026 // FW</strong></div>
            <div className="meta-item"><span>LINEUP</span><strong>001-012</strong></div>
          </div>
          <p className="sidebar-desc">
            An architectural study of the silhouette in motion. Layers of structural fabric defining a new modern silhouette.
          </p>
          <Link to="/collections/collection1" className="archive-cta">
            EXPLORE ARCHIVE <span className="arrow-small">→</span>
          </Link>
        </div>
        <div className="looks-main">
          <div className="featured-look">
            <img src="/fashion-hero.png" className="t-chroma" alt="Featured Look" />
          </div>
          <div className="look-thumbnails">
            <img src="/trio-1.png" className="t-chroma" alt="t1" />
            <img src="/trio-2.png" className="t-chroma" alt="t2" />
            <img src="/silhouette-hero.png" className="t-chroma" alt="t3" />
            <img src="/lookbook.png" className="t-chroma" alt="t4" />
          </div>
        </div>
      </section>

      {/* SECTION 5: PREVIOUS CAMPAIGN */}
      <section className="prev-campaign">
        <div className="prev-label">PREVIOUS CAMPAIGN</div>
        <div className="prev-row">
          <div className="prev-item"><img src="/trio-1.png" alt="p1" /><strong>MODULE</strong><small>Spring/Summer 2025</small></div>
          <div className="prev-item"><img src="/trio-2.png" alt="p2" /><strong>SEOULSOUL</strong><small>Autumn 2025</small></div>
          <div className="prev-item"><img src="/silhouette-hero.png" alt="p3" /><strong>SKIN</strong><small>Winter 2025</small></div>
          <div className="prev-item"><img src="/lookbook.png" alt="p4" /><strong>LAPPED</strong><small>Spring 2024</small></div>
        </div>
      </section>

      {/* SECTION 6: FOOTER / CLAIM */}
      <section className="claim-section">
        <h2 className="claim-title">CLAIM YOUR STYLE <span className="arrow">→</span></h2>
        <div className="walking-models">
          <img src="/lookbook.png" className="walk-img" alt="walk" />
        </div>
      </section>

      {/* TICKER FOOTER */}
      <svg width="0" height="0" style={{ position: 'absolute', visibility: 'hidden' }}>
        <defs>
          <filter id="chroma-black">
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      50 50 50 0 -1"
            />
          </filter>
        </defs>
      </svg>
      <footer className="ticker">
        <div className="ticker-content">
          THE CAMPAIGN EXPERIENCE • PERSONA COLLECTION BY LUMINOUS • EXPERIMENTAL AVANT-GARDE FASHION • SHADOWS AND LIGHT NARRATIVE • SPRING SUMMER 2026 • FROM SEOUL TO PARIS •
        </div>
      </footer>
    </div>
  );
}

export default App;
