export default function ScriptPanel({
  scriptText,
  wordCount,
  estimatedTime,
  isDisabled,
  isTextAnalyzing,
  onScriptChange,
  onAnalyzeScript,
}) {
  return (
    <div className="card card--padded-lg">
      <div className="script-card__header">
        <h3 className="script-card__title">Pitch Script</h3>

        <div className="script-card__meta">
          <span className="meta-pill">Word Count: {wordCount}</span>
          <span className="meta-pill">Est. Time: {estimatedTime}</span>
        </div>
      </div>

      <textarea
        className="script-textarea"
        placeholder="Start typing your pitch here..."
        value={scriptText}
        onChange={(event) => onScriptChange(event.target.value)}
      />

      <div className="script-card__actions">
        <button
          type="button"
          onClick={onAnalyzeScript}
          disabled={isDisabled}
          className="btn-primary"
        >
          {isTextAnalyzing ? "Analyzing..." : "Analyze Pitch"}
        </button>
      </div>
    </div>
  );
}
