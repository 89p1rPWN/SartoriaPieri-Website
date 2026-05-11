import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import './EtroLanding.css';

const ease = [0.22, 1, 0.36, 1];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

export default function EtroLanding() {
  return (
    <div className="etro-page">
      <div className="etro-stage">
        <motion.nav
          className="etro-nav"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
        >
          <Link to="/" className="etro-brand">SARTORIAPIERI</Link>
          <div className="etro-nav-mid">
            <a href="#campaign">campaign</a>
            <a href="#collection">collection</a>
            <a href="#archive">archive</a>
            <a href="#contact">contact</a>
          </div>
          <div className="etro-nav-right">
            <div className="etro-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-3.5-3.5"/></svg>
              <span>search</span>
            </div>
            <div className="etro-acc" />
            <div className="etro-menu" aria-label="menu">
              <span /><span /><span />
            </div>
          </div>
        </motion.nav>

        <motion.span className="etro-issue" {...fadeUp} transition={{ duration: 0.7, delay: 0.2, ease }}>
          ISSUE 13 — FW 2026
        </motion.span>

        <motion.span className="etro-tag-ref" {...fadeUp} transition={{ duration: 0.7, delay: 0.3, ease }}>
          REF. ARCHIVE_13A — FW 2026
        </motion.span>

        <motion.div
          className="etro-model"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.4, ease }}
        >
          <img src="/outfits/depravazione/1_nobg.png" alt="Depravazione look" />
        </motion.div>

        <motion.h1
          className="etro-wordmark"
          initial={{ opacity: 0, y: 80, letterSpacing: '0.04em' }}
          animate={{ opacity: 1, y: 0, letterSpacing: '-0.04em' }}
          transition={{ duration: 1.4, delay: 0.6, ease }}
        >
          morphology
        </motion.h1>

        <motion.span className="etro-tag-sub" {...fadeUp} transition={{ duration: 0.7, delay: 0.85, ease }}>
          FIVE EMOTIONS, FIVE GARMENTS
        </motion.span>

        <motion.div
          className="etro-video-card"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.9, ease }}
          whileHover={{ y: -3 }}
        >
          <div className="etro-video-circle">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </div>
          <div className="etro-video-text">
            <strong>watch video</strong>
            <span>about collection</span>
          </div>
        </motion.div>

        <motion.div className="etro-product-peek" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 0.6, x: 0 }} transition={{ duration: 0.8, delay: 1.0, ease }} />

        <motion.div
          className="etro-product-card"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 1.05, ease }}
          whileHover={{ y: -3 }}
        >
          <div className="etro-product-thumb" />
          <div className="etro-product-info">
            <div className="etro-product-row">
              <span className="etro-product-name">depravazione</span>
              <span className="etro-product-price">€2,400</span>
            </div>
            <span className="etro-product-cat">silk crepe · lace</span>
            <div className="etro-swatches">
              <span className="etro-swatch" style={{ background: 'var(--accent)' }} />
              <span className="etro-swatch" style={{ background: '#1A1A1A' }} />
              <span className="etro-swatch" style={{ background: '#F2EEE6', outline: '1px solid #ddd' }} />
            </div>
          </div>
          <button className="etro-product-add" aria-label="add">+</button>
        </motion.div>

        <motion.div
          className="etro-next-card"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.15, ease }}
          whileHover={{ y: -3 }}
        >
          <div className="etro-next-img" />
          <div className="etro-next-text">
            <small>swipe it</small>
            <strong>next collection</strong>
          </div>
        </motion.div>

        <motion.div
          className="etro-pag"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.3, ease }}
        >
          <span className="etro-dot is-active" />
          <span className="etro-dot" />
          <span className="etro-dot" />
          <button className="etro-pag-btn prev" aria-label="prev">‹</button>
          <button className="etro-pag-btn next" aria-label="next">›</button>
        </motion.div>
      </div>
    </div>
  );
}
