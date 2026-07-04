import { useEffect, useRef, useState } from 'react';
import './ScrollFilm.css';

const FRAME_COUNT = 241;
const TRACK_VH = 700;
const KEY_STRIDE = 24;
const MID_STRIDE = 6;
const CONCURRENCY = 6; // browsers cap at 6 connections per origin on HTTP/1.1
const MAX_RETRIES = 2;
const READY_WATCHDOG_MS = 12000;
const DECODE_AHEAD = 10;
const DECODE_BEHIND = 3;
const FOCAL_Y = 0.42;
const MAX_DPR = 2;

const framePath = (i) => `/cinematic/frames/frame-${String(i + 1).padStart(4, '0')}.jpg`;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/**
 * Scroll-scrubbed frame-sequence film.
 * A 700vh scroll track drives a pinned full-viewport canvas: scroll progress
 * maps linearly to a frame index (lerp-smoothed), each rAF tick draws the
 * current frame cover-fit. Scrolling down plays the film, up plays it back.
 * Chapters are overlay nodes faded in/out by progress range; `decorative`
 * chapters are aria-hidden (provide an sr-only narrative alongside).
 */
export default function ScrollFilm({ chapters }) {
  const trackRef = useRef(null);
  const canvasRef = useRef(null);
  const chapterRefs = useRef([]);
  const barRef = useRef(null);
  const hintRef = useRef(null);
  const loaderLineRef = useRef(null);
  const loaderPctRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    const canvas = canvasRef.current;
    if (!track || !canvas) return;

    const stage = canvas.parentElement;
    const ctx = canvas.getContext('2d', { alpha: false });
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const images = new Array(FRAME_COUNT);
    const loaded = new Uint8Array(FRAME_COUNT);
    const attempts = new Uint8Array(FRAME_COUNT);
    const decodeRequested = new Uint8Array(FRAME_COUNT);
    let disposed = false;
    let revealed = false;

    const reveal = () => {
      if (revealed || disposed) return;
      revealed = true;
      setReady(true);
    };

    /* ── progressive loader: keyframes → mid pass → every frame ── */
    const keySet = new Set();
    for (let i = 0; i < FRAME_COUNT; i += KEY_STRIDE) keySet.add(i);
    keySet.add(FRAME_COUNT - 1);

    const order = [];
    const queued = new Set();
    const enqueue = (i) => {
      if (!queued.has(i)) {
        queued.add(i);
        order.push(i);
      }
    };
    keySet.forEach(enqueue);
    for (let i = 0; i < FRAME_COUNT; i += MID_STRIDE) enqueue(i);
    for (let i = 0; i < FRAME_COUNT; i += 1) enqueue(i);

    let cursor = 0;
    let inflight = 0;
    let keyLoaded = 0;

    const onFrameLoaded = (i) => {
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
      img.src = framePath(i);
    };
    for (let c = 0; c < CONCURRENCY; c += 1) pump();

    // never leave the visitor behind an opaque loader: reveal after a
    // deadline even if keyframes are still missing.
    const watchdog = setTimeout(reveal, READY_WATCHDOG_MS);

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

    /* ── idle gating: skip all per-frame work while the track is offscreen ── */
    let inView = true;
    let snapOnResume = false;
    const io = new IntersectionObserver(
      (entries) => {
        inView = entries[0].isIntersecting;
        if (inView) {
          needsRedraw = true;
          snapOnResume = true;
        }
      },
      { rootMargin: '120px' }
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
      for (let d = 1; d < FRAME_COUNT; d += 1) {
        if (idx - d >= 0 && loaded[idx - d]) return idx - d;
        if (idx + d < FRAME_COUNT && loaded[idx + d]) return idx + d;
      }
      return -1;
    };

    const drawFrame = (idx) => {
      const img = images[idx];
      if (!img) return;
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) * FOCAL_Y, dw, dh);
    };

    // ask the browser to decode upcoming frames off the hot path, so
    // drawImage rarely hits a synchronous JPEG decode mid-scrub.
    const decodeAhead = (idx) => {
      for (let j = idx - DECODE_BEHIND; j <= idx + DECODE_AHEAD; j += 1) {
        if (j < 0 || j >= FRAME_COUNT) continue;
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
    let prevTime = performance.now();
    let rafId;

    const loop = (now) => {
      rafId = requestAnimationFrame(loop);
      const dt = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;

      if (!inView && !needsRedraw) return;

      const p = progress();
      const target = p * (FRAME_COUNT - 1);
      if (reduceMotion || snapOnResume) {
        current = target;
        snapOnResume = false;
      } else {
        current += (target - current) * (1 - Math.pow(0.0015, dt));
        if (Math.abs(target - current) < 0.4) current = target;
      }

      const visualP = current / (FRAME_COUNT - 1);
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
      clearTimeout(watchdog);
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      io.disconnect();
    };
  }, [chapters]);

  return (
    <section
      className="sa-film"
      ref={trackRef}
      style={{ height: `${TRACK_VH}vh` }}
      aria-label="Splendor Animae — the film"
    >
      <div className="sa-film-stage">
        <canvas
          ref={canvasRef}
          className={`sa-film-canvas ${ready ? 'is-ready' : ''}`}
          aria-hidden="true"
        />
        <div className="sa-film-vignette" aria-hidden="true" />

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

        <div className="sa-film-hint" ref={hintRef} aria-hidden="true">
          <span className="sa-film-hint-label">Scroll to enter the world of Splendor Animae</span>
          <span className="sa-film-hint-line">
            <i />
          </span>
        </div>

        <div className="sa-film-progress" aria-hidden="true">
          <i ref={barRef} />
        </div>

        <div
          className={`sa-film-loader ${ready ? 'is-done' : ''}`}
          role="status"
          aria-live="polite"
          aria-hidden={ready}
        >
          <span className="sa-film-loader-mark">Sartoriapieri</span>
          <span className="sa-film-loader-title">Splendor Animae</span>
          <span className="sa-film-loader-line" aria-hidden="true">
            <i ref={loaderLineRef} />
          </span>
          <span className="sa-film-loader-pct" ref={loaderPctRef}>
            0%
          </span>
        </div>
      </div>
    </section>
  );
}
