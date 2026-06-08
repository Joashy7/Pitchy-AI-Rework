/**
 * Renders typed pitch script input, word count, estimated time, and analyze action.
 *
 * Args:
 * @param {object} props - Component props.
 * @param {string} props.scriptText - Current typed pitch script.
 * @param {number} props.wordCount - Current script word count.
 * @param {string} props.estimatedTime - Estimated speaking time.
 * @param {boolean} props.isDisabled - Whether the analyze action is disabled.
 * @param {boolean} props.isTextAnalyzing - Whether text analysis is in progress.
 * @param {Function} props.onScriptChange - Called with new script text on textarea changes.
 * @param {Function} props.onAnalyzeScript - Called when the analyze button is clicked.
 *
 * Returns:
 * @returns {JSX.Element} Script input panel.
 */
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
