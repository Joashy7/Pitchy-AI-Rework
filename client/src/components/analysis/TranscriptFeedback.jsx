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
