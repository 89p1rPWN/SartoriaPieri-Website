import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import SmokeBackground from './SmokeBackground.jsx';
import './Collection1New.css';

gsap.registerPlugin(ScrollTrigger);

const outfits = [
  {
    src: '/outfits/vergogna/vergogna_nobg.png',
    name: 'VERGOGNA',
    emotion: 'Il peso di ciò che nascondiamo sotto la superficie.',
    summary: [
      'Sottostruttura e crinolina esaltano le curve e amplificano il soffocamento.',
      'Cinture in vita, al ginocchio e al fondo accentuano la tensione.',
      "Un drappeggio di organza cancella i connotati: l'angoscia del nascondimento.",
    ],
  },
  {
    src: '/outfits/dolore/dolore_nobg.png',
    name: 'DOLORE',
    emotion: 'Il compagno inevitabile. Il dolore indossato apertamente.',
    summary: [
      'Il dolore accompagna sempre la vergogna: per questo ne condivide il tessuto.',
      'Mantella a collo alto, gonna trapezoidale in crinolina — la pesantezza prende forma.',
      'Ricami di lacrime e mani cucite stringono il tessuto in molteplici volti.',
    ],
  },
  {
    src: '/outfits/depravazione/1_nobg.png',
    name: 'DEPRAVAZIONE',
    emotion: "L'esposizione cruda. Il lusso di non avere più nulla da perdere.",
    summary: [
      "L'istinto più immorale: ciò che va oltre il gradino.",
      'Un drappeggio composto da slip — la perversione tradotta in forma cruda.',
      'La corona di spine: la sofferenza della perdita del controllo.',
    ],
  },
  {
    src: '/outfits/perversione/2_nobg.png',
    name: 'PERVERSIONE',
    emotion: 'La bellezza distorta fino a diventare altro.',
    summary: [
      'Il pizzo, simbolo di eccellenza sensuale, diventa il punto di partenza.',
      'Una sirena con collare: i punti erogeni esposti da un taglio sul centro dietro.',
      "Il cappello, ispirato ai samurai giapponesi, segna l'inizio della rivelazione.",
    ],
  },
  {
    src: '/outfits/trauma/3_nobg.png',
    name: 'TRAUMA',
    emotion: 'La frattura. Il prima, il durante, il dopo.',
    summary: [
      'Una ferita che non si rimargina, ma che, se accettata, risplende nel ricamo.',
      "Il corpino inciso a sinistra: un'asimmetria che diventa armonia.",
      'Il velo, più corto, svela il mistero. La gabbia inizia a cedere.',
    ],
  },
];

export default function Collection1New() {
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const reelRef = useRef(null);
  const trackRef = useRef(null);
  const lenisRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);

    const lenis = new Lenis({
      duration: 1.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.8,
    });
    lenisRef.current = lenis;
    window.__lenis = lenis;
    let rafId;
    function raf(time) {
      lenis.raf(time);
      ScrollTrigger.update();
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // ── HERO ENTRANCE ──
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl.to('.c1n-curtain', { opacity: 0, duration: 0.55, ease: 'power2.inOut' }, 0);
    heroTl.fromTo('.c1n-hero-bg-text',
      { opacity: 0, scale: 1.6, filter: 'blur(40px)' },
      { opacity: 0.04, scale: 1, filter: 'blur(0px)', duration: 1.6, ease: 'power2.out' }, 0.1);
    heroTl.fromTo('.c1n-hero-title',
      { clipPath: 'inset(110% 0 0 0)', y: 40, opacity: 1 },
      { clipPath: 'inset(0% 0 0 0)', y: 0, duration: 1.0, ease: 'expo.out' }, 0.3);
    heroTl.fromTo('.c1n-hero-line',
      { scaleX: 0, opacity: 0 },
      { scaleX: 1, opacity: 1, duration: 0.8, ease: 'power3.inOut', transformOrigin: 'left center' }, 0.65);
    heroTl.fromTo('.c1n-hero-tagline',
      { opacity: 0, y: 14, filter: 'blur(6px)' },
      { opacity: 0.5, y: 0, filter: 'blur(0px)', duration: 0.85, ease: 'power2.out' }, 0.85);
    heroTl.fromTo('.c1n-nav',
      { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.55 }, 1.1);
    heroTl.fromTo('.c1n-hero-scroll',
      { opacity: 0, y: 10 }, { opacity: 0.5, y: 0, duration: 0.6, ease: 'power2.out' }, 1.25);

    // ── HERO EXIT ──
    gsap.to('.c1n-hero-inner', {
      scrollTrigger: { trigger: heroRef.current, start: 'top top', end: '80% top', scrub: 0.8 },
      y: -300, opacity: 0, scale: 0.7, rotateX: 8, filter: 'blur(30px)',
    });
    gsap.to('.c1n-hero-video', {
      scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: 0.8 },
      scale: 1.25, opacity: 0, filter: 'blur(15px)',
    });
    gsap.to('.c1n-hero-bg-text', {
      scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: 1 },
      y: -400, scale: 1.5, opacity: 0,
    });

    // ── REEL: smooth crossfade between outfits on desktop, vertical stack on mobile ──
    const mm = gsap.matchMedia();

    mm.add('(min-width: 901px)', () => {
      const reel = reelRef.current;
      const track = trackRef.current;
      if (!reel || !track) return;
      const panels = gsap.utils.toArray('.c1n-reel-panel');
      if (!panels.length) return;
      const total = panels.length;

      // Thorgal-style vertical slide: animate the track's translateY from 0 to
      // -(total-1)*100lvh. Scroll progress drives the slide directly; snap
      // locks each viewport at exactly one panel.
      const slideDistance = () => window.innerHeight * (total - 1);

      gsap.to(track, {
        y: () => -slideDistance(),
        ease: 'none',
        scrollTrigger: {
          trigger: reel,
          pin: true,
          scrub: 1.4,
          snap: {
            snapTo: 1 / (total - 1),
            duration: { min: 0.4, max: 0.9 },
            ease: 'power3.inOut',
          },
          end: () => '+=' + slideDistance() * 1.5,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const idx = Math.round(self.progress * (total - 1));
            setActiveIdx((prev) => (prev === idx ? prev : idx));
          },
        },
      });
    });

    // ── CLOSING ──
    gsap.fromTo('.c1n-closing-text',
      { opacity: 0, y: 80, scale: 0.95, filter: 'blur(12px)' },
      {
        scrollTrigger: { trigger: '.c1n-closing', start: 'top 70%', toggleActions: 'play none none reverse' },
        opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 2.5, ease: 'power2.out'
      }
    );
    gsap.fromTo('.c1n-closing-bg',
      { opacity: 0, scale: 3 },
      {
        scrollTrigger: { trigger: '.c1n-closing', start: 'top 80%', end: 'center center', scrub: 1 },
        opacity: 0.015, scale: 1,
      }
    );

    const refreshTimers = [
      setTimeout(() => ScrollTrigger.refresh(), 200),
      setTimeout(() => ScrollTrigger.refresh(), 800),
      setTimeout(() => ScrollTrigger.refresh(), 2000),
    ];
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      mm.revert();
      ScrollTrigger.getAll().forEach((t) => t.kill());
      refreshTimers.forEach(clearTimeout);
      window.removeEventListener('load', onLoad);
    };
  }, []);

  return (
    <div className="c1n-root" ref={containerRef}>
      <SmokeBackground className="c1n-page-smoke" smokeColor="#FF0000" />
      <div className="c1n-curtain" />

      <nav className="c1n-nav">
        <Link to="/" className="c1n-logo">SARTORIAPIERI</Link>
        <div className="c1n-nav-right">
          <span className="c1n-nav-label">SPLENDOR ANIMAE</span>
          <Link to="/" className="c1n-nav-back">HOME</Link>
        </div>
      </nav>

      <section className="c1n-hero" ref={heroRef}>
        <video
          className="c1n-hero-video"
          src="/hero-video.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        <div className="c1n-hero-overlay" />
        <div className="c1n-hero-bg-text">PIERI</div>
        <div className="c1n-hero-inner">
          <h1 className="c1n-hero-title">SPLENDOR ANIMAE</h1>
          <div className="c1n-hero-line" />
          <p className="c1n-hero-tagline">What lives inside you has always been wearing you.</p>
        </div>
        <div className="c1n-hero-scroll"><div className="c1n-scroll-line" /><span>SCROLL</span></div>
      </section>

      <section className="c1n-reel" ref={reelRef} aria-label="The collection">
        <div className="c1n-reel-track" ref={trackRef}>
          {outfits.map((o, i) => (
            <article className="c1n-reel-panel" key={o.name}>
              <div className="c1n-panel-bg-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</div>

              <div className="c1n-panel-image-wrap">
                <img src={o.src} alt={o.name} className="c1n-panel-image" />
              </div>

              <div className="c1n-panel-content">
                <span className="c1n-panel-label">LOOK {String(i + 1).padStart(2, '0')} · SPLENDOR ANIMAE</span>
                <h2 className="c1n-panel-name">{o.name}</h2>
                <div className="c1n-panel-line" />
                <p className="c1n-panel-emotion">{o.emotion}</p>
                <ul className="c1n-panel-summary">
                  {o.summary.map((line, j) => (
                    <li key={j}>{line}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        <div className="c1n-reel-progress" aria-hidden="true">
          <span className="c1n-reel-count">{String(activeIdx + 1).padStart(2, '0')}</span>
          <div className="c1n-reel-progress-bar">
            <div
              className="c1n-reel-progress-fill"
              style={{ width: `${((activeIdx + 1) / outfits.length) * 100}%` }}
            />
          </div>
          <span className="c1n-reel-count c1n-reel-count-muted">{String(outfits.length).padStart(2, '0')}</span>
        </div>
      </section>

      <section className="c1n-closing">
        <div className="c1n-closing-bg">SPLENDOR ANIMAE</div>
        <div className="c1n-closing-text">
          <p>CLOTHING IS THE SKIN WE CHOOSE.</p>
          <p>THESE FIVE LOOKS ARE THE SCARS WE WEAR WILLINGLY.</p>
        </div>
      </section>

      <footer className="c1n-footer">
        <div className="c1n-footer-inner">
          <Link to="/" className="c1n-footer-logo">SARTORIAPIERI</Link>
          <div className="c1n-footer-meta">
            <span>SPLENDOR ANIMAE</span><span>FW 2026</span><span>© 2026</span>
          </div>
          <Link to="/" className="c1n-footer-back">RETURN HOME →</Link>
        </div>
      </footer>
    </div>
  );
}
