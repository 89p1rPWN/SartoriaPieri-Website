import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import './Lightbox.css';

const EASE = [0.32, 0.72, 0, 1];

/**
 * Shared-element zoom lightbox. Wrap each thumbnail in <LightboxThumb> with a
 * matching `id`; when `active` names one of the items, the image morphs from
 * its thumbnail into a full-screen figure (framer-motion layoutId FLIP).
 * The figure is seeded with the already-cached thumb and crossfades to the
 * full-resolution original when it loads, so the morph never targets an
 * unsized image; neighbours are preloaded for instant arrow navigation.
 *
 * items: [{ id, thumb, full, alt }]
 * active: index | null
 * onClose(), onNav(nextIndex)
 */
export function LightboxThumb({ id, children, onOpen, className, label }) {
  return (
    <Motion.button
      type="button"
      layoutId={`lb-${id}`}
      className={`lb-thumb ${className || ''}`}
      onClick={onOpen}
      whileHover={{ scale: 0.985 }}
      transition={{ duration: 0.6, ease: EASE }}
      aria-label={label || 'Ingrandisci immagine'}
    >
      {children}
    </Motion.button>
  );
}

export default function Lightbox({ items, active, onClose, onNav }) {
  const open = active != null && Boolean(items[active]);
  const overlayRef = useRef(null);
  const closeRef = useRef(null);
  const openerRef = useRef(null);
  const [loadedSrc, setLoadedSrc] = useState(null);

  /* focus: remember the opener, move focus in, restore on close */
  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement;
    const raf = requestAnimationFrame(() => closeRef.current?.focus());
    const opener = openerRef.current;
    return () => {
      cancelAnimationFrame(raf);
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [open]);

  /* scroll lock + keyboard: Esc, arrows, Tab trapped inside the overlay */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNav((active + 1) % items.length);
      if (e.key === 'ArrowLeft') onNav((active - 1 + items.length) % items.length);
      if (e.key === 'Tab') {
        const focusables = overlayRef.current?.querySelectorAll('button');
        if (!focusables?.length) return;
        const list = Array.from(focusables);
        const i = list.indexOf(document.activeElement);
        e.preventDefault();
        const nextIdx = e.shiftKey
          ? (i - 1 + list.length) % list.length
          : (i + 1) % list.length;
        list[nextIdx].focus();
      }
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, active, items.length, onClose, onNav]);

  /* warm the neighbours so arrow navigation is instant */
  useEffect(() => {
    if (!open || items.length < 2) return;
    [1, -1].forEach((d) => {
      const img = new Image();
      img.src = items[(active + d + items.length) % items.length].full;
    });
  }, [open, active, items]);

  const fullVisible = open && loadedSrc === items[active].full;

  return (
    <AnimatePresence>
      {open && (
        <Motion.div
          ref={overlayRef}
          className="lb-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={items[active].alt}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          onClick={onClose}
        >
          <Motion.figure
            className="lb-figure"
            layoutId={`lb-${items[active].id}`}
            transition={{ duration: 0.65, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* cached thumb keeps the figure sized while the original loads */}
            <img
              className="lb-base"
              src={items[active].thumb}
              alt=""
              aria-hidden="true"
              draggable={false}
            />
            <Motion.img
              key={items[active].full}
              className="lb-full"
              src={items[active].full}
              alt={items[active].alt}
              initial={{ opacity: 0 }}
              animate={{ opacity: fullVisible ? 1 : 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              onLoad={() => setLoadedSrc(items[active].full)}
              draggable={false}
            />
          </Motion.figure>

          <Motion.div
            className="lb-chrome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="lb-count">
              {String(active + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
            </span>
            <div className="lb-actions">
              <button
                type="button"
                onClick={() => onNav((active - 1 + items.length) % items.length)}
                aria-label="Immagine precedente"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => onNav((active + 1) % items.length)}
                aria-label="Immagine successiva"
              >
                →
              </button>
              <button type="button" ref={closeRef} onClick={onClose} aria-label="Chiudi">
                ✕
              </button>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}
