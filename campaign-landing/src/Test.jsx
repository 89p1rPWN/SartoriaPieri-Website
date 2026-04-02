import './Test.css';

const Test = () => {
  return (
    <div className="test-page">
      <nav className="t-nav">
        <span className="t-nav-logo">SartoriaPieri</span>
        <div className="t-nav-links">
          <span>ABOUT</span>
          <span>CAMPAIGN</span>
          <span>CONTACT US</span>
        </div>
        <span className="t-nav-cta">CONTACT US &nbsp;→</span>
      </nav>

      <div className="t-glow" />

      <div className="t-collage">
        {/* Perversione — angular hat, top-left area */}
        <div className="t-fig t-fig-topleft">
          <img src="/outfits/perversione/2_nobg.png" alt="Perversione" />
        </div>

        {/* Vergogna — burgundy veil, top-center */}
        <div className="t-fig t-fig-topcenter">
          <img src="/outfits/vergogna/vergogna_nobg.png" alt="Vergogna" />
        </div>

        {/* Depravazione — full lace gown, left side */}
        <div className="t-fig t-fig-topright">
          <img src="/outfits/depravazione/3_nobg.png" alt="Depravazione" />
        </div>

        {/* White haze behind text */}
        <div className="t-text-haze" />

        {/* TITAN TEXT — in front */}
        <h1 className="t-titan">SARTORIAPIERI</h1>

        {/* Trauma Center — dominant foreground */}
        <div className="t-fig t-fig-center">
          <img src="/outfits/trauma/9_nobg.png" alt="Trauma" />
        </div>
      </div>

      <div className="t-editorial">
        <h4>FALL/WINTER 2026</h4>
        <h2>OUR CAMPAIGN</h2>
        <p>At SartoriaPieri, each season unfolds a new story, a journey through oversized silhouettes, avant-garde styling, and cutting-edge tailoring.</p>
        <p>Redefines the essence of Persona, taking inspiration from his roots and evolving it into an expression of bold, sculptural fashion.</p>
      </div>
    </div>
  );
};

export default Test;
