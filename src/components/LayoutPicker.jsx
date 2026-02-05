const LAYOUT_OPTIONS = [
  { value: 4, label: "4 cards (2x2)", description: "Standard layout" },
  { value: 6, label: "6 cards (2x3)", description: "More cards, smaller text" },
  { value: 8, label: "8 cards (2x4)", description: "Compact layout" },
  { value: 12, label: "12 cards (3x4)", description: "Maximum density" },
];

/**
 * Layout picker component for selecting cards per page.
 */
export default function LayoutPicker({ value, onChange, validLayouts }) {
  // Filter options based on valid layouts from API config
  const options = validLayouts
    ? LAYOUT_OPTIONS.filter((opt) => validLayouts.includes(opt.value))
    : LAYOUT_OPTIONS;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label htmlFor="layout-picker" style={{ fontWeight: 500 }}>
        Cards per page
      </label>
      <select
        id="layout-picker"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
