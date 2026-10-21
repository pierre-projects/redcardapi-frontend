export default function AboutSection({ languageCount, onGoPrint }) {
  return (
    <section className="about" aria-labelledby="about-title">
      <h2 id="about-title" className="section-title">About these cards</h2>
      <div className="about-grid">
        <div>
          <h3>What the card does</h3>
          <p>
            One side explains your rights in your language. The other side is a statement in
            English to show an immigration officer, asserting your right to remain silent and to
            refuse entry or search without a warrant.
          </p>
        </div>
        <div>
          <h3>On your phone</h3>
          <p>
            Open your language once and the card keeps working without a connection. You can show
            it full screen, enlarge the text, or save it as an image.
          </p>
        </div>
        <div>
          <h3>On paper</h3>
          <p>
            Carry a printed card in your wallet or keep one by the door. {" "}
            <a
              href="/redcards"
              onClick={(event) => {
                event.preventDefault();
                onGoPrint();
              }}
            >
              Print cards in any of the {languageCount} languages
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
