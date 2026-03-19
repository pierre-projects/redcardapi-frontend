export default function HeroLanding({ onGoRedcards, onGoBuilder }) {
  return (
    <section className="hero-landing animate-in" aria-label="Landing overview">
      <div className="hero-landing-top">
        <p className="hero-kicker">Know Your Rights</p>
        <h2 className="hero-title">Carry clear rights guidance in your language.</h2>
        <p className="hero-summary">
          Red Cards help people respond safely and consistently during immigration encounters. This tool gives you print-ready cards and a builder for future translations.
        </p>
        <div className="hero-actions">
          <button type="button" className="hero-primary" onClick={onGoRedcards}>
            Go to Red Cards
          </button>
          <button type="button" className="hero-secondary" onClick={onGoBuilder}>
            Build a Red Card
          </button>
        </div>
      </div>

      <div className="hero-accent-line" aria-hidden="true" />

      <div className="hero-grid animate-in animate-in-delay-1">
        <article className="hero-card">
          <h3>How It Works</h3>
          <p>Select a language, preview both sides of the card, then print with your preferred method.</p>
        </article>
        <article className="hero-card">
          <h3>Two Print Modes</h3>
          <p>Use backend PDF for consistency or browser print for fold-format sheets and quick adjustments.</p>
        </article>
        <article className="hero-card">
          <h3>Language Coverage</h3>
          <p>Each supported language includes direction-aware rendering, source attribution, and official status indicators.</p>
        </article>
      </div>

      <div className="hero-trust-row animate-in animate-in-delay-2" aria-label="Platform highlights">
        <span className="hero-trust-badge">
          <span className="hero-trust-icon" aria-hidden="true">&#x2696;</span>
          Constitutional rights
        </span>
        <span className="hero-trust-badge">
          <span className="hero-trust-icon" aria-hidden="true">&#x1F310;</span>
          40+ languages
        </span>
        <span className="hero-trust-badge">
          <span className="hero-trust-icon" aria-hidden="true">&#x1F513;</span>
          Free &amp; open source
        </span>
        <span className="hero-trust-badge">
          <span className="hero-trust-icon" aria-hidden="true">&#x1F5A8;</span>
          Print-ready output
        </span>
      </div>

      <div className="hero-sections animate-in animate-in-delay-3">
        <section className="hero-section">
          <h3>Trust and Verification</h3>
          <p>
            The red cards workspace shows source origin and verification indicators so operators can quickly understand translation confidence before printing.
          </p>
        </section>
        <section className="hero-section">
          <h3>Roadmap</h3>
          <p>
            Translation workflow support is expanding toward review queues, duplicate checks, and provider-assisted translation pipelines while keeping manual authoring available.
          </p>
        </section>
      </div>
    </section>
  );
}
