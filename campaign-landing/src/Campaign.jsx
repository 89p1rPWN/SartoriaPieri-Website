import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import './Campaign.css';

export default function Campaign() {
  const navigate = useNavigate();
  const pageRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(pageRef.current, { opacity: 0 }, { opacity: 1, duration: 1 });
  }, []);

  return (
    <div className="campaign-page" ref={pageRef}>
      <nav className="sub-nav">
        <button onClick={() => navigate('/hand-card')} className="nav-back">← ATELIER</button>
        <div className="nav-logo">SPLENDOR ANIMAE</div>
      </nav>

      <div className="campaign-grid">
        <div className="campaign-card main-vision">
            <img src="/campaign-sketch.png" alt="Sketch" className="sketch-overlay" />
            <div className="card-label">VISION 001</div>
        </div>
        
        <div className="campaign-info">
            <div className="info-header">
                <h2>FW26</h2>
                <p>Process & Documentation</p>
            </div>
            
            <div className="info-body">
                <p>The "Splendor Animae" campaign is a visual study on the textures of grief. Through raw film and charcoal studies, we document the transformation of the individual into an archival piece.</p>
                <div className="tag-list">
                    <span>#TRAUMA</span>
                    <span>#DOLORE</span>
                    <span>#VERGOGNA</span>
                </div>
            </div>

            <div className="info-cta">
                <button className="cta-btn">VIEW FULL LOOKBOOK</button>
            </div>
        </div>
      </div>

      <div className="grain-layer" />
    </div>
  );
}
