import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion, MotionConfig } from 'framer-motion';
import Lenis from 'lenis';
import ScrollFilm from './ScrollFilm.jsx';
import FocusRail from './FocusRail.jsx';
import { LightboxThumb } from './Lightbox.jsx';
import {
  OUTFITS,
  webSrc,
  sectionVideoSrc,
  sectionPosterSrc,
} from './processContent.js';
import './SplendorAnimae.css';

const EASE = [0.16, 1, 0.3, 1];

// portrait phones get center-cropped portrait sequences (full sharpness at a
// fraction of the landscape frames' weight) and shorter scrub tracks
const PORTRAIT =
  typeof window !== 'undefined' &&
  window.matchMedia('(orientation: portrait) and (max-width: 900px)').matches;

// portrait: the film scrubs full-screen (portrait-cropped set) while the
// letterboxed bookend images keep the whole lineup visible at rest and end
const heroFramePath = (i) =>
  `/cinematic/frames/${PORTRAIT ? 'p/' : ''}frame-${String(i + 1).padStart(4, '0')}.jpg`;

// per-outfit scrub sequences (12fps stills under /cinematic/outfits/<slug>/)
const OUTFIT_FILM_FRAMES = {
  abisso: 135,
  trauma: 135,
  perversione: 135,
  depravazione: 193,
  vergogna: 135,
  dolore: 135,
};

const fadeUp = {
  hidden: { opacity: 0, y: 44 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 1.2, ease: EASE, delay },
  }),
};

// L'archivio come focus rail: una card per outfit, immagine firma
// dall'archivio, in ordine di collezione.
const ARCHIVE_ITEMS = OUTFITS.map((outfit) => ({
  id: outfit.slug,
  title: outfit.name,
  description: outfit.emotion,
  meta: `${outfit.numeral} — FW26`,
  imageSrc: webSrc(outfit.slug, outfit.hero),
}));

// Immersive variant: each outfit is its own scroll-scrubbed mini-film that
// settles on the full-outfit stage image, where the process page opens.
function OutfitFilm({ outfit }) {
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
        `/cinematic/outfits/${outfit.slug}/${PORTRAIT ? 'p/' : ''}frame-${String(i + 1).padStart(4, '0')}.jpg`
      }
      trackVh={PORTRAIT ? 420 : 280}
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
  const lastYRef = useRef(0);
  const [scrolled, setScrolled] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  useEffect(() => {
    // stop the browser's async scroll restoration from racing our reset —
    // it re-applies a stale offset once the 700vh track has laid out.
    const prevRestoration = history.scrollRestoration;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      // gone once the hero is left behind; back the moment the user scrolls up
      setNavHidden(y > window.innerHeight && y > lastYRef.current);
      lastYRef.current = y;
    };
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
          <h1>
            Splendor <em>Animae</em>
          </h1>
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
            <p className="sa-eyebrow">La Collezione</p>
            <p className="sa-film-intro-copy">
              Splendor Animae esplora la tensione tra fragilità e potere. Pizzo
              distrutto, silhouette fratturate, forme velate e movimento
              scultoreo creano una collezione sospesa tra rituale, memoria e
              trasformazione.
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
            <h2>Pizzo Distrutto</h2>
            <p className="sa-film-caption">Pizzo distrutto a mano, poi ricostruito come ornamento.</p>
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
            <h2>Identità Velata</h2>
            <p className="sa-film-caption">Il volto ritirato dietro un orizzonte di pizzo.</p>
          </>
        ),
      },
      {
        id: 'movement',
        decorative: true,
        start: 0.64,
        end: 0.715,
        content: (
          <>
            <span className="sa-index">03</span>
            <h2>Movimento d’Ombra</h2>
            <p className="sa-film-caption">Silhouette che si dissolvono prima di rivelarsi.</p>
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
            <h2>Struttura Traforata</h2>
            <p className="sa-film-caption">Vuoti resi struttura — l’assenza che regge la cucitura.</p>
          </>
        ),
      },
      {
        id: 'deconstructed',
        decorative: true,
        start: 0.725,
        end: 0.785,
        content: (
          <>
            <span className="sa-index">05</span>
            <h2>Eleganza Decostruita</h2>
            <p className="sa-film-caption">La formalità scomposta e indossata come memoria.</p>
          </>
        ),
      },
      {
        id: 'logo',
        decorative: true,
        start: 0.86,
        end: 1.1,
        className: 'sa-film-chapter--center',
        content: (
          <>
            <img className="sa-film-logo-mark" src="/assets/logo.png" alt="Sartoriapieri" />
            <span className="sa-film-logo-rule" aria-hidden="true" />
            <span className="sa-film-logo-sub">Splendor Animae — FW26</span>
          </>
        ),
      },
    ],
     
    []
  );

  return (
    <MotionConfig reducedMotion="user">
    <div className="sa-root" lang="it">
      <nav className={`sa-nav ${scrolled ? 'is-scrolled' : ''} ${navHidden ? 'is-hidden' : ''}`}>
        <Link to="/" className="sa-nav-mark" aria-label="Sartoriapieri">
          <img className="sa-logo sa-logo--nav" src="/assets/logo.png" alt="Sartoriapieri" />
        </Link>
        <div className="sa-nav-links">
          <button type="button" onClick={() => scrollToFilm(0)}>
            Film
          </button>
          <button type="button" onClick={() => scrollTo('#sa-lookbook', 3)}>
            Lookbook
          </button>
          <button type="button" onClick={() => scrollTo('#sa-archivio', 3)}>
            Archivio
          </button>
        </div>
      </nav>

      {/* ── The film: scroll-scrubbed frame sequence ── */}
      <ScrollFilm
        chapters={chapters}
        frameCount={275}
        framePath={heroFramePath}
        trackVh={PORTRAIT ? 850 : 700}
        startImage={PORTRAIT ? '/cinematic/frames/m/frame-0001.jpg' : null}
        endImage="/cinematic/endcard-order.jpg"
        endStart={0.78}
        endFadeSpan={0.07}
        bookendFit={PORTRAIT ? 'contain' : 'cover'}
        showLoader
        hint
        ariaLabel="Splendor Animae — il film"
      />

      {/* static narrative for screen readers — the visual chapters above are
          scroll-gated and marked decorative */}
      <div className="sa-sr-only">
        <h2>La Collezione</h2>
        <p>
          Splendor Animae esplora la tensione tra fragilità e potere. Pizzo
          distrutto, silhouette fratturate, forme velate e movimento scultoreo
          creano una collezione sospesa tra rituale, memoria e trasformazione.
        </p>
        <p>Pizzo Distrutto — pizzo distrutto a mano, poi ricostruito come ornamento.</p>
        <p>Identità Velata — il volto ritirato dietro un orizzonte di pizzo.</p>
        <p>Movimento d’Ombra — silhouette che si dissolvono prima di rivelarsi.</p>
        <p>Struttura Traforata — vuoti resi struttura, l’assenza che regge la cucitura.</p>
        <p>Eleganza Decostruita — la formalità scomposta e indossata come memoria.</p>
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
          <OutfitFilm key={outfit.slug} outfit={outfit} />
        ))}
      </div>

      {/* ── L'archivio: focus rail ── */}
      <section className="sa-archive" id="sa-archivio">
        <Motion.div
          className="sa-section-head"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-15% 0px' }}
        >
          <p className="sa-eyebrow">L'Archivio</p>
          <h2 lang="it">La collezione, da vicino</h2>
        </Motion.div>
        <FocusRail items={ARCHIVE_ITEMS} autoPlay loop interval={4500} />
      </section>

      <footer className="sa-footer">
        <img className="sa-logo sa-logo--footer" src="/assets/logo.png" alt="Sartoriapieri" />
        <span>Splendor Animae — FW26</span>
        <span>© 2026</span>
      </footer>
    </div>
    </MotionConfig>
  );
}
