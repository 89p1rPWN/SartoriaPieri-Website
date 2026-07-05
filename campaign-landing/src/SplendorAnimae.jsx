import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion, MotionConfig } from 'framer-motion';
import Lenis from 'lenis';
import ScrollFilm from './ScrollFilm.jsx';
import Lightbox, { LightboxThumb } from './Lightbox.jsx';
import {
  OUTFITS,
  webSrc,
  fullSrc,
  sectionVideoSrc,
  sectionPosterSrc,
} from './processContent.js';
import './SplendorAnimae.css';

const EASE = [0.16, 1, 0.3, 1];

const heroFramePath = (i) => `/cinematic/frames/frame-${String(i + 1).padStart(4, '0')}.jpg`;

// per-outfit scrub sequences (12fps stills under /cinematic/outfits/<slug>/)
const OUTFIT_FILM_FRAMES = {
  abisso: 68,
  trauma: 68,
  perversione: 68,
  depravazione: 97,
  vergogna: 68,
  dolore: 68,
};

const fadeUp = {
  hidden: { opacity: 0, y: 44 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 1.2, ease: EASE, delay },
  }),
};

// Atelier plates — real craft shots from the outfit archives; captions drawn
// from the atelier's own processo creativo texts.
const ATELIER_PLATES = [
  {
    slug: 'vergogna',
    file: '6.jpg',
    plate: 'Plate I',
    title: 'Ricamo a mano',
    text: 'Perline e filo fissati a pinzette, una ad una: il ricamo arresta ogni strappo prima che si propaghi.',
  },
  {
    slug: 'dolore',
    file: '2.jpg',
    plate: 'Plate II',
    title: 'Lacrime cucite',
    text: 'Il ricamo ispirato alle lacrime si alterna a mani cucite che stringono il tessuto: il dolore prende forma in molteplici volti.',
  },
  {
    slug: 'trauma',
    file: '6.jpg',
    plate: 'Plate III',
    title: 'Modellatura a caldo',
    text: "L'organza cangiante, bruciata e sbrandellata, viene fissata a caldo: la ferita che risplende grazie al ricamo.",
  },
];

// Immersive variant: each outfit is its own scroll-scrubbed mini-film that
// settles on the full-outfit stage image, where the process page opens.
function OutfitFilm({ outfit, onOpen }) {
  const chapters = useMemo(
    () => [
      {
        id: `${outfit.slug}-title`,
        decorative: true,
        start: 0.04,
        end: 0.24,
        className: 'sa-film-chapter--center-left',
        content: (
          <div lang="it">
            <span className="sa-index">{outfit.numeral}</span>
            <h3 className="sa-outfit-film-name">{outfit.name}</h3>
          </div>
        ),
      },
      // the outfit's own processo creativo lines, surfacing mid-scrub
      {
        id: `${outfit.slug}-quote-a`,
        decorative: true,
        start: 0.3,
        end: 0.46,
        content: (
          <p className="sa-outfit-film-quote" lang="it">
            {outfit.process[0]}
          </p>
        ),
      },
      ...(outfit.process.length > 1
        ? [
            {
              id: `${outfit.slug}-quote-b`,
              decorative: true,
              start: 0.52,
              end: 0.68,
              className: 'sa-film-chapter--lower-right',
              content: (
                <p className="sa-outfit-film-quote" lang="it">
                  {outfit.process[1]}
                </p>
              ),
            },
          ]
        : []),
      {
        id: `${outfit.slug}-end`,
        start: 0.8,
        end: 1.1,
        content: (
          <>
            <div lang="it">
              <span className="sa-index">{outfit.numeral}</span>
              <h3 className="sa-outfit-film-name">{outfit.name}</h3>
              <p className="sa-outfit-film-emotion">{outfit.emotion}</p>
            </div>
            <div className="sa-hero-actions">
              <Link
                className="sa-btn"
                to={`/collections/collection1/process/${outfit.slug}`}
                lang="it"
              >
                Il processo
              </Link>
              <button
                type="button"
                className="sa-btn sa-btn--ghost"
                lang="it"
                onClick={() => onOpen(outfit, outfit.looks[0])}
              >
                L'archivio
              </button>
            </div>
          </>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [outfit.slug]
  );

  return (
    <ScrollFilm
      className="sa-outfit-film"
      chapters={chapters}
      frameCount={OUTFIT_FILM_FRAMES[outfit.slug]}
      framePath={(i) =>
        `/cinematic/outfits/${outfit.slug}/frame-${String(i + 1).padStart(4, '0')}.jpg`
      }
      trackVh={280}
      endImage={`/cinematic/outfits/${outfit.slug}/end.jpg`}
      endStart={0.72}
      lazy
      showLoader={false}
      ariaLabel={`${outfit.numeral} — ${outfit.name}`}
    />
  );
}

function SectionVideo({ slug, side, videoRef }) {
  return (
    <Motion.div
      className="sa-outfit-video"
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-8% 0px' }}
    >
      <video
        ref={videoRef}
        src={sectionVideoSrc(slug, side)}
        poster={sectionPosterSrc(slug, side)}
        muted
        loop
        playsInline
        preload="none"
        disablePictureInPicture
        tabIndex={-1}
        aria-hidden="true"
      />
    </Motion.div>
  );
}

function OutfitSection({ outfit, onOpen }) {
  const sectionRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);

  // the ambient loops only run while their section is on screen
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return; // posters only
    const io = new IntersectionObserver(
      ([entry]) => {
        [leftRef.current, rightRef.current].forEach((video) => {
          if (!video) return;
          if (entry.isIntersecting) video.play().catch(() => {});
          else video.pause();
        });
      },
      { rootMargin: '15% 0px' }
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  return (
    <section className="sa-outfit" ref={sectionRef} id={`sa-outfit-${outfit.slug}`}>
      <Motion.header
        className="sa-outfit-head"
        lang="it"
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-12% 0px' }}
      >
        <span className="sa-index">{outfit.numeral}</span>
        <h3>{outfit.name}</h3>
        <p>{outfit.emotion}</p>
        <Link className="sa-look-cta" to={`/collections/collection1/process/${outfit.slug}`}>
          Il processo →
        </Link>
      </Motion.header>

      <div className="sa-outfit-triptych">
        <SectionVideo slug={outfit.slug} side="left" videoRef={leftRef} />
        <div className="sa-outfit-middle">
          {outfit.looks.map((file, i) => (
            <Motion.div
              key={file}
              variants={fadeUp}
              custom={0.1 + i * 0.12}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-8% 0px' }}
            >
              <LightboxThumb
                id={`sec-${outfit.slug}-${file}`}
                label={`${outfit.name} — apri l'archivio`}
                onOpen={() => onOpen(outfit, file)}
              >
                <img
                  src={webSrc(outfit.slug, file)}
                  alt={`${outfit.numeral} — ${outfit.name}`}
                  loading="lazy"
                  decoding="async"
                />
              </LightboxThumb>
            </Motion.div>
          ))}
        </div>
        <SectionVideo slug={outfit.slug} side="right" videoRef={rightRef} />
      </div>
    </section>
  );
}

export default function SplendorAnimae() {
  const lenisRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  // one lightbox for the whole page: { items, index } or null
  const [lightbox, setLightbox] = useState(null);

  const plateItems = ATELIER_PLATES.map((plate) => ({
    id: `plate-${plate.slug}-${plate.file}`,
    thumb: webSrc(plate.slug, plate.file),
    full: fullSrc(plate.slug, plate.file),
    alt: plate.title,
  }));

  // opening a section picture surfaces the outfit's entire archive —
  // looks, process collages, craft shots
  const openOutfitLightbox = (outfit, file) => {
    const items = outfit.gallery.map((entry, i) => ({
      id: `sec-${outfit.slug}-${entry}`,
      thumb: webSrc(outfit.slug, entry),
      full: fullSrc(outfit.slug, entry),
      alt: `${outfit.name} — archivio, immagine ${i + 1} di ${outfit.gallery.length}`,
    }));
    setLightbox({ items, index: Math.max(0, outfit.gallery.indexOf(file)) });
  };

  // pause Lenis while the lightbox owns the viewport
  useEffect(() => {
    if (lightbox) lenisRef.current?.stop();
    else lenisRef.current?.start();
  }, [lightbox]);

  useEffect(() => {
    // stop the browser's async scroll restoration from racing our reset —
    // it re-applies a stale offset once the 700vh track has laid out.
    const prevRestoration = history.scrollRestoration;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });

    let rafId;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const lenis = new Lenis({
        duration: 1.7,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 0.85, // slower, more cinematic scrub per wheel tick
      });
      lenisRef.current = lenis;
      const loop = (time) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
      lenisRef.current?.destroy();
      lenisRef.current = null;
      if ('scrollRestoration' in history) history.scrollRestoration = prevRestoration;
    };
  }, []);

  const scrollTo = (target, duration = 1.8) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, { duration });
      return;
    }
    // no Lenis means the user prefers reduced motion — jump, don't glide
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth';
    if (typeof target === 'number') {
      window.scrollTo({ top: target, behavior });
    } else {
      document.querySelector(target)?.scrollIntoView({ behavior });
    }
  };

  // Scroll so the film sits at progress p (0..1 of the scrub track).
  const scrollToFilm = (p, duration = 2.4) => {
    const track = document.querySelector('.sa-film');
    if (!track) return;
    const max = track.offsetHeight - window.innerHeight;
    scrollTo(track.offsetTop + max * p, duration);
  };

  const chapters = useMemo(
    () => [
      {
        id: 'hero',
        start: 0,
        end: 0.1,
        className: 'sa-film-chapter--hero',
        content: (
          <>
            <p className="sa-eyebrow">Sartoriapieri — Couture Study, FW26</p>
            <h1>
              Splendor <em>Animae</em>
            </h1>
            <p className="sa-film-hero-sub">
              A cinematic couture study in shadow, lace, and transformation.
            </p>
            <div className="sa-hero-actions">
              <button type="button" className="sa-btn" onClick={() => scrollToFilm(0.17)}>
                Explore Collection
              </button>
              <button
                type="button"
                className="sa-btn sa-btn--ghost"
                onClick={() => scrollTo('#sa-lookbook', 3)}
              >
                View Lookbook
              </button>
            </div>
          </>
        ),
      },
      {
        id: 'intro',
        decorative: true,
        start: 0.09,
        end: 0.2,
        className: 'sa-film-chapter--center-left',
        content: (
          <>
            <p className="sa-eyebrow">The Collection</p>
            <p className="sa-film-intro-copy">
              Splendor Animae explores the tension between fragility and power.
              Distressed lace, fractured silhouettes, veiled forms, and
              sculptural movement create a collection suspended between ritual,
              memory, and transformation.
            </p>
          </>
        ),
      },
      {
        id: 'lace',
        decorative: true,
        start: 0.25,
        end: 0.345,
        content: (
          <>
            <span className="sa-index">01</span>
            <h2>Distressed Lace</h2>
            <p className="sa-film-caption">Lace destroyed by hand, then rebuilt as ornament.</p>
          </>
        ),
      },
      {
        id: 'veil',
        decorative: true,
        start: 0.54,
        end: 0.64,
        className: 'sa-film-chapter--lower-right',
        content: (
          <>
            <span className="sa-index">02</span>
            <h2>Veiled Identity</h2>
            <p className="sa-film-caption">The face withdrawn behind a lace horizon.</p>
          </>
        ),
      },
      {
        id: 'movement',
        decorative: true,
        start: 0.685,
        end: 0.77,
        content: (
          <>
            <span className="sa-index">03</span>
            <h2>Shadow Movement</h2>
            <p className="sa-film-caption">Silhouettes that dissolve before they resolve.</p>
          </>
        ),
      },
      {
        id: 'openwork',
        decorative: true,
        start: 0.39,
        end: 0.475,
        className: 'sa-film-chapter--lower-right',
        content: (
          <>
            <span className="sa-index">04</span>
            <h2>Openwork Structure</h2>
            <p className="sa-film-caption">Voids made structural — absence carrying the seam.</p>
          </>
        ),
      },
      {
        id: 'deconstructed',
        decorative: true,
        start: 0.77,
        end: 0.85,
        content: (
          <>
            <span className="sa-index">05</span>
            <h2>Deconstructed Elegance</h2>
            <p className="sa-film-caption">Formality taken apart and worn as memory.</p>
          </>
        ),
      },
      {
        id: 'logo',
        decorative: true,
        start: 0.925,
        end: 1.1,
        className: 'sa-film-chapter--center',
        content: (
          <>
            <span className="sa-film-logo-mark">Sartoriapieri</span>
            <span className="sa-film-logo-rule" aria-hidden="true" />
            <span className="sa-film-logo-sub">Splendor Animae — FW26</span>
          </>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <MotionConfig reducedMotion="user">
    <div className="sa-root">
      <nav className={`sa-nav ${scrolled ? 'is-scrolled' : ''}`}>
        <Link to="/" className="sa-nav-mark">
          Sartoriapieri
        </Link>
        <div className="sa-nav-links">
          <button type="button" onClick={() => scrollToFilm(0)}>
            Film
          </button>
          <button type="button" onClick={() => scrollTo('#sa-lookbook', 3)}>
            Lookbook
          </button>
          <button type="button" onClick={() => scrollTo('#sa-atelier', 3)}>
            Atelier
          </button>
        </div>
      </nav>

      {/* ── The film: scroll-scrubbed frame sequence ── */}
      <ScrollFilm
        chapters={chapters}
        frameCount={275}
        framePath={heroFramePath}
        trackVh={700}
        endImage="/cinematic/endcard.jpg"
        endStart={0.9}
        showLoader
        hint
        ariaLabel="Splendor Animae — the film"
      />

      {/* static narrative for screen readers — the visual chapters above are
          scroll-gated and marked decorative */}
      <div className="sa-sr-only">
        <h2>The Collection</h2>
        <p>
          Splendor Animae explores the tension between fragility and power.
          Distressed lace, fractured silhouettes, veiled forms, and sculptural
          movement create a collection suspended between ritual, memory, and
          transformation.
        </p>
        <p>Distressed Lace — lace destroyed by hand, then rebuilt as ornament.</p>
        <p>Veiled Identity — the face withdrawn behind a lace horizon.</p>
        <p>Shadow Movement — silhouettes that dissolve before they resolve.</p>
        <p>Openwork Structure — voids made structural, absence carrying the seam.</p>
        <p>Deconstructed Elegance — formality taken apart and worn as memory.</p>
      </div>

      {/* ── The five outfits ── */}
      <div className="sa-outfits" id="sa-lookbook">
        <Motion.div
          className="sa-section-head"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-15% 0px' }}
        >
          <p className="sa-eyebrow">Lookbook</p>
          <h2 lang="it">La collezione, in sei atti</h2>
        </Motion.div>
        {OUTFITS.map((outfit) => (
          <OutfitFilm key={outfit.slug} outfit={outfit} onOpen={openOutfitLightbox} />
        ))}
      </div>

      {/* ── Artisanal details ── */}
      <section className="sa-atelier" id="sa-atelier">
        <Motion.div
          className="sa-section-head"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-15% 0px' }}
        >
          <p className="sa-eyebrow">Artisanal Details</p>
          <h2>The Hand Remains Visible</h2>
        </Motion.div>
        <div className="sa-atelier-grid">
          {ATELIER_PLATES.map((plate, i) => (
            <Motion.article
              key={`${plate.slug}-${plate.file}`}
              className="sa-detail"
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-10% 0px' }}
            >
              <div className="sa-detail-media">
                <LightboxThumb
                  id={plateItems[i].id}
                  label={`Ingrandisci — ${plate.title}`}
                  onOpen={() => setLightbox({ items: plateItems, index: i })}
                >
                  <img
                    src={plateItems[i].thumb}
                    alt={plate.title}
                    loading="lazy"
                    decoding="async"
                  />
                </LightboxThumb>
              </div>
              <div className="sa-detail-text" lang="it">
                <span className="sa-index">{plate.plate}</span>
                <h3>{plate.title}</h3>
                <p>{plate.text}</p>
              </div>
            </Motion.article>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="sa-cta">
        <div className="sa-cta-media" aria-hidden="true">
          <img src="/assets/cta-bg.jpg" alt="" loading="lazy" decoding="async" />
          <div className="sa-cta-shade" />
        </div>
        <Motion.div
          className="sa-cta-content"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-20% 0px' }}
        >
          <h2>
            Enter the world of <em>Splendor Animae</em>.
          </h2>
          <a
            className="sa-btn sa-btn--solid"
            href="mailto:press@sartoriapieri.com?subject=Splendor%20Animae%20%E2%80%94%20Lookbook%20Request"
          >
            Request the Lookbook
          </a>
        </Motion.div>
      </section>

      <footer className="sa-footer">
        <span className="sa-nav-mark">Sartoriapieri</span>
        <span>Splendor Animae — FW26</span>
        <span>© 2026</span>
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
