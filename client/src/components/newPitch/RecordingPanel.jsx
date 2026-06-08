const WAVEFORM_BAR_HEIGHTS = [40, 60, 80, 100, 70, 90, 50, 30, 80, 45, 25];

/**
 * Renders microphone recording controls, waveform, timer, and analysis status.
 *
 * Args:
 * @param {object} props - Component props.
 * @param {boolean} props.isRecording - Whether microphone recording is active.
 * @param {number} props.timeElapsed - Recording elapsed time in seconds.
 * @param {boolean} props.isAnalyzing - Whether audio analysis is in progress.
 * @param {boolean} props.isTextAnalyzing - Whether text analysis is in progress.
 * @param {Function} props.formatTime - Formats elapsed seconds for display.
 * @param {Function} props.startRecording - Starts microphone recording.
 * @param {Function} props.stopRecording - Stops microphone recording.
 * @param {object} props.canvasRef - Canvas ref used by waveform visualization.
 *
 * Returns:
 * @returns {JSX.Element} Recording panel with start and stop controls.
 */
export default function RecordingPanel({
  isRecording,
  timeElapsed,
  isAnalyzing,
  isTextAnalyzing,
  formatTime,
  startRecording,
  stopRecording,
  canvasRef,
}) {
  const statusText = isAnalyzing
    ? "Analyzing pitch with AI... Please wait."
    : isTextAnalyzing
    ? "Analyzing written pitch with AI... Please wait."
    : isRecording
    ? "Recording... click stop when finished"
    : "Click mic to start recording";

  return (
    <div className="card recording-card card--padded-xl">
      <div className="recording-card__shine"></div>

      <div className="recording-card__body">
        <div className={`recording-timer ${!isRecording ? "hidden" : ""}`}>
          <span className="recording-timer__dot"></span>
          <span>{formatTime(timeElapsed)}</span>
        </div>

        <div id="waveformStatic" className={`waveform ${isRecording ? "hidden" : ""}`}>
          {WAVEFORM_BAR_HEIGHTS.map((height, index) => (
            <div
              key={index}
              className="waveform__bar"
              style={{
                "--waveform-bar-height": `${height}%`,
                "--waveform-bar-delay": `${0.1 + index * 0.1}s`,
              }}
            />
          ))}
        </div>

        <canvas
          ref={canvasRef}
          className={`waveform-canvas ${isRecording ? "" : "hidden"}`}
          aria-hidden="true"
        />

        <div className="controls">
          <button
            type="button"
            onClick={startRecording}
            disabled={isRecording || isAnalyzing || isTextAnalyzing}
            className="ctrl-btn ctrl-btn--primary"
            aria-label="Start recording"
          >
            <span
              className="material-symbols-outlined ctrl-btn__icon--lg ctrl-btn__icon--filled"
            >
              mic
            </span>
          </button>

          <button
            type="button"
            onClick={stopRecording}
            disabled={!isRecording || isAnalyzing || isTextAnalyzing}
            className="ctrl-btn ctrl-btn--secondary ctrl-btn--secondary--danger"
            aria-label="Stop recording"
          >
            <span className="material-symbols-outlined ctrl-btn__icon">
              stop
            </span>
          </button>
        </div>

        <p className="recording-card__hint">{statusText}</p>
      </div>
    </div>
  );
}
