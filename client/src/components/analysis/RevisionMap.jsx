function RevisionField({
  label,
  children,
  tone = "default",
  quote = true,
}) {
  if (!children) return null;

  return (
    <div className={`revision-field revision-field--${tone}`}>
      <p className="revision-field__label">{label}</p>
      <p className="revision-field__body">
        {quote ? `"${children}"` : children}
      </p>
    </div>
  );
}

export default function RevisionMap({ regions }) {
  if (!regions.length) return null;

  return (
    <div className="card card--padded-lg analysis-card">
      <div className="revision-map__header">
        <h3 className="revision-map__title">Sentence-Level Revision Map</h3>
        <p className="analysis-card__subtitle">
          Specific sections of your pitch that can be tightened, clarified, or strengthened.
        </p>
      </div>

      <div className="revision-map__list">
        {regions.map((region, index) => (
          <div key={`${region.section}-${index}`} className="revision-map__item">
            <div className="revision-map__item-header">
              <div className="revision-map__meta">
                <span className="revision-map__section">{region.section}</span>
                <span className="revision-map__timestamp">{region.timestamp}</span>
              </div>
              <span className="material-symbols-outlined revision-map__icon">
                edit_note
              </span>
            </div>

            <RevisionField label="Original">{region.original}</RevisionField>
            <RevisionField label="Issue" quote={false}>{region.issue}</RevisionField>
            <RevisionField label="Suggested Edit" tone="success">
              {region.suggested_edit}
            </RevisionField>

            {region.reason ? (
              <p className="revision-map__reason">{region.reason}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
