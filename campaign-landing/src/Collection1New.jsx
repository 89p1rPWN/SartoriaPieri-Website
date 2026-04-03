import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import './Collection1New.css';

gsap.registerPlugin(ScrollTrigger);

const outfits = [
  {
    src: '/outfits/vergogna/vergogna_nobg.png',
    accordionImg: '/outfits/vergogna/vergogna_main.jpg',
    name: 'VERGOGNA',
    emotion: 'Il peso di ciò che nascondiamo sotto la superficie.',
    photos: ['/outfits/vergogna/1.jpg', '/outfits/vergogna/8.jpg'],
    processImages: ['/outfits/vergogna/1.jpg', '/outfits/vergogna/3.jpg', '/outfits/vergogna/4.jpg', '/outfits/vergogna/8.jpg', '/outfits/vergogna/7.jpg'],
    process: [
      { text: 'Essa emerge come inevitabile <underline>conseguenza</underline> del viaggio perverso.' },
      { text: 'Incarnata in un abito costruito con <underline>sottostruttura</underline> e crinolina, esalta le curve e amplifica la sensazione di <arrow>soffocamento e costrizione</arrow>.' },
      { text: 'Le cinture, disposte in vita, al ginocchio e lungo il taglio del fondo, accentuano la <underline>tensione</underline>.' },
      { text: 'Un <underline>drappeggio</underline> di organza soffocante avvolge il corpo, cancellando i connotati e trasmettendo l\'angoscia del nascondimento.' },
      { text: 'Il <circle>patchwork</circle> ritorna come <underline>frammentazione</underline> dell\'essere e testimonianza di vulnerabilità.' },
    ],
  },
  {
    src: '/outfits/dolore/dolore_nobg.png',
    accordionImg: '/outfits/dolore/dolore_main.jpg',
    name: 'DOLORE',
    emotion: 'Il compagno inevitabile. Il dolore indossato apertamente.',
    photos: ['/outfits/dolore/2.jpg', '/outfits/dolore/5.jpg'],
    processImages: ['/outfits/dolore/dolore_main.jpg', '/outfits/dolore/3.jpg', '/outfits/dolore/4.jpg', '/outfits/dolore/6.jpg', '/outfits/dolore/5.jpg'],
    process: [
      { text: 'Il dolore è inevitabile, perché <underline>accompagna</underline> sempre la vergogna: per questo ne condivide il tessuto. <italic>Sento tensione.</italic>' },
      { text: 'L\'abito è costruito con una <underline>mantella</underline> a <circle>collo alto</circle> che stringe il corpo e lo soffoca lievemente.' },
      { text: 'La <underline>gonna</underline>, sostenuta da una <underline>sottostruttura in crinolina</underline>, assume una forma trapezoidale, in contrasto con le linee morbide della mantella.' },
      { text: 'Il <underline>ricamo</underline> è ispirato alle <underline>lacrime</underline> e si alterna a <arrow>mani cucite</arrow> che stringono il tessuto: il dolore prende forma in molteplici volti.' },
      { text: 'L\'outfit porta con sé un\'<underline>anima pesante</underline>, e pesante appare allo sguardo, come il dolore stesso.' },
    ],
  },
  {
    src: '/outfits/depravazione/1_nobg.png',
    accordionImg: '/outfits/depravazione/3.jpg',
    name: 'DEPRAVAZIONE',
    emotion: 'L\'esposizione cruda. Il lusso di non avere più nulla da perdere.',
    photos: ['/outfits/depravazione/1.jpg', '/outfits/depravazione/3.jpg'],
    processImages: ['/outfits/depravazione/3.jpg', '/outfits/depravazione/5.jpg', '/outfits/depravazione/2.jpg', '/outfits/depravazione/6.jpg', '/outfits/depravazione/4.jpg'],
    process: [
      { text: 'L\'idea nasce dal desiderio di rappresentare l\'istinto più <underline>immorale</underline>, ciò che va oltre <circle>il gradino</circle>.' },
      { text: 'La perversione prende qui una <underline>forma selvaggia</underline>, dove ogni regola viene eliminata.' },
      { text: 'Il pizzo lascia spazio alla sua manifestazione più viscerale e intima: <circle>le mutande</circle>.' },
      { text: 'L\'outfit è un drappeggio composto da <underline>slip</underline>. L\'obiettivo era tradurre a livello modellistico ciò che era già stato esplorato nella sirena con collo alto, in una visione più cruda e disinibita.' },
      { text: 'La corona di spine rappresenta la <underline>sofferenza</underline> legata alla perdita del controllo, con le mutande sbrindellete che si insinuano tra le punte come simbolo di caos e <underline>trasgressione</underline>.' },
    ],
  },
  {
    src: '/outfits/perversione/2_nobg.png',
    accordionImg: '/outfits/perversione/2.jpg',
    name: 'PERVERSIONE',
    emotion: 'La bellezza distorta fino a diventare altro.',
    photos: ['/outfits/perversione/2.jpg', '/outfits/perversione/4.jpg'],
    processImages: ['/outfits/perversione/2.jpg', '/outfits/perversione/1.jpg', '/outfits/perversione/9.jpg', '/outfits/perversione/7.jpg', '/outfits/perversione/4.jpg'],
    process: [
      { text: 'La perversione non è altro che il nostro <underline>stigma proferito</underline>. Come rappresentarla? <circle>Il pizzo</circle> è stato il punto di partenza, simbolo di eccellenza nel campo sensuale.' },
      { text: 'Il cartamodello è una sirena con collare. I <underline>punti erogeni</underline> vengono esposti attraverso un taglio sul centro dietro, che lascia intravedere schiena e glutei.' },
      { text: 'Per il collo, un tessuto luminoso dona movimento. Per il seno e la vulva, <underline>fiori ricamati</underline> con Swarovski si uniscono a strass, paillettes.' },
      { text: 'Il cappello segna la fine della gabbia e l\'inizio della rivelazione, ispirato all\'eleganza dei cappelli dei <underline>samurai</underline> giapponesi.' },
      { text: 'Un <arrow>vedo/non vedo</arrow> elegante e misterioso, che completa l\'outfit.' },
    ],
  },
  {
    src: '/outfits/trauma/3_nobg.png',
    accordionImg: '/outfits/trauma/3.jpg',
    name: 'TRAUMA',
    emotion: 'La frattura. Il prima, il durante, il dopo.',
    photos: ['/outfits/trauma/1.jpg', '/outfits/trauma/9.jpg', '/outfits/trauma/10.jpg'],
    processImages: ['/outfits/trauma/3.jpg', '/outfits/trauma/5.jpg', '/outfits/trauma/8.jpg', '/outfits/trauma/4.jpg', '/outfits/trauma/9.jpg'],
    process: [
      { text: 'Ho immaginato il trauma come una <circle>ferita</circle> che non si rimargina, ma che, se accettata, risplende grazie al <underline>ricamo</underline>.' },
      { text: 'Il corpino è <underline>inciso</underline> sulla punta sinistra: un\'<underline>asimmetria</underline> che diventa <underline>armonia</underline>. <italic>Taglio.</italic>' },
      { text: 'La gonna riprende il <underline>cartamodello</underline> dell\'Abisso, ma porta con sé un taglio che si chiude in una <underline>mezzaruota di pelliccia</underline>.' },
      { text: 'Il cappello è un\'<underline>evoluzione</underline>: diverso nella forma, più <underline>corto</underline> nel velo, svela il mistero invece di nasconderlo. L\'organza cangiante, <underline>bruciata</underline> e <underline>sbrandellata</underline>, segna l\'inizio della rivelazione.' },
      { text: 'Affrontando il primo stigma, la <circle>gabbia</circle> inizia a <circle>cedere</circle>. <italic>Taglio come corpino!!</italic>' },
    ],
  },
];

// Parse process text to render animated annotations
function ProcessText({ text }) {
  const parts = text.split(/(<circle>.*?<\/circle>|<arrow>.*?<\/arrow>|<underline>.*?<\/underline>|<italic>.*?<\/italic>)/g);
  return (
    <p className="c1n-process-text">
      {parts.map((part, i) => {
        if (part.startsWith('<circle>')) {
          const word = part.replace(/<\/?circle>/g, '');
          return (
            <span key={i} className="c1n-anno-circle">
              {word}
              <svg className="c1n-circle-svg" viewBox="0 0 120 50" preserveAspectRatio="none">
                <ellipse cx="60" cy="25" rx="56" ry="21" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
          );
        }
        if (part.startsWith('<arrow>')) {
          const word = part.replace(/<\/?arrow>/g, '');
          return <span key={i} className="c1n-anno-arrow">{word}<svg className="c1n-arrow-svg" viewBox="0 0 60 20"><path d="M0 10 Q15 2 30 10 Q45 18 60 10" fill="none" stroke="currentColor" strokeWidth="1.5" /><polygon points="55,6 60,10 55,14" fill="currentColor" /></svg></span>;
        }
        if (part.startsWith('<underline>')) {
          const word = part.replace(/<\/?underline>/g, '');
          return <span key={i} className="c1n-anno-underline">{word}</span>;
        }
        if (part.startsWith('<italic>')) {
          const word = part.replace(/<\/?italic>/g, '');
          return <em key={i} className="c1n-anno-italic">{word}</em>;
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

export default function Collection1New() {
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const lenisRef = useRef(null);
  const accordionRowRef = useRef(null);
  const [activeAccordion, setActiveAccordion] = useState(-1);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const handleCarouselScroll = useCallback(() => {
    const row = accordionRowRef.current;
    if (!row) return;
    const scrollLeft = row.scrollLeft;
    const cardWidth = row.firstElementChild?.offsetWidth || 1;
    const gap = row.firstElementChild?.offsetLeft || 0;
    const index = Math.round(scrollLeft / (cardWidth + gap * 0.5));
    setCarouselIndex(Math.min(index, outfits.length - 1));
  }, []);


  useEffect(() => {
    window.scrollTo(0, 0);

    const lenis = new Lenis({
      duration: 1.8, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true, wheelMultiplier: 0.8,
    });
    lenisRef.current = lenis;
    let rafId;
    function raf(time) { lenis.raf(time); ScrollTrigger.update(); rafId = requestAnimationFrame(raf); }
    rafId = requestAnimationFrame(raf);

    // ── ENTRANCE — harsh, depressive ──
    const heroTl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    // Long suffocating black — 2s of nothing
    heroTl.to('.c1n-curtain', { duration: 2 });

    // Title appears BEHIND the curtain — barely visible, like something trapped
    heroTl.fromTo('.c1n-hero-title',
      { opacity: 0 },
      { opacity: 0.08, duration: 0.8, ease: 'none' }, 1.2);

    // Curtain doesn't lift — it cracks. Opacity drops in harsh steps
    heroTl.to('.c1n-curtain', { opacity: 0.7, duration: 0.1 }, 2.0);
    heroTl.to('.c1n-curtain', { opacity: 0.85, duration: 0.15 }, 2.1); // flickers back
    heroTl.to('.c1n-curtain', { opacity: 0.4, duration: 0.2 }, 2.3);
    heroTl.to('.c1n-curtain', { opacity: 0.6, duration: 0.1 }, 2.5); // resists
    heroTl.to('.c1n-curtain', { opacity: 0.15, duration: 0.4 }, 2.7);
    heroTl.to('.c1n-curtain', { opacity: 0, duration: 1.5, ease: 'power1.out' }, 3.2);

    // Title — was ghosting behind curtain, now settles heavy
    heroTl.to('.c1n-hero-title', {
      opacity: 1, duration: 1.5, ease: 'power1.out'
    }, 3.0);
    // Slight downward sag — like weight pressing down
    heroTl.fromTo('.c1n-hero-title',
      { y: -8 },
      { y: 4, duration: 3, ease: 'power1.out' }, 3.0);

    // Red line — seeps out slowly, like blood through fabric
    heroTl.fromTo('.c1n-hero-line',
      { scaleX: 0, opacity: 0 },
      { scaleX: 1, opacity: 1, duration: 3, ease: 'power1.inOut' }, 3.5);

    // Tagline — fades in painfully slow, letter-spacing compresses like lungs deflating
    heroTl.fromTo('.c1n-hero-tagline',
      { opacity: 0, letterSpacing: '1em', filter: 'blur(2px)' },
      { opacity: 0.3, letterSpacing: '0.08em', filter: 'blur(0px)', duration: 4, ease: 'power1.out' }, 4.0);

    // Background text — emerges from deep like a memory surfacing
    heroTl.fromTo('.c1n-hero-bg-text',
      { opacity: 0, scale: 8, filter: 'blur(80px)' },
      { opacity: 0.025, scale: 1, filter: 'blur(0px)', duration: 5, ease: 'power1.out' }, 2.5);

    // Nav — last thing, almost forgotten
    heroTl.fromTo('.c1n-nav',
      { opacity: 0 }, { opacity: 1, duration: 2 }, 6);

    // Scroll indicator — appears reluctantly
    heroTl.fromTo('.c1n-hero-scroll',
      { opacity: 0 }, { opacity: 0.5, duration: 2.5, ease: 'power1.out' }, 6.5);

    // ── HERO SCROLL EXIT — dramatic pull-back ──
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

    // ── ACCORDION SCROLL REVEAL ──
    gsap.fromTo('.c1n-accordion-section',
      { opacity: 0, y: 60 },
      {
        scrollTrigger: { trigger: '.c1n-accordion-section', start: 'top 88%', toggleActions: 'play none none reverse' },
        opacity: 1, y: 0, duration: 1.5, ease: 'expo.out'
      }
    );

    // ── EACH OUTFIT ──
    outfits.forEach((_, i) => {
      const s = `.c1n-outfit-${i}`;

      // Image — dramatic clip reveal with counter-zoom
      gsap.fromTo(`${s} .c1n-outfit-img-wrap`,
        { clipPath: 'inset(100% 0% 0% 0%)' },
        {
          scrollTrigger: { trigger: s, start: 'top 85%', end: 'top 40%', scrub: 0.5 },
          clipPath: 'inset(0% 0% 0% 0%)',
        }
      );
      gsap.fromTo(`${s} .c1n-outfit-img`,
        { scale: 1.4, filter: 'brightness(0.3)' },
        {
          scrollTrigger: { trigger: s, start: 'top 85%', end: 'top 30%', scrub: 0.5 },
          scale: 1, filter: 'brightness(1) contrast(1.1)',
        }
      );

      // Deep parallax on image
      gsap.to(`${s} .c1n-outfit-img`, {
        scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
        yPercent: -25, ease: 'none',
      });

      // Name — slides in from far with rotation
      gsap.fromTo(`${s} .c1n-outfit-name`,
        { opacity: 0, x: i % 2 === 0 ? -200 : 200, skewX: i % 2 === 0 ? 5 : -5, filter: 'blur(15px)' },
        {
          scrollTrigger: { trigger: s, start: 'top 70%', toggleActions: 'play none none reverse' },
          opacity: 1, x: 0, skewX: 0, filter: 'blur(0px)', duration: 2, ease: 'expo.out'
        }
      );

      // Emotion — typewriter-like fade
      gsap.fromTo(`${s} .c1n-outfit-emotion`,
        { opacity: 0, y: 40, filter: 'blur(5px)' },
        {
          scrollTrigger: { trigger: s, start: 'top 65%', toggleActions: 'play none none reverse' },
          opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.8, ease: 'power3.out', delay: 0.3
        }
      );

      // Red line — draws like a wound
      gsap.fromTo(`${s} .c1n-outfit-line`,
        { scaleX: 0, opacity: 0 },
        {
          scrollTrigger: { trigger: s, start: 'top 68%', toggleActions: 'play none none reverse' },
          scaleX: 1, opacity: 1, duration: 1.8, ease: 'power2.out', delay: 0.15
        }
      );

      // Number — deep slow parallax
      gsap.to(`${s} .c1n-outfit-number`, {
        scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: 1.5 },
        yPercent: -120, ease: 'none',
      });

      // Outfit section exit — push back on scroll out
      gsap.to(`${s} .c1n-outfit-text`, {
        scrollTrigger: { trigger: s, start: '70% top', end: 'bottom top', scrub: 0.8 },
        y: -80, opacity: 0, filter: 'blur(8px)',
      });

      // ── SOVRAIMPRESSION OVERLAY ──
      const track = `${s} .c1n-sovra-track`;
      const overlay = `${s} .c1n-sovra`;
      const imgs = gsap.utils.toArray(`${s} .c1n-sovra-img`);
      const blocks = gsap.utils.toArray(`${s} .c1n-process-block`);
      const totalSteps = Math.max(imgs.length, blocks.length);

      ScrollTrigger.create({
        trigger: track, start: 'top top', end: 'bottom bottom',
        pin: overlay, pinSpacing: false,
      });

      const sovraTl = gsap.timeline({
        scrollTrigger: {
          trigger: track, start: 'top top', end: 'bottom bottom', scrub: 0.8,
        },
      });

      // Overlay fades in with backdrop blur feel
      sovraTl.fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 });

      for (let j = 0; j < totalSteps; j++) {
        const stepDur = 0.78 / totalSteps;
        const fadeTime = stepDur * 0.2;
        const holdTime = stepDur - fadeTime * 2;

        // Image enters with scale + slight rotation
        if (imgs[j]) sovraTl.fromTo(imgs[j],
          { autoAlpha: 0, scale: 1.15, rotateZ: j % 2 === 0 ? 1 : -1 },
          { autoAlpha: 1, scale: 1, rotateZ: 0, duration: fadeTime },
          `s${j}`
        );

        // Text slides up
        if (blocks[j]) {
          const block = blocks[j];
          sovraTl.fromTo(block,
            { autoAlpha: 0, y: 50, filter: 'blur(4px)' },
            { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: fadeTime,
              onStart: () => { block.classList.add('is-visible'); block.querySelectorAll('.c1n-anno-circle').forEach(el => el.classList.add('is-visible')); },
            },
            `s${j}`
          );
        }

        sovraTl.to({}, { duration: holdTime });

        // Exit with opposite direction
        if (j < totalSteps - 1) {
          if (imgs[j]) sovraTl.to(imgs[j], { autoAlpha: 0, scale: 0.95, duration: fadeTime });
          if (blocks[j]) {
            const block = blocks[j];
            sovraTl.to(block, {
              autoAlpha: 0, y: -30, filter: 'blur(3px)', duration: fadeTime,
              onComplete: () => { block.classList.remove('is-visible'); block.querySelectorAll('.c1n-anno-circle').forEach(el => el.classList.remove('is-visible')); },
            });
          }
        }
      }

      sovraTl.to(overlay, { autoAlpha: 0, duration: 0.1 });
    });

    // ── CLOSING — slow dramatic reveal ──
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

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div className="c1n-root" ref={containerRef}>
      <div className="c1n-curtain" />

      <nav className="c1n-nav">
        <Link to="/" className="c1n-logo">SARTORIAPIERI</Link>
        <div className="c1n-nav-right">
          <span className="c1n-nav-label">SPLENDOR ANIMAE</span>
          <Link to="/" className="c1n-nav-back">HOME</Link>
        </div>
      </nav>

      <section className="c1n-hero" ref={heroRef}>
        <video className="c1n-hero-video" src="/hero-video.mp4" autoPlay loop muted playsInline />
        <div className="c1n-hero-overlay" />
        <div className="c1n-hero-bg-text">PIERI</div>
        <div className="c1n-hero-inner">
          <h1 className="c1n-hero-title">SPLENDOR ANIMAE</h1>
          <div className="c1n-hero-line" />
          <p className="c1n-hero-tagline">What lives inside you has always been wearing you.</p>
        </div>
        <div className="c1n-hero-scroll"><div className="c1n-scroll-line" /><span>SCROLL</span></div>
      </section>

      {/* ── FIVE EMOTIONS ACCORDION ── */}
      <section className="c1n-accordion-section">
        <div className="c1n-accordion-header">
          <span className="c1n-accordion-label">THE COLLECTION</span>
          <h2 className="c1n-accordion-title">Five Emotions</h2>
        </div>
        <div className="c1n-carousel-wrap">
          <div className="c1n-accordion-row" ref={accordionRowRef} onMouseLeave={() => setActiveAccordion(-1)} onScroll={handleCarouselScroll}>
            {outfits.map((outfit, i) => (
              <div
                key={`acc-${i}`}
                className={`c1n-accordion-card ${activeAccordion === i ? 'c1n-accordion-active' : activeAccordion === -1 ? 'c1n-accordion-idle' : 'c1n-accordion-collapsed'}`}
                onMouseEnter={() => setActiveAccordion(i)}
                onClick={() => setActiveAccordion(activeAccordion === i ? -1 : i)}
              >
                <div className="c1n-accordion-bg">
                  <img src={outfit.accordionImg} alt={outfit.name} />
                </div>
                <div className="c1n-accordion-overlay" />
                <span className="c1n-accordion-num">{String(i + 1).padStart(2, '0')}</span>
                <div className="c1n-accordion-content">
                  <h3 className="c1n-accordion-name">{outfit.name.charAt(0) + outfit.name.slice(1).toLowerCase()}</h3>
                  <p className="c1n-accordion-desc">{outfit.emotion}</p>
                </div>
                <span className="c1n-accordion-vertical-name">{outfit.name}</span>
              </div>
            ))}
          </div>
          <div className={`c1n-swipe-hint ${carouselIndex > 0 ? 'hidden' : ''}`}>
            <div className="c1n-swipe-trail" />
            <div className="c1n-swipe-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 11V6a2 2 0 0 0-4 0v5" /><path d="M14 10V4a2 2 0 0 0-4 0v7" /><path d="M10 10.5V8a2 2 0 0 0-4 0v8a8 8 0 0 0 16 0v-3a2 2 0 0 0-4 0" />
              </svg>
            </div>
            <span className="c1n-swipe-label">SLIDE</span>
          </div>
        </div>
        <div className="c1n-carousel-track">
          <div className="c1n-carousel-bar">
            <div className="c1n-carousel-fill" style={{ width: `${((carouselIndex + 1) / outfits.length) * 100}%` }} />
          </div>
        </div>
      </section>

      {outfits.map((outfit, i) => (
        <section key={i} className={`c1n-outfit c1n-outfit-${i} ${i % 2 === 1 ? 'c1n-outfit-reverse' : ''}`}>
          <div className="c1n-outfit-number">{String(i + 1).padStart(2, '0')}</div>

          <div className="c1n-outfit-img-wrap">
            <img src={outfit.src} alt={outfit.name} className="c1n-outfit-img" />
          </div>

          <div className="c1n-outfit-text">
            <h2 className="c1n-outfit-name">{outfit.name}</h2>
            <div className="c1n-outfit-line" />
            <p className="c1n-outfit-emotion">{outfit.emotion}</p>
          </div>

          {/* ── SOVRAIMPRESSION — scroll-driven dark overlay ── */}
          <div className="c1n-sovra-track">
            <div className="c1n-sovra">
              <div className="c1n-sovra-inner">
                {/* Left: process images, one at a time */}
                <div className="c1n-sovra-visual">
                  {outfit.processImages.map((src, j) => (
                    <img key={j} src={src} alt={`Process ${j + 1}`} className="c1n-sovra-img" />
                  ))}
                </div>

                {/* Right: animated process text */}
                <div className="c1n-sovra-content">
                  <div className="c1n-sovra-header">
                    <span className="c1n-sovra-num">LOOK {String(i + 1).padStart(2, '0')}</span>
                    <h3 className="c1n-sovra-title">{outfit.name}</h3>
                    <span className="c1n-sovra-subtitle">IL PROCESSO CREATIVO</span>
                  </div>

                  {outfit.process.map((step, j) => (
                    <div key={j} className="c1n-process-block">
                      <ProcessText text={step.text} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

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
