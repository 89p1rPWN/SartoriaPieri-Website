import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import './About.css';

export default function About() {
  const navigate = useNavigate();
  const pageRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(pageRef.current, { opacity: 0 }, { opacity: 1, duration: 1.2 });
    gsap.from('.about-content h1', { y: 50, opacity: 0, duration: 1, delay: 0.3 });
    gsap.from('.about-text p', { y: 30, opacity: 0, duration: 1, stagger: 0.2, delay: 0.5 });
  }, []);

  return (
    <div className="about-page" ref={pageRef}>
      <nav className="sub-nav">
        <button onClick={() => navigate('/hand-card')} className="nav-back">← ATELIER</button>
        <div className="nav-logo">SARTORIAPIERI</div>
      </nav>

      <div className="about-hero">
        <img src="/about-hero.jpg" alt="Atelier" className="about-hero-img" />
        <div className="hero-overlay" />
      </div>

      <div className="about-container">
        <div className="about-content">
          <p className="kicker">L'ANIMA VESTITA</p>
          <h1>IL NOSTRO ARCHIVIO</h1>
          
          <div className="about-text">
            <p>
              Sartoria Pieri non è un marchio di moda, è un archivio di emozioni tangibili. 
              Ogni capo è il risultato di una ricerca ossessiva sulla forma e sulla degradazione.
            </p>
            <p>
              Lavoriamo con tessuti che hanno una storia, manipolandoli finché non perdono 
              la loro identità originale per acquisirne una più profonda, legata all'introspezione 
              e alla fragilità umana.
            </p>
            <p>
              Il nostro processo è lento, manuale, quasi rituale. Distruggiamo per ricostruire, 
              sporchiamo per purificare.
            </p>
          </div>
        </div>
      </div>

      <div className="about-footer">
        <span className="footer-label">STUDIO PIERI — 2026</span>
        <span className="footer-label">FLORENCE, IT</span>
      </div>
    </div>
  );
}
