export default function HeroLanding({ languageCount, onGoRedcards, onGoBuilder }) {
  return (
    <section className="hero-landing animate-in" aria-label="About Red Cards">
      <div className="hero-landing-top">
        <p className="hero-kicker">Know Your Rights</p>
        <h2 className="hero-title">Carry clear rights guidance in your language.</h2>
        <p className="hero-summary">
          Red Cards help people respond safely and consistently during immigration encounters. Open a card on your phone above, or print paper cards to carry and share.
        </p>
        <div className="hero-actions">
          <button type="button" className="hero-primary" onClick={onGoRedcards}>
            Print paper cards
          </button>
          <button type="button" className="hero-secondary" onClick={onGoBuilder}>
            Build a Red Card
          </button>
        </div>
      </div>

      <div className="hero-accent-line" aria-hidden="true" />

      <div className="hero-grid">
        <article className="hero-card">
          <h3>On your phone</h3>
          <p>Every card works offline once this site has been opened. Show it full screen, switch to English for the officer, or save it as an image.</p>
        </article>
        <article className="hero-card">
          <h3>On paper</h3>
          <p>Print fold-format sheets from your browser or download a print-ready PDF.</p>
        </article>
        <article className="hero-card">
          <h3>{languageCount} languages</h3>
          <p>Cards come from published Red Card translations, with right-to-left scripts shown correctly.</p>
        </article>
      </div>

      <div className="hero-trust-row" aria-label="Platform highlights">
        <span className="hero-trust-badge">
          <span className="hero-trust-icon" aria-hidden="true">&#x2696;</span>
          Constitutional rights
        </span>
        <span className="hero-trust-badge">
          <span className="hero-trust-icon" aria-hidden="true">&#x1F4F4;</span>
          Works offline
        </span>
        <span className="hero-trust-badge">
          <span className="hero-trust-icon" aria-hidden="true">&#x1F513;</span>
          No tracking, free &amp; open source
        </span>
        <span className="hero-trust-badge">
          <span className="hero-trust-icon" aria-hidden="true">&#x1F5A8;</span>
          Print-ready output
        </span>
      </div>
    </section>
  );
}
