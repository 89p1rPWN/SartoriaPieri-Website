import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import './Contact.css';

export default function Contact() {
  const navigate = useNavigate();
  const pageRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(pageRef.current, { opacity: 0 }, { opacity: 1, duration: 1.5 });
  }, []);

  return (
    <div className="contact-page" ref={pageRef}>
      <nav className="sub-nav">
        <button onClick={() => navigate('/hand-card')} className="nav-back">← ATELIER</button>
        <div className="nav-logo">CONNESSIONE</div>
      </nav>

      <div className="contact-bg-wrapper">
        <img src="/contact-bg.png" alt="Background" className="contact-bg-img" />
      </div>

      <div className="contact-main">
        <div className="contact-header">
            <span className="small-detail">CONTATTO DIRETTO</span>
            <h1>REACH OUT</h1>
        </div>

        <div className="contact-links">
            <div className="contact-item">
                <span className="label">OFFICE</span>
                <a href="mailto:studio@sartoriapieri.com">studio@sartoriapieri.com</a>
            </div>
            <div className="contact-item">
                <span className="label">PRESS</span>
                <a href="mailto:press@sartoriapieri.com">press@sartoriapieri.com</a>
            </div>
            <div className="contact-item">
                <span className="label">INSTAGRAM</span>
                <a href="https://instagram.com/sartoriapieri" target="_blank" rel="noreferrer">@sartoriapieri</a>
            </div>
        </div>

        <div className="contact-location">
            <p>FLORENCE — ITALY</p>
            <p>VISITS BY APPOINTMENT ONLY</p>
        </div>
      </div>

      <div className="glass-reflection" />
    </div>
  );
}
