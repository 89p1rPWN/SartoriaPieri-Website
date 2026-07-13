import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  motion as Motion,
  MotionConfig,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import Lightbox, { LightboxThumb } from './Lightbox.jsx';
import {
  OUTFITS,
  GARMENT_DATA,
  outfitBySlug,
  webSrc,
  fullSrc,
  videoSrc,
} from './processContent.js';
import './ProcessPage.css';

const EASE = [0.16, 1, 0.3, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 44 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 1.1, ease: EASE, delay },
  }),
};

export default function ProcessPage() {
  const { slug } = useParams();
  const outfit = outfitBySlug(slug);
  const lenisRef = useRef(null);
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const heroVideoRef = useRef(null);
  const prevSlugRef = useRef(null);
  const reduce = useReducedMotion();
  // one lightbox for the whole page: { items, index } or null
  const [lightbox, setLightbox] = useState(null);
  const [videoPaused, setVideoPaused] = useState(false);
  const [lastSlug, setLastSlug] = useState(slug);

  // reset per-outfit UI state during render when the slug changes — the
  // lightbox index and pause state must not leak between outfits
  if (lastSlug !== slug) {
    setLastSlug(slug);
    setLightbox(null);
    setVideoPaused(false);
  }

  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const videoY = useTransform(heroProgress, [0, 1], ['0%', '14%']);
  const titleY = useTransform(heroProgress, [0, 1], ['0%', '-30%']);

  // the same smooth scroll as the collection page
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const lenis = new Lenis({
      duration: 1.7,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.85,
    });
    lenisRef.current = lenis;
    let rafId;
    const loop = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // pause Lenis while the lightbox owns the viewport
  useEffect(() => {
    if (lightbox != null) lenisRef.current?.stop();
    else lenisRef.current?.start();
  }, [lightbox]);

  // reset before paint so the new outfit never flashes at the old scroll
  // offset (which would also consume the once:true entrance animations)
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    if (prevSlugRef.current && prevSlugRef.current !== slug) {
      titleRef.current?.focus({ preventScroll: true });
    }
    prevSlugRef.current = slug;
  }, [slug]);

  if (!outfit) return <Navigate to="/collections/collection1" replace />;

  const index = OUTFITS.indexOf(outfit);
  const prev = OUTFITS[(index - 1 + OUTFITS.length) % OUTFITS.length];
  const next = OUTFITS[(index + 1) % OUTFITS.length];

  const toggleVideo = () => {
    const video = heroVideoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setVideoPaused(false);
    } else {
      video.pause();
      setVideoPaused(true);
    }
  };

  const studioItems = outfit.studio.map((file, i) => ({
    id: `${outfit.slug}-studio-${file}`,
    thumb: webSrc(outfit.slug, file),
    full: fullSrc(outfit.slug, file),
    alt: `${outfit.name} — studio, immagine ${i + 1} di ${outfit.studio.length}`,
  }));

  const sketchItems = outfit.sketches.map((file, i) => ({
    id: `${outfit.slug}-sketch-${file}`,
    thumb: webSrc(outfit.slug, file),
    full: fullSrc(outfit.slug, file),
    alt: `${outfit.name} — processo creativo, immagine ${i + 1} di ${outfit.sketches.length}`,
  }));

  const [lead, ...steps] = outfit.process;

  return (
    <MotionConfig reducedMotion="user">
      <div className="pp-root sa-root" lang="it">
        <nav className="sa-nav is-scrolled">
          <Link to="/collections/collection1" className="sa-nav-mark" aria-label="Sartoriapieri">
            <img className="sa-logo sa-logo--nav" src="/assets/logo.png" alt="Sartoriapieri" />
          </Link>
          <div className="sa-nav-links">
            <Link to="/collections/collection1" className="pp-nav-link">
              ← Il Film
            </Link>
            <Link to={`/collections/collection1/process/${next.slug}`} className="pp-nav-link">
              {next.name} →
            </Link>
          </div>
        </nav>

        {/* ── hero ── */}
        <header className="pp-hero" ref={heroRef}>
          <Motion.div className="pp-hero-text" style={reduce ? undefined : { y: titleY }}>
            <Motion.p
              className="sa-eyebrow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: EASE, delay: 0.3 }}
            >
              Il Processo — {outfit.numeral} di VI
            </Motion.p>
            <Motion.h1
              ref={titleRef}
              tabIndex={-1}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.3, ease: EASE, delay: 0.45 }}
            >
              {outfit.name}
            </Motion.h1>
            <Motion.p
              className="pp-emotion"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, ease: EASE, delay: 0.7 }}
            >
              {outfit.emotion}
            </Motion.p>
          </Motion.div>
          <Motion.div
            className="pp-hero-media"
            style={reduce ? undefined : { y: videoY }}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.6, ease: EASE, delay: 0.2 }}
          >
            <video
              key={outfit.slug}
              ref={heroVideoRef}
              src={videoSrc(outfit.slug)}
              poster={webSrc(outfit.slug, outfit.hero)}
              autoPlay={!reduce}
              muted
              loop
              playsInline
              preload="auto"
              disablePictureInPicture
            />
            <button
              type="button"
              className="pp-video-toggle"
              onClick={toggleVideo}
              aria-label={videoPaused || reduce ? 'Riproduci il video' : 'Metti in pausa il video'}
            >
              {videoPaused || reduce ? '▶' : '⏸'}
            </button>
          </Motion.div>
        </header>

        {/* ── il processo creativo ── */}
        <section className="pp-process">
          <Motion.div
            className="sa-section-head"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-15% 0px' }}
          >
            <p className="sa-eyebrow">Il Processo Creativo</p>
            <Motion.p className="pp-lead" variants={fadeUp}>
              {lead}
            </Motion.p>
          </Motion.div>

          {steps.length > 0 && (
          <div className="pp-steps">
            {steps.map((text, i) => (
              <Motion.article
                key={text.slice(0, 24)}
                className="pp-step"
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-12% 0px' }}
              >
                <div className="pp-step-text">
                  <span className="sa-index">{String(i + 1).padStart(2, '0')}</span>
                  <p>{text}</p>
                </div>
              </Motion.article>
            ))}
          </div>
          )}
        </section>

        {/* ── lo studio: the garment in full light ── */}
        {studioItems.length > 0 && (
        <section className="pp-studio">
          <Motion.div
            className="sa-section-head"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-15% 0px' }}
          >
            <p className="sa-eyebrow">Lo Studio</p>
            <h2>Il capo, in piena luce</h2>
          </Motion.div>
          <div className="pp-studio-grid">
            {studioItems.map((item, i) => (
              <Motion.div
                key={item.id}
                className="pp-studio-cell"
                variants={fadeUp}
                custom={(i % 3) * 0.07}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-8% 0px' }}
              >
                <LightboxThumb
                  id={item.id}
                  label={item.alt}
                  onOpen={() => setLightbox({ items: studioItems, index: i })}
                >
                  <img src={item.thumb} alt={item.alt} loading="lazy" decoding="async" />
                </LightboxThumb>
              </Motion.div>
            ))}
          </div>
        </section>
        )}

        {/* ── schizzi e lavorazione: sketch pages + work in progress ── */}
        {sketchItems.length > 0 && (
        <section className="pp-sketch">
          <Motion.div
            className="sa-section-head"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-15% 0px' }}
          >
            <p className="sa-eyebrow">Dietro le Quinte</p>
            <h2>Schizzi e lavorazione</h2>
          </Motion.div>
          <div className="pp-sketch-grid">
            {sketchItems.map((item, i) => (
              <Motion.div
                key={item.id}
                className="pp-sketch-cell"
                variants={fadeUp}
                custom={(i % 3) * 0.07}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-8% 0px' }}
              >
                <LightboxThumb
                  id={item.id}
                  label={item.alt}
                  onOpen={() => setLightbox({ items: sketchItems, index: i })}
                >
                  <img src={item.thumb} alt={item.alt} loading="lazy" decoding="async" />
                </LightboxThumb>
              </Motion.div>
            ))}
          </div>
        </section>
        )}

        {/* ── garment data ── */}
        <section className="pp-data">
          <Motion.dl
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-15% 0px' }}
          >
            {GARMENT_DATA.filter((row) => row.value).map((row) => (
              <div key={row.label} className="pp-data-row">
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </Motion.dl>
        </section>

        {/* ── prev / next ── */}
        <footer className="pp-next">
          <Link to={`/collections/collection1/process/${prev.slug}`} className="pp-next-link">
            <span className="sa-eyebrow">← Precedente</span>
            <span className="pp-next-name">{prev.name}</span>
          </Link>
          <Link to="/collections/collection1" className="pp-next-home sa-eyebrow">
            La Collezione
          </Link>
          <Link
            to={`/collections/collection1/process/${next.slug}`}
            className="pp-next-link pp-next-link--right"
          >
            <span className="sa-eyebrow">Successivo →</span>
            <span className="pp-next-name">{next.name}</span>
          </Link>
        </footer>

        <Lightbox
          items={lightbox?.items ?? []}
          active={lightbox ? lightbox.index : null}
          onClose={() => setLightbox(null)}
          onNav={(i) => setLightbox((state) => (state ? { ...state, index: i } : state))}
        />
      </div>
    </MotionConfig>
  );
}
