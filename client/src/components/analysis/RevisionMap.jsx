/**
 * Renders one field in a sentence-level revision item.
 *
 * Args:
 * @param {object} props - Component props.
 * @param {string} props.label - Field label.
 * @param {React.ReactNode} props.children - Field body.
 * @param {string} [props.tone] - Visual tone class suffix.
 * @param {boolean} [props.quote] - Whether to wrap body text in quotes.
 *
 * Returns:
 * @returns {JSX.Element|null} Revision field, or null when children is empty.
 */
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

/**
 * Renders sentence-level revision suggestions from Gemini analysis.
 *
 * Args:
 * @param {object} props - Component props.
 * @param {object[]} props.regions - Modification regions to render.
 *
 * Returns:
 * @returns {JSX.Element|null} Revision map card, or null when there are no regions.
 */
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
