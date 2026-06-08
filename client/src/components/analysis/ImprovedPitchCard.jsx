function ImprovedAudioButton({ disabled, isGenerating, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="analysis-action-button"
    >
      <span className="material-symbols-outlined analysis-action-button__icon">
        {isGenerating ? "hourglass_top" : "volume_up"}
      </span>
      {isGenerating ? "Generating..." : "Hear Improved Pitch"}
    </button>
  );
}

export default function ImprovedPitchCard({
  improvedPitch,
  onHearImprovedPitch,
  isGeneratingImprovedAudio,
}) {
  return (
    <div className="card card--padded-lg analysis-card">
      <div className="analysis-card__header">
        <h3 className="analysis-card__title">Your Improved Pitch</h3>
        <ImprovedAudioButton
          onClick={onHearImprovedPitch}
          disabled={isGeneratingImprovedAudio || !improvedPitch}
          isGenerating={isGeneratingImprovedAudio}
        />
      </div>

      <p className="analysis-card__body">
        <span className="analysis-label analysis-label--improved">
          IMPROVED PITCH
        </span>
        "{improvedPitch || "No improved pitch available."}"
      </p>
    </div>
  );
}
