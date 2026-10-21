import { FALLBACK_COLOR_PRESETS, normalizeHex } from "../lib/color";

const COLOR_NAMES = {
  "#B91C1C": "Red",
  "#EA580C": "Orange",
  "#1D4ED8": "Blue",
  "#15803D": "Green",
  "#111111": "Black",
};

/**
 * Ink choice for printing: black text for red card stock, or the card color
 * printed on plain paper (preset swatches plus a custom color).
 */
export default function PrintColorPicker({ style, onStyleChange, color, onColorChange, presets }) {
  const swatches = (Array.isArray(presets) && presets.length > 0 ? presets : FALLBACK_COLOR_PRESETS)
    .map(normalizeHex)
    .filter(Boolean);
  const isCustom = !swatches.includes(color);

  return (
    <fieldset className="field">
      <legend className="field-label">Ink</legend>
      <label className="choice">
        <input
          type="radio"
          name="print-style"
          value="stock"
          checked={style === "stock"}
          onChange={() => onStyleChange("stock")}
        />
        <span>
          <strong>Black ink</strong>
          <span className="choice-hint">For red card stock or a print shop.</span>
        </span>
      </label>
      <label className="choice">
        <input
          type="radio"
          name="print-style"
          value="color"
          checked={style === "color"}
          onChange={() => onStyleChange("color")}
        />
        <span>
          <strong>Color print</strong>
          <span className="choice-hint">Prints the card color on plain paper. Uses more ink.</span>
        </span>
      </label>

      {style === "color" && (
        <div className="color-swatches" role="radiogroup" aria-label="Card color">
          {swatches.map((swatch) => (
            <label key={swatch} className="color-swatch" title={COLOR_NAMES[swatch] || swatch}>
              <input
                type="radio"
                name="print-color"
                value={swatch}
                checked={color === swatch}
                onChange={() => onColorChange(swatch)}
                aria-label={COLOR_NAMES[swatch] || swatch}
              />
              <span className="color-swatch-dot" style={{ background: swatch }} />
            </label>
          ))}
          <label className={`color-swatch color-swatch-custom ${isCustom ? "is-checked" : ""}`} title="Custom color">
            <input
              type="color"
              value={color.toLowerCase()}
              onChange={(e) => onColorChange(normalizeHex(e.target.value) || color)}
              aria-label="Custom card color"
            />
          </label>
        </div>
      )}
    </fieldset>
  );
}
