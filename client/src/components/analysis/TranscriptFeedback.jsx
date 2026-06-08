/**
 * Renders original transcript audio playback button.
 *
 * Args:
 * @param {object} props - Component props.
 * @param {Function} props.onClick - Playback click handler.
 * @param {boolean} props.isGenerating - Whether audio generation is in progress.
 *
 * Returns:
 * @returns {JSX.Element} Transcript audio button.
 */
function AudioButton({ onClick, isGenerating }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isGenerating}
      className="analysis-action-button"
    >
      <span className="material-symbols-outlined analysis-action-button__icon">
        {isGenerating ? "hourglass_top" : "volume_up"}
      </span>
      {isGenerating ? "Generating..." : "Hear Pitch"}
    </button>
  );
}

/**
 * Renders one strong-point or focus feedback item.
 *
 * Args:
 * @param {object} props - Component props.
 * @param {object} props.item - Feedback item with timestamp, quote, and explanation.
 * @param {string} props.tone - Feedback tone, either "strong" or "focus".
 *
 * Returns:
 * @returns {JSX.Element} Feedback item card.
 */
function FeedbackItem({ item, tone }) {
  const isStrong = tone === "strong";
  const label = isStrong ? "AI Co-pilot Insight" : "Improvement Area";
  const icon = isStrong ? "auto_awesome" : "warning";

  return (
    <div className="feedback-item">
      <p className="feedback-item__quote-row">
        <span className={`analysis-label analysis-label--${tone}`}>
          {item.timestamp || "00:00"}
        </span>
        <span className={`feedback-item__quote feedback-item__quote--${tone}`}>
          {item.quote || ""}
        </span>
      </p>

      <div className={`feedback-item__body feedback-item__body--${tone}`}>
        <p className={`feedback-item__heading feedback-item__heading--${tone}`}>
          <span className="material-symbols-outlined feedback-item__icon">
            {icon}
          </span>
          {label}
        </p>
        <p className="feedback-item__explanation">
          "{item.explanation || ""}"
        </p>
      </div>
    </div>
  );
}

/**
 * Renders transcript text with strong points and improvement focus areas.
 *
 * Args:
 * @param {object} props - Component props.
 * @param {string} props.transcript - Original pitch transcript.
 * @param {object[]} props.strongPoints - Strong feedback items.
 * @param {object[]} props.needsFocus - Improvement feedback items.
 * @param {Function} props.onHearPitch - Click handler for original transcript audio playback.
 * @param {boolean} props.isGeneratingAudio - Whether original transcript audio is generating.
 *
 * Returns:
 * @returns {JSX.Element} Transcript and feedback card.
 */
export default function TranscriptFeedback({
  transcript,
  strongPoints,
  needsFocus,
  onHearPitch,
  isGeneratingAudio,
}) {
  return (
    <div className="card card--padded-lg analysis-card">
      <div className="analysis-card__header">
        <h3 className="analysis-card__title">Transcript & Feedback</h3>
        <AudioButton onClick={onHearPitch} isGenerating={isGeneratingAudio} />
      </div>

      <p className="analysis-card__body">
        <span className="analysis-label analysis-label--transcript">
          TRANSCRIPT
        </span>
        "{transcript}"
      </p>

      {strongPoints.map((item, index) => (
        <FeedbackItem key={`strong-${index}`} item={item} tone="strong" />
      ))}

      {needsFocus.map((item, index) => (
        <FeedbackItem key={`focus-${index}`} item={item} tone="focus" />
      ))}
    </div>
  );
}
