/**
 * Renders the notice shown when a text-only analysis has no delivery scores.
 *
 * Args:
 * @param {object} props - Component props.
 * @param {string} props.message - Text-only score analysis message.
 *
 * Returns:
 * @returns {JSX.Element} Text analysis notice card.
 */
export default function TextAnalysisNotice({ message }) {
  return (
    <div className="card card--padded-lg analysis-card">
      <div className="analysis-card__header analysis-card__header--start">
        <span className="material-symbols-outlined text-analysis-notice__icon">
          edit_document
        </span>

        <div>
          <h3 className="analysis-card__title analysis-card__title--strong">
            Text-Based Analysis
          </h3>
          <p className="analysis-card__subtitle">{message}</p>
        </div>
      </div>
    </div>
  );
}
