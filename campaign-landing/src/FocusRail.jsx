import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './FocusRail.css';

const wrap = (min, max, v) => {
  const r = max - min;
  return ((((v - min) % r) + r) % r) + min;
};

const BASE_SPRING = { type: 'spring', stiffness: 300, damping: 30, mass: 1 };
const TAP_SPRING = { type: 'spring', stiffness: 450, damping: 18, mass: 1 };

export default function FocusRail({
  items,
  initialIndex = 0,
  loop = true,
  autoPlay = false,
  interval = 4000,
  onSelect,
  scrollDriven = false,
}) {
  const [active, setActive] = useState(initialIndex);
  const [hover, setHover] = useState(false);
  const lastWheel = useRef(0);
  const rootRef = useRef(null);
  const wrapRef = useRef(null);

  const count = items.length;
  const activeIdx = wrap(0, count, active);
  const activeItem = items[activeIdx];

  const handlePrev = useCallback(() => {
    if (!loop && active === 0) return;
    setActive((p) => p - 1);
  }, [loop, active]);

  const handleNext = useCallback(() => {
    if (!loop && active === count - 1) return;
    setActive((p) => p + 1);
  }, [loop, active, count]);

  const onWheel = useCallback(
    (e) => {
      const now = Date.now();
      if (now - lastWheel.current < 400) return;
      const horiz = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const d = horiz ? e.deltaX : e.deltaY;
      if (Math.abs(d) > 20) {
        d > 0 ? handleNext() : handlePrev();
        lastWheel.current = now;
      }
    },
    [handleNext, handlePrev]
  );

  useEffect(() => {
    if (!autoPlay || hover) return;
    const t = setInterval(handleNext, interval);
    return () => clearInterval(t);
  }, [autoPlay, hover, handleNext, interval]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
  };

  const activeRef = useRef(active);
  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    if (!scrollDriven) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    let lastWheel = 0;
    let locked = false;
    let exitedDir = 0; // 1 = forward, -1 = back; disables re-lock until section leaves viewport
    const DEBOUNCE = 600;

    const lock = () => {
      if (locked) return;
      locked = true;
      const r = wrap.getBoundingClientRect();
      const target = window.scrollY + r.top;
      if (window.__lenis) {
        window.__lenis.scrollTo(target, { immediate: true });
        window.__lenis.stop();
      } else {
        window.scrollTo({ top: target });
      }
    };
    const unlock = () => {
      if (!locked) return;
      locked = false;
      if (window.__lenis) window.__lenis.start();
    };

    const isOutOfView = () => {
      const r = wrap.getBoundingClientRect();
      return r.bottom <= 0 || r.top >= window.innerHeight;
    };

    const checkRegion = () => {
      if (exitedDir !== 0) {
        if (isOutOfView()) exitedDir = 0;
        return;
      }
      const r = wrap.getBoundingClientRect();
      const center = r.top + r.height / 2;
      const vc = window.innerHeight / 2;
      const inRange = Math.abs(center - vc) < window.innerHeight * 0.4;
      if (inRange && !locked) lock();
    };

    const onWheel = (e) => {
      checkRegion();
      if (!locked) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      const cur = activeRef.current;
      const atEdge = (dir > 0 && cur >= count - 1) || (dir < 0 && cur <= 0);
      if (atEdge) {
        exitedDir = dir;
        unlock();
        return; // do NOT preventDefault — let this wheel scroll the page
      }
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheel < DEBOUNCE) return;
      lastWheel = now;
      setActive((p) => p + dir);
    };

    let touchY = 0;
    const onTouchStart = (e) => { touchY = e.touches[0].clientY; checkRegion(); };
    const onTouchMove = (e) => {
      if (!locked) return;
      const dy = touchY - e.touches[0].clientY;
      if (Math.abs(dy) < 50) { e.preventDefault(); return; }
      const dir = dy > 0 ? 1 : -1;
      const cur = activeRef.current;
      const atEdge = (dir > 0 && cur >= count - 1) || (dir < 0 && cur <= 0);
      if (atEdge) {
        exitedDir = dir;
        unlock();
        return;
      }
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheel < DEBOUNCE) return;
      lastWheel = now;
      touchY = e.touches[0].clientY;
      setActive((p) => p + dir);
    };

    const onScrollNative = () => { checkRegion(); };

    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    window.addEventListener('scroll', onScrollNative, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel, { capture: true });
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove, { capture: true });
      window.removeEventListener('scroll', onScrollNative);
      unlock();
    };
  }, [scrollDriven, count]);

  const onDragEnd = (_e, { offset, velocity }) => {
    const swipe = Math.abs(offset.x) * velocity.x;
    if (swipe < -10000) handleNext();
    else if (swipe > 10000) handlePrev();
  };

  const visible = [-2, -1, 0, 1, 2];

  const railContent = (
    <div
      className="fr-root"
      ref={rootRef}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onWheel={scrollDriven ? undefined : onWheel}
    >
      <div className="fr-bg">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`bg-${activeItem.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="fr-bg-layer"
          >
            <img src={activeItem.imageSrc} alt="" />
            <div className="fr-bg-fade" />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fr-stage">
        <motion.div
          className="fr-rail"
          drag={scrollDriven ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={onDragEnd}
        >
          {visible.map((offset) => {
            const abs = active + offset;
            const idx = wrap(0, count, abs);
            const item = items[idx];
            if (!loop && (abs < 0 || abs >= count)) return null;
            const isCenter = offset === 0;
            const dist = Math.abs(offset);
            const xOffset = offset * 320;
            const zOffset = -dist * 180;
            const scale = isCenter ? 1 : 0.85;
            const rotateY = offset * -20;
            const opacity = isCenter ? 1 : Math.max(0.1, 1 - dist * 0.5);
            const blur = isCenter ? 0 : dist * 6;
            const brightness = isCenter ? 1 : 0.5;
            return (
              <motion.div
                key={abs}
                className={`fr-card ${isCenter ? 'is-center' : ''}`}
                initial={false}
                animate={{
                  x: xOffset,
                  z: zOffset,
                  scale,
                  rotateY,
                  opacity,
                  filter: `blur(${blur}px) brightness(${brightness})`,
                }}
                transition={(val) => (val === 'scale' ? TAP_SPRING : BASE_SPRING)}
                style={{ transformStyle: 'preserve-3d' }}
                onClick={() => {
                  if (offset !== 0) setActive((p) => p + offset);
                  else if (onSelect) onSelect(item, idx);
                }}
              >
                <img src={item.imageSrc} alt={item.title} />
                <div className="fr-card-shine" />
                <div className="fr-card-shade" />
              </motion.div>
            );
          })}
        </motion.div>

        <div className="fr-info">
          <div className="fr-info-text">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem.id}
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.3 }}
              >
                {activeItem.meta && <span className="fr-meta">{activeItem.meta}</span>}
                <h2 className="fr-title">{activeItem.title}</h2>
                {activeItem.description && <p className="fr-desc">{activeItem.description}</p>}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="fr-controls">
            <div className="fr-pill">
              <button onClick={handlePrev} aria-label="Previous">‹</button>
              <span className="fr-counter">
                {String(activeIdx + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
              </span>
              <button onClick={handleNext} aria-label="Next">›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (scrollDriven) {
    return (
      <div ref={wrapRef} className="fr-wrap" style={{ height: '100dvh' }}>
        <div className="fr-sticky">{railContent}</div>
      </div>
    );
  }
  return railContent;
}
