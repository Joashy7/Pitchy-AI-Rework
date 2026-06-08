import { Link } from "react-router-dom";

/**
 * Renders the temporary missing-analysis prompt.
 *
 * Args:
 * @param {object} props - Component props.
 * @param {boolean} props.isFading - Whether the prompt is in its fade-out state.
 *
 * Returns:
 * @returns {JSX.Element} Temporary missing-analysis status prompt.
 */
function MissingAnalysisPrompt({ isFading }) {
  return (
    <div
      role="status"
      className={`missing-analysis-prompt ${isFading ? "is-fading" : ""}`}
    >
      <span className="material-symbols-outlined missing-analysis-prompt__icon">
        psychology
      </span>
      <div>
        <p className="missing-analysis-prompt__title">No analysis selected</p>
        <p className="missing-analysis-prompt__body">
          Select an analysis from Dashboard or record a new pitch.
        </p>
      </div>
    </div>
  );
}

/**
 * Renders the fallback page shown when no pitch analysis is selected.
 *
 * Args:
 * @param {object} props - Component props.
 * @param {boolean} props.showPrompt - Whether to show the temporary prompt.
 * @param {boolean} props.isPromptFading - Whether the temporary prompt should fade.
 *
 * Returns:
 * @returns {JSX.Element} Missing-analysis page with dashboard and new-pitch actions.
 */
export default function MissingAnalysisState({ showPrompt, isPromptFading }) {
  return (
    <>
      {showPrompt ? <MissingAnalysisPrompt isFading={isPromptFading} /> : null}

      <section className="page-section">
        <div className="page-header">
          <h2 className="page-header__title">AI Feedback</h2>
          <p className="page-header__subtitle">
            Choose a saved pitch analysis or create a fresh recording.
          </p>
        </div>

        <div className="card card--padded-lg analysis-card--narrow">
          <h3 className="analysis-card__title analysis-card__title--strong">
            No pitch analysis is loaded
          </h3>
          <p className="analysis-card__body">
            Pick an existing result from your dashboard, or record a new pitch to generate AI feedback.
          </p>
          <div className="analysis-card__actions">
            <Link
              to="/dashboard"
              className="pitch-gradient text-on-primary-fixed font-headline font-bold text-sm px-6 py-2 rounded-full active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              Go to Dashboard
            </Link>
            <Link
              to="/new-pitch"
              className="bg-surface-container-highest text-on-surface font-headline font-bold text-sm px-6 py-2 rounded-full active:scale-95 transition-all"
            >
              Record New Pitch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
