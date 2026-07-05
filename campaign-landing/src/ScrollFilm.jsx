import { useEffect, useRef, useState } from 'react';
import './ScrollFilm.css';

const CONCURRENCY = 6; // browsers cap at 6 connections per origin on HTTP/1.1
const MAX_RETRIES = 2;
const READY_WATCHDOG_MS = 12000;
const DECODE_AHEAD = 16;
const DECODE_BEHIND = 6;
const FOCAL_Y = 0.42;
const MAX_DPR = 2;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/**
 * Scroll-scrubbed frame-sequence film.
 * A tall scroll track drives a pinned full-viewport canvas: scroll progress
 * maps linearly to a frame index (lerp-smoothed), each rAF tick draws the
 * current frame cover-fit. Scrolling down plays the film, up plays it back.
 * Chapters are overlay nodes faded in/out by progress range; `decorative`
 * chapters are aria-hidden (provide an sr-only narrative alongside).
 *
 * Props:
 *  - chapters: [{ id, start, end, className?, decorative?, content }]
 *  - frameCount, framePath(i): the sequence
 *  - trackVh: scroll track height (default 700)
 *  - startImage: image covering the canvas at rest, dissolving as the scrub
 *    begins (the film "wakes" out of it)
 *  - endImage / endStart: image crossfaded over the canvas in the track's
 *    final stretch — the film "settles" on it
 *  - lazy: defer frame loading until the track approaches the viewport
 *  - showLoader: full-screen loading card gated on keyframes (the hero);
 *    when false the film reveals on its first loaded frame
 *  - hint: the "scroll to enter" invitation over the opening frame
 *  - fit: 'cover' fills the stage (cropping); 'width' letterboxes the full
 *    frame width — the cinema-strip look for landscape film on portrait
 *  - bookendFit: 'contain' letterboxes the start/end images over a blurred
 *    ambient fill (full lineup visible) even while the film itself covers
 */
export default function ScrollFilm({
  chapters,
  frameCount,
  framePath,
  trackVh = 700,
  startImage = null,
  endImage = null,
  endStart = 0.74,
  lazy = false,
  showLoader = true,
  hint = false,
  fit = 'cover',
  bookendFit = 'cover',
  className = '',
  ariaLabel = 'Film',
}) {
  const trackRef = useRef(null);
  const canvasRef = useRef(null);
  const chapterRefs = useRef([]);
  const barRef = useRef(null);
  const hintRef = useRef(null);
  const startRef = useRef(null);
  const endRef = useRef(null);
  const loaderLineRef = useRef(null);
  const loaderPctRef = useRef(null);
  const framePathRef = useRef(framePath);
  const [ready, setReady] = useState(false);

  // keep the latest framePath without making it an effect dependency —
  // callers pass inline closures whose identity changes every render
  useEffect(() => {
    framePathRef.current = framePath;
  });

  useEffect(() => {
    const track = trackRef.current;
    const canvas = canvasRef.current;
    if (!track || !canvas) return;

    const stage = canvas.parentElement;
    const ctx = canvas.getContext('2d', { alpha: false });
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const keyStride = Math.max(6, Math.round(frameCount / 12));
    const midStride = Math.max(2, Math.round(keyStride / 4));

    const images = new Array(frameCount);
    const loaded = new Uint8Array(frameCount);
    const attempts = new Uint8Array(frameCount);
    const decodeRequested = new Uint8Array(frameCount);
    let disposed = false;
    let revealed = false;

    const reveal = () => {
      if (revealed || disposed) return;
      revealed = true;
      setReady(true);
    };

    /* ── progressive loader: keyframes → mid pass → every frame ── */
    const keySet = new Set();
    for (let i = 0; i < frameCount; i += keyStride) keySet.add(i);
    keySet.add(frameCount - 1);

    const order = [];
    const queued = new Set();
    const enqueue = (i) => {
      if (!queued.has(i)) {
        queued.add(i);
        order.push(i);
      }
    };
    keySet.forEach(enqueue);
    for (let i = 0; i < frameCount; i += midStride) enqueue(i);
    for (let i = 0; i < frameCount; i += 1) enqueue(i);

    let cursor = 0;
    let inflight = 0;
    let keyLoaded = 0;
    let loadStarted = false;
    let watchdog = null;

    const onFrameLoaded = (i) => {
      if (!showLoader) {
        reveal(); // first frame is enough to fade the canvas in
      }
      if (!keySet.has(i)) return;
      keyLoaded += 1;
      const pct = keyLoaded / keySet.size;
      if (loaderLineRef.current) {
        loaderLineRef.current.style.transform = `scaleX(${pct})`;
      }
      if (loaderPctRef.current) {
        loaderPctRef.current.textContent = `${Math.round(pct * 100)}%`;
      }
      if (keyLoaded >= keySet.size) reveal();
    };

    const pump = () => {
      if (disposed) return;
      if (cursor >= order.length) {
        // queue drained: if some keyframes failed for good, reveal anyway —
        // the loop renders nearest-loaded neighbours.
        if (inflight === 0) reveal();
        return;
      }
      const i = order[cursor];
      cursor += 1;
      inflight += 1;
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        inflight -= 1;
        images[i] = img;
        loaded[i] = 1;
        if (!disposed) {
          onFrameLoaded(i);
          pump();
        }
      };
      img.onerror = () => {
        inflight -= 1;
        if (disposed) return;
        if (attempts[i] < MAX_RETRIES) {
          attempts[i] += 1;
          order.push(i); // retry after the rest of the queue
        }
        pump();
      };
      img.src = framePathRef.current(i);
    };

    const startLoading = () => {
      if (loadStarted || disposed) return;
      loadStarted = true;
      for (let c = 0; c < CONCURRENCY; c += 1) pump();
      // never leave the visitor behind an opaque loader: reveal after a
      // deadline even if keyframes are still missing.
      watchdog = setTimeout(reveal, READY_WATCHDOG_MS);
    };
    if (!lazy) startLoading();

    /* ── canvas sizing (from the stage box, NOT the window: the stage is
       100lvh, which differs from innerHeight while a mobile URL bar is
       expanded — window-based sizing distorts the frames) ── */
    let cw = 0;
    let ch = 0;
    let needsRedraw = true;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const w = Math.round(stage.clientWidth * dpr);
      const h = Math.round(stage.clientHeight * dpr);
      if (w === cw && h === ch) return;
      cw = w;
      ch = h;
      canvas.width = cw;
      canvas.height = ch;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      needsRedraw = true;
    };
    resize();
    window.addEventListener('resize', resize);

    /* ── idle gating: skip all per-frame work while the track is offscreen;
       for lazy films the same observer starts the frame downloads early ── */
    let inView = true;
    let snapOnResume = false;
    const io = new IntersectionObserver(
      (entries) => {
        inView = entries[0].isIntersecting;
        if (inView) {
          startLoading();
          needsRedraw = true;
          snapOnResume = true;
        }
      },
      { rootMargin: lazy ? '90% 0px' : '120px 0px' }
    );
    io.observe(track);

    /* ── scrub state ── */
    const progress = () => {
      const max = track.offsetHeight - stage.offsetHeight;
      if (max <= 0) return 0;
      return clamp(-track.getBoundingClientRect().top / max, 0, 1);
    };

    const nearestLoaded = (idx) => {
      if (loaded[idx]) return idx;
      for (let d = 1; d < frameCount; d += 1) {
        if (idx - d >= 0 && loaded[idx - d]) return idx - d;
        if (idx + d < frameCount && loaded[idx + d]) return idx + d;
      }
      return -1;
    };

    const drawFrame = (idx) => {
      const img = images[idx];
      if (!img) return;
      if (fit === 'width') {
        // full frame width, vertically centered; a blurred cover pass fills
        // the rest of the screen so the stage never feels letterbox-empty
        const scale = cw / img.naturalWidth;
        const dh = img.naturalHeight * scale;
        if ('filter' in ctx) {
          const cs = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
          const cwid = img.naturalWidth * cs;
          const chei = img.naturalHeight * cs;
          ctx.filter = 'blur(22px) brightness(0.5)';
          ctx.drawImage(img, (cw - cwid) / 2, (ch - chei) / 2, cwid, chei);
          ctx.filter = 'none';
        } else {
          ctx.fillStyle = '#050505';
          ctx.fillRect(0, 0, cw, ch);
        }
        ctx.drawImage(img, 0, (ch - dh) / 2, cw, dh);
        return;
      }
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) * FOCAL_Y, dw, dh);
    };

    // ask the browser to decode upcoming frames off the hot path, so
    // drawImage rarely hits a synchronous JPEG decode mid-scrub.
    const decodeAhead = (idx) => {
      for (let j = idx - DECODE_BEHIND; j <= idx + DECODE_AHEAD; j += 1) {
        if (j < 0 || j >= frameCount) continue;
        if (loaded[j] && !decodeRequested[j]) {
          decodeRequested[j] = 1;
          images[j].decode().catch(() => {
            decodeRequested[j] = 0;
          });
        }
      }
    };

    const lastOpacity = new Float32Array(chapters.length).fill(-1);
    const fadeChapter = (el, chapter, p, i) => {
      const { start, end } = chapter;
      const span = end - start;
      const fade = Math.min(0.045, span / 3);
      const fadeIn = start <= 0 ? 1 : clamp((p - start) / fade, 0, 1);
      const fadeOut = end >= 1 ? 1 : clamp((end - p) / fade, 0, 1);
      const o = Math.min(fadeIn, fadeOut);
      if (lastOpacity[i] >= 0 && Math.abs(o - lastOpacity[i]) < 0.002) return;
      lastOpacity[i] = o;
      const dir = p < (start + end) / 2 ? 1 : -1;
      el.style.opacity = o.toFixed(3);
      el.style.transform = reduceMotion
        ? 'none'
        : `translateY(${((1 - o) * 26 * dir).toFixed(1)}px)`;
      el.style.visibility = o <= 0.001 ? 'hidden' : 'visible';
      el.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
      if ('inert' in el) el.inert = o <= 0.5; // keep hidden buttons out of tab order
    };

    let current = 0;
    let lastDrawn = -1;
    let lastBar = -1;
    let lastEnd = -1;
    let lastStart = -1;
    let prevTime = performance.now();
    let rafId;

    const loop = (now) => {
      rafId = requestAnimationFrame(loop);
      const dt = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;

      if (!inView && !needsRedraw) return;

      const p = progress();
      const target = p * (frameCount - 1);
      if (reduceMotion || snapOnResume) {
        current = target;
        snapOnResume = false;
      } else {
        // softer time-based lerp: silkier scrub tail, ~150ms of follow
        current += (target - current) * (1 - Math.pow(0.01, dt));
        if (Math.abs(target - current) < 0.15) current = target;
      }

      const visualP = current / (frameCount - 1);
      const desired = Math.round(current);
      const idx = nearestLoaded(desired);
      if (idx >= 0 && (idx !== lastDrawn || needsRedraw)) {
        drawFrame(idx);
        lastDrawn = idx;
        needsRedraw = false;
      }
      decodeAhead(desired);

      // before the loader lifts, leave the overlays at their hidden CSS
      // defaults (they'd otherwise be focusable behind the opaque loader).
      if (revealed) {
        chapterRefs.current.forEach((el, i) => {
          if (el && chapters[i]) fadeChapter(el, chapters[i], visualP, i);
        });
      }
      if (barRef.current && Math.abs(visualP - lastBar) > 0.0005) {
        lastBar = visualP;
        barRef.current.style.transform = `scaleX(${visualP.toFixed(4)})`;
      }
      if (endRef.current) {
        // fade span never extends past the track end
        const endFade = Math.min(0.14, Math.max(0.02, 1 - endStart));
        const endO = clamp((visualP - endStart) / endFade, 0, 1);
        if (Math.abs(endO - lastEnd) > 0.002) {
          lastEnd = endO;
          endRef.current.style.opacity = endO.toFixed(3);
        }
      }
      if (startRef.current) {
        const startO = clamp(1 - visualP / 0.08, 0, 1);
        if (Math.abs(startO - lastStart) > 0.002) {
          lastStart = startO;
          startRef.current.style.opacity = startO.toFixed(3);
        }
      }
      if (hintRef.current) {
        // invitation over the black opening frame; dissolves as the scrub begins
        const hintO = revealed ? clamp(1 - visualP / 0.035, 0, 1) : 0;
        hintRef.current.style.opacity = hintO.toFixed(3);
        hintRef.current.style.visibility = hintO <= 0.001 ? 'hidden' : 'visible';
      }
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      if (watchdog) clearTimeout(watchdog);
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      io.disconnect();
    };
  }, [chapters, frameCount, trackVh, endImage, endStart, lazy, showLoader, fit]);

  return (
    <section
      className={`sa-film ${className}`}
      ref={trackRef}
      style={{ height: `${trackVh}vh` }}
      aria-label={ariaLabel}
    >
      <div className="sa-film-stage">
        <canvas
          ref={canvasRef}
          className={`sa-film-canvas ${ready ? 'is-ready' : ''}`}
          aria-hidden="true"
        />
        <div className="sa-film-vignette" aria-hidden="true" />

        {endImage && (
          <div
            className={`sa-film-end ${bookendFit === 'contain' ? 'sa-film-end--letterbox' : ''}`}
            ref={endRef}
            aria-hidden="true"
          >
            {bookendFit === 'contain' && (
              <img className="sa-film-end-bg" src={endImage} alt="" draggable={false} />
            )}
            <img src={endImage} alt="" draggable={false} />
          </div>
        )}

        {startImage && (
          <div
            className={`sa-film-start ${bookendFit === 'contain' ? 'sa-film-end--letterbox' : ''}`}
            ref={startRef}
            aria-hidden="true"
          >
            {bookendFit === 'contain' && (
              <img className="sa-film-end-bg" src={startImage} alt="" draggable={false} />
            )}
            <img src={startImage} alt="" draggable={false} />
          </div>
        )}

        {chapters.map((chapter, i) => (
          <div
            key={chapter.id}
            ref={(el) => {
              chapterRefs.current[i] = el;
            }}
            className={`sa-film-chapter ${chapter.className || ''}`}
            aria-hidden={chapter.decorative ? 'true' : undefined}
          >
            {chapter.content}
          </div>
        ))}

        {hint && (
          <div className="sa-film-hint" ref={hintRef} aria-hidden="true">
            <span className="sa-film-hint-label">
              Scorri per entrare nel mondo di Splendor Animae
            </span>
            <span className="sa-film-hint-line">
              <i />
            </span>
          </div>
        )}

        <div className="sa-film-progress" aria-hidden="true">
          <i ref={barRef} />
        </div>

        {showLoader && (
          <div
            className={`sa-film-loader ${ready ? 'is-done' : ''}`}
            role="status"
            aria-live="polite"
            aria-hidden={ready}
          >
            <img
              className="sa-film-loader-mark-img"
              src="/assets/logo.png"
              alt="Sartoriapieri"
            />
            <span className="sa-film-loader-title">Splendor Animae</span>
            <span className="sa-film-loader-line" aria-hidden="true">
              <i ref={loaderLineRef} />
            </span>
            <span className="sa-film-loader-pct" ref={loaderPctRef}>
              0%
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
