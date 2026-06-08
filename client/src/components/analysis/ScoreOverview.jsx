const SCORE_RING_CIRCUMFERENCE = 282.7;

/**
 * Renders one score metric bar.
 *
 * Args:
 * @param {object} props - Component props.
 * @param {string} props.label - Metric label.
 * @param {number} props.value - Metric score from 0 to 100.
 *
 * Returns:
 * @returns {JSX.Element} Score metric bar.
 */
const MetricBar = ({ label, value }) => (
  <div className="metric-bar">
    <div className="metric-bar__header">
      <p className="metric-bar__label">{label}</p>
      <span>{value}%</span>
    </div>

    <div className="metric-bar__track">
      <div
        className="metric-bar__fill"
        style={{ "--metric-value": `${value}%` }}
      />
    </div>
  </div>
);

/**
 * Renders score summary and metric bars for audio analysis.
 *
 * Args:
 * @param {object} props - Component props.
 * @param {object} props.scores - Score object with clarity, persuasiveness, confidence, narrativeFlow, and overall values.
 *
 * Returns:
 * @returns {JSX.Element} Score overview card set.
 */
export default function ScoreOverview({ scores }) {
  const strokeDashoffset =
    SCORE_RING_CIRCUMFERENCE - (scores.overall / 100) * SCORE_RING_CIRCUMFERENCE;

  return (
    <div className="score-overview">
      <div className="card card--padded-lg score-overview__total">
        <svg
          viewBox="0 0 100 100"
          className="score-overview__ring"
          style={{ "--score-offset": strokeDashoffset }}
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(60, 144, 255, 0.2)"
            strokeWidth="3"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="3"
            strokeDasharray={SCORE_RING_CIRCUMFERENCE}
            className="score-overview__ring-progress"
            strokeLinecap="round"
          />
        </svg>

        <div className="score-overview__summary">
          <p className="score-overview__value">{scores.overall}</p>
          <p className="score-overview__label">Overall Score</p>
        </div>
      </div>

      <div className="card card--padded-lg">
        <MetricBar label="Clarity" value={scores.clarity} />
        <MetricBar label="Persuasiveness" value={scores.persuasiveness} />
        <MetricBar label="Confidence" value={scores.confidence} />
        <MetricBar label="Narrative Flow" value={scores.narrativeFlow} />
      </div>
    </div>
  );
}
