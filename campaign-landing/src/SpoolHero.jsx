import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './SpoolHero.css';

export default function SpoolHero() {
  const rootRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const root = rootRef.current;
    if (!root) return;

    const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·/—#§¶†‡";
    const isSpace = (c) => c === ' ' || c.charCodeAt(0) === 160;

    const scrambleEls = Array.from(root.querySelectorAll('.scramble'));
    scrambleEls.forEach(el => {
      if (!el.dataset.final) el.dataset.final = el.textContent;
    });

    const active = new WeakMap();
    const garble = (el) => {
      const final = el.dataset.final;
      const tok = Symbol();
      active.set(el, tok);
      el.textContent = final.split('').map(c =>
        isSpace(c) ? c : CHARSET[(Math.random() * CHARSET.length) | 0]
      ).join('');
    };
    const settle = (el, duration = 1.0) => {
      const final = el.dataset.final;
      const tok = Symbol();
      active.set(el, tok);
      const chars = final.split('');
      const start = performance.now();
      const tick = (now) => {
        if (cancelled || active.get(el) !== tok) return;
        const p = Math.min((now - start) / (duration * 1000), 1);
        const settled = Math.floor(chars.length * p);
        let out = '';
        for (let i = 0; i < chars.length; i++) {
          const c = chars[i];
          out += (i < settled || isSpace(c))
            ? c
            : CHARSET[(Math.random() * CHARSET.length) | 0];
        }
        el.textContent = out;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = final;
      };
      requestAnimationFrame(tick);
    };

    // Pre-state
    scrambleEls.forEach(garble);
    gsap.set('.spool-content', { opacity: 0 });
    gsap.set('.spool-thread-path', { strokeDasharray: 'var(--len)', strokeDashoffset: 'var(--len)' });
    gsap.set('.spool-disc', { scale: 0.4, opacity: 0, transformOrigin: '50% 50%' });
    gsap.set('.spool-vignette', { opacity: 0 });
    gsap.set('.spool-bg-img', { opacity: 0, scale: 1.15, filter: 'blur(20px)' });

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // 1. Background paper bleeds in
    tl.to('.spool-bg-img', { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.6 }, 0);
    tl.to('.spool-vignette', { opacity: 1, duration: 1.2 }, 0.2);

    // 2. Spool disc materializes & spins as thread unwinds
    tl.to('.spool-disc', { scale: 1, opacity: 1, duration: 0.9, ease: 'expo.out' }, 0.5);
    tl.to('.spool-disc', { rotation: 720, duration: 2.4, ease: 'power2.inOut' }, 0.7);

    // 3. Thread draws from spool, looping outward
    tl.to('.spool-thread-path', { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut' }, 0.7);

    // 4. Content block fades up after thread settles
    tl.to('.spool-content', { opacity: 1, duration: 1.0 }, 2.4);
    tl.fromTo('.scramble', { y: 12, filter: 'blur(8px)' }, { y: 0, filter: 'blur(0px)', duration: 1.0, stagger: 0.08 }, 2.4);

    // 5. Trigger scramble settle per-element with stagger
    scrambleEls.forEach((el, i) => {
      tl.call(() => settle(el, 1.0), [], 2.4 + i * 0.08);
    });

    return () => {
      cancelled = true;
      tl.kill();
    };
  }, []);

  return (
    <div className="spool-page" ref={rootRef}>
      <div className="spool-bg-img" aria-hidden="true" />
      <div className="spool-vignette" aria-hidden="true" />

      <svg className="spool-svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g className="spool-thread">
          <path
            className="spool-thread-path"
            style={{ '--len': 2400 }}
            d="M 720 450
               m -55 -10
               c 60 -45, 175 -55, 240 5
               c 65 60, 25 165, -55 195
               c -120 45, -260 -45, -300 -160
               c -45 -130, 60 -270, 210 -290
               c 175 -22, 350 95, 380 245
               c 30 145, -55 280, -190 325
               c -180 60, -390 -50, -460 -210
               c -75 -170, 30 -370, 220 -440
               c 230 -85, 500 60, 580 270
               c 80 215, -45 460, -270 540"
            fill="none"
            stroke="#f2ede7"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.85"
          />
        </g>

        <g className="spool-disc" style={{ transform: 'translate(720px, 450px)' }}>
          <circle r="58" fill="#0a0a0a" stroke="#1f1f1f" strokeWidth="1.5" />
          <circle r="55" fill="none" stroke="#2a2622" strokeWidth="1" strokeDasharray="2 4" />
          <circle r="42" fill="#0e0e0e" />
          <circle r="6" fill="#cc0000" />
          <circle r="18" fill="none" stroke="#3a3530" strokeWidth="0.8" />
          <circle r="30" fill="none" stroke="#3a3530" strokeWidth="0.6" />
        </g>
      </svg>

      <div className="spool-content">
        <div className="spool-kicker scramble">SARTORIA PIERI ARCHIVE 12</div>
        <h1 className="spool-title scramble">S P L E N D O R&nbsp;&nbsp;&nbsp;A N I M A E</h1>
        <div className="spool-date scramble">04·24·2026 — FIRENZE</div>
        <div className="spool-body">
          <p className="scramble">EVERY THREAD CARRIES A MEMORY</p>
          <p className="scramble">UNRAVELLED · MEASURED · RESTITCHED</p>
          <p className="scramble">BY SARTORIA PIERI</p>
        </div>
      </div>

      <div className="spool-corner spool-corner-tl">SP / ARCHIVE</div>
      <div className="spool-corner spool-corner-tr">N° 12 — XII</div>
      <div className="spool-corner spool-corner-bl">FIRENZE · ITALIA</div>
      <div className="spool-corner spool-corner-br">FW · MMXXVI</div>
    </div>
  );
}
