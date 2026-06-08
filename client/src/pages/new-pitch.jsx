import React, { useState } from "react";
import AppShell from "../components/layout/AppShell";
import { useMicrophone } from "../hooks/useMicrophone";

function NewPitch() {
  const {
    isRecording,
    timeElapsed,
    isAnalyzing,
    formatTime,
    startRecording,
    stopRecording,
    canvasRef,
  } = useMicrophone();

  const [scriptText, setScriptText] = useState("");
  const [wordCount, setWordCount] = useState(0);

  const handleScriptChange = (e) => {
    const text = e.target.value;
    setScriptText(text);
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
  };

  const estimateTime = () => {
    const avgWpm = 130;
    const minutes = Math.ceil(wordCount / avgWpm);
    const secs = ((wordCount / avgWpm) * 60) % 60;
    return `${minutes}:${Math.floor(secs)
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <AppShell>
      <section className="page-section">
          <div className="page-header">
            <div className="live-badge">
              <span className="live-badge__dot"></span>
              <span className="live-badge__label">Live Session</span>
            </div>

            <h2 className="page-header__title">Hone Your Narrative.</h2>

            <p className="page-header__subtitle">
              Speak your vision or draft the core components. Our AI will analyze your
              tone, pace, and value proposition in real-time.
            </p>
          </div>

          <div className="bento-grid">
            <div className="bento-main">
              <div className="card recording-card card--padded-xl">
                <div className="recording-card__shine"></div>

                <div className="recording-card__body">
                  <div
                    className={`recording-timer ${!isRecording ? "hidden" : ""}`}
                  >
                    <span className="recording-timer__dot"></span>
                    <span>{formatTime(timeElapsed)}</span>
                  </div>

                  <div id="waveformStatic" className={`waveform ${isRecording ? "hidden" : ""}`}>
                    {[40, 60, 80, 100, 70, 90, 50, 30, 80, 45, 25].map(
                      (height, index) => (
                        <div
                          key={index}
                          className="waveform__bar"
                          style={{
                            height: `${height}%`,
                            animationDelay: `${0.1 + index * 0.1}s`,
                          }}
                        ></div>
                      )
                    )}
                  </div>

                  <canvas
                    ref={canvasRef}
                    className={isRecording ? "" : "hidden"}
                    aria-hidden="true"
                    style={{ width: "100%", height: "120px" }}
                  ></canvas>

                  <div className="controls">
                    <button
                      className="ctrl-btn ctrl-btn--secondary"
                      aria-label="Voice settings"
                    >
                      <span className="material-symbols-outlined ctrl-btn__icon">
                        settings_voice
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={isRecording || isAnalyzing}
                      className="ctrl-btn ctrl-btn--primary"
                      aria-label="Start recording"
                    >
                      <span
                        className="material-symbols-outlined ctrl-btn__icon--lg"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        mic
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={stopRecording}
                      disabled={!isRecording || isAnalyzing}
                      className="ctrl-btn ctrl-btn--secondary ctrl-btn--secondary--danger"
                      aria-label="Stop recording"
                    >
                      <span className="material-symbols-outlined ctrl-btn__icon">
                        stop
                      </span>
                    </button>
                  </div>

                  <p className="recording-card__hint">
                    {isAnalyzing
                      ? "Analyzing pitch with AI... Please wait."
                      : isRecording
                      ? "Recording… click stop when finished"
                      : "Click mic to start recording"}
                  </p>
                </div>
              </div>

              <div className="card card--padded-lg">
                <div className="script-card__header">
                  <h3 className="script-card__title">Pitch Script</h3>

                  <div className="script-card__meta">
                    <span className="meta-pill">Word Count: {wordCount}</span>
                    <span className="meta-pill">Est. Time: {estimateTime()}</span>
                  </div>
                </div>

                <textarea
                  className="script-textarea"
                  placeholder="Start typing your pitch here…"
                  value={scriptText}
                  onChange={handleScriptChange}
                ></textarea>

                <div className="script-card__actions">
                  <button className="btn-ghost">Save Draft</button>
                  <button className="btn-primary">Analyze Pitch</button>
                </div>
              </div>
            </div>

            <div className="bento-sidebar">
              <div className="card card--padded-sm insights-card">
                <h4 className="insights-card__heading">Real-time Insights</h4>

                <div className="insights-list">
                  <div className="insight insight--primary">
                    <span className="material-symbols-outlined insight__icon--primary">
                      auto_awesome
                    </span>

                    <div>
                      <p className="insight__title">Strong Opening</p>
                      <p className="insight__body">
                        Your hook effectively captures the problem space. Consider
                        adding a specific metric here.
                      </p>
                    </div>
                  </div>

                  <div className="insight insight--tertiary">
                    <span className="material-symbols-outlined insight__icon--tertiary">
                      speed
                    </span>

                    <div>
                      <p className="insight__title">Pacing Alert</p>
                      <p className="insight__body">
                        You're speaking at 160 WPM. Slow down during the Solution
                        phase for maximum impact.
                      </p>
                    </div>
                  </div>

                  <div className="insight insight--secondary">
                    <span className="material-symbols-outlined insight__icon--secondary">
                      psychology
                    </span>

                    <div>
                      <p className="insight__title">Tone Analysis</p>
                      <p className="insight__body">
                        Confidence level: High. Emotional resonance is currently
                        neutral.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card card--padded-sm">
                <h4 className="sentiment-card__heading">Sentiment Arc</h4>

                <div className="sentiment-bar">
                  <div
                    className="sentiment-bar__segment"
                    style={{ width: "20%", background: "rgba(60,144,255,0.4)" }}
                  ></div>
                  <div
                    className="sentiment-bar__segment"
                    style={{ width: "30%", background: "var(--color-primary)" }}
                  ></div>
                  <div
                    className="sentiment-bar__segment"
                    style={{ width: "15%", background: "var(--color-tertiary)" }}
                  ></div>
                  <div
                    className="sentiment-bar__segment"
                    style={{
                      width: "35%",
                      background: "var(--color-primary-container)",
                    }}
                  ></div>
                </div>

                <div className="sentiment-bar__labels">
                  <span className="sentiment-bar__label">Problem</span>
                  <span className="sentiment-bar__label">Solution</span>
                  <span className="sentiment-bar__label">Call to Action</span>
                </div>
              </div>

              <div className="pro-tip-card">
                <img
                  className="pro-tip-card__bg"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtYeE32SaV-fsXsudAa27v163HqFE1LEq92lN681UgyqxzGiaKZ1neS_JJik-Hn2hheVhqx0vwsn77Ep_56OZOiHbG9fJji2dCdKz4tDxuesIsQrY5Y6UH-kkCF7Db_wcRIFo1HpqZdvOuuTFTTCVLb51Hy4UKdVG_CqJWFELJjkUcmeoU0s4dhvhgRzn0dt6H2oY6y2HdMGj4q1E4qk0iA_gop2lL940jgYGL74-N-oY5Pij6hyyyQfl0KJYlo9e0X_4B7Usd1HQ"
                  alt="Modern tech hub at dusk"
                />

                <div className="pro-tip-card__overlay"></div>

                <div className="pro-tip-card__content">
                  <div className="pro-tip-card__label-row">
                    <span className="material-symbols-outlined pro-tip-card__label-icon">
                      lightbulb
                    </span>
                    <span className="pro-tip-card__label">Pro Tip</span>
                  </div>

                  <p className="pro-tip-card__quote">
                    "The best pitches don't just state facts; they tell a story where
                    the customer is the hero and your product is the sword."
                  </p>
                </div>
              </div>
            </div>
          </div>
      </section>
    </AppShell>
  );
}

export default NewPitch;
