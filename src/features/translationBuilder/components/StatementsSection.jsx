import StatementRow from "./StatementRow";

export default function StatementsSection({
  schema,
  points,
  missingSet,
  onPointChange,
}) {
  return (
    <section className="translation-section">
      <h3 className="translation-section-title">Statements</h3>
      <div className="translation-points">
        {schema.map((point, index) => (
          <StatementRow
            key={point.key}
            point={point}
            index={index}
            value={points[point.key]}
            isMissing={missingSet.has(point.label)}
            onPointChange={onPointChange}
          />
        ))}
      </div>
    </section>
  );
}
