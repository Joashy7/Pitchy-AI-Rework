import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";

const readStoredAnalysis = () => {
  const raw = localStorage.getItem("pitchPalResults");

  if (!raw) {
    return {
      data: null,
      error: "No analysis data found. Please record a pitch first.",
    };
  }

  try {
    return {
      data: JSON.parse(raw),
      error: "",
    };
  } catch (error) {
    console.error("Failed to parse analysis data:", error);
    return {
      data: null,
      error: "Error loading analysis data",
    };
  }
};

const getSafeScore = (value) => {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;

  return Math.min(100, Math.max(0, Math.round(score)));
};

const getFeedbackItems = (items) => (Array.isArray(items) ? items : []);

function Analysis() {
  const navigate = useNavigate();
  const [storedAnalysis] = useState(readStoredAnalysis);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isGeneratingImprovedAudio, setIsGeneratingImprovedAudio] = useState(false);
  const data = storedAnalysis.data;

  useEffect(() => {
    if (storedAnalysis.error) {
      alert(storedAnalysis.error);
      navigate("/new-pitch");
    }
  }, [navigate, storedAnalysis.error]);

  const handleHearPitch = async () => {
    if (!data?.transcript) return;

    setIsGeneratingAudio(true);
    try {
      const res = await fetch("http://localhost:3000/generate-pitch-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: data.transcript }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || "Failed to generate audio");
        return;
      }

      if (result.audioUrl) {
        const audio = new Audio(result.audioUrl);
        audio.play();
      }
    } catch (error) {
      console.error("TTS error:", error);
      alert("Could not generate pitch audio");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleHearImprovedPitch = async () => {
    const improvedPitch = data?.improvedPitch || data?.improved_transcript;
    if (!improvedPitch) return;

    setIsGeneratingImprovedAudio(true);
    try {
      const res = await fetch("http://localhost:3000/generate-pitch-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: improvedPitch }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || "Failed to generate audio");
        return;
      }

      if (result.audioUrl) {
        const audio = new Audio(result.audioUrl);
        audio.play();
      }
    } catch (error) {
      console.error("TTS error:", error);
      alert("Could not generate improved pitch audio");
    } finally {
      setIsGeneratingImprovedAudio(false);
    }
  };

  if (!data) {
    return <div>Loading...</div>;
  }

  const transcript = data.transcript || "No transcript available.";
  const improvedPitch = data.improvedPitch || data.improved_transcript || "";
  const clarity = getSafeScore(data.clarity);
  const persuasiveness = getSafeScore(data.persuasiveness);
  const confidence = getSafeScore(data.confidence);
  const narrativeFlow = getSafeScore(data.narrative_flow);
  const overall = getSafeScore(data.overall_score);
  const summaryFeedback = data.summary_feedback || data.feedback || "No summary available.";
  const strongPoints = getFeedbackItems(data.strong_points);
  const needsFocus = getFeedbackItems(data.needs_focus);

  const circumference = 282.7;
  const strokeDashoffset = circumference - (overall / 100) * circumference;

  return (
    <AppShell>
      <section className="page-section">
          <div className="page-header">
            <h2 className="page-header__title">Your Pitch Analysis</h2>

            <p className="page-header__subtitle">{summaryFeedback}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
            {/* Overall Score Ring */}
            <div className="card card--padded-lg" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <svg
                viewBox="0 0 100 100"
                style={{
                  width: "200px",
                  height: "200px",
                  transform: "rotate(-90deg)",
                  marginBottom: "1rem",
                }}
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
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{
                    transition: "stroke-dashoffset 0.3s ease",
                  }}
                  strokeLinecap="round"
                />
              </svg>

              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-primary)" }}>
                  {overall}
                </p>
                <p style={{ color: "var(--color-on-surface)", fontSize: "0.9rem" }}>Overall Score</p>
              </div>
            </div>

            {/* Metrics */}
            <div className="card card--padded-lg">
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <p style={{ fontWeight: "500" }}>Clarity</p>
                  <span>{clarity}%</span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    background: "rgba(60, 144, 255, 0.2)",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${clarity}%`,
                      height: "100%",
                      background: "var(--color-primary)",
                      transition: "width 0.3s ease",
                    }}
                  ></div>
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <p style={{ fontWeight: "500" }}>Persuasiveness</p>
                  <span>{persuasiveness}%</span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    background: "rgba(60, 144, 255, 0.2)",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${persuasiveness}%`,
                      height: "100%",
                      background: "var(--color-primary)",
                      transition: "width 0.3s ease",
                    }}
                  ></div>
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <p style={{ fontWeight: "500" }}>Confidence</p>
                  <span>{confidence}%</span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    background: "rgba(60, 144, 255, 0.2)",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${confidence}%`,
                      height: "100%",
                      background: "var(--color-primary)",
                      transition: "width 0.3s ease",
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <p style={{ fontWeight: "500" }}>Narrative Flow</p>
                  <span>{narrativeFlow}%</span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    background: "rgba(60, 144, 255, 0.2)",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${narrativeFlow}%`,
                      height: "100%",
                      background: "var(--color-primary)",
                      transition: "width 0.3s ease",
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Transcript Section */}
          <div className="card card--padded-lg" style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "600" }}>Transcript & Feedback</h3>
              <button
                onClick={handleHearPitch}
                disabled={isGeneratingAudio}
                style={{
                  padding: "0.5rem 1rem",
                  background: "var(--color-primary)",
                  color: "var(--color-on-primary)",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  opacity: isGeneratingAudio ? 0.6 : 1,
                }}
              >
                <span className="material-symbols-outlined" style={{ marginRight: "0.5rem", verticalAlign: "middle" }}>
                  {isGeneratingAudio ? "hourglass_top" : "volume_up"}
                </span>
                {isGeneratingAudio ? "Generating..." : "Hear Pitch"}
              </button>
            </div>

            <div>
              <p style={{ marginBottom: "1.5rem", lineHeight: "1.6", color: "var(--color-on-surface)" }}>
                <span
                  style={{
                    display: "inline-block",
                    background: "rgba(60, 144, 255, 0.2)",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "4px",
                    marginRight: "0.75rem",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                  }}
                >
                  TRANSCRIPT
                </span>
                "{transcript}"
              </p>

              {/* Strong Points */}
              {strongPoints.map((item, index) => (
                <div key={`strong-${index}`} style={{ marginBottom: "1.5rem" }}>
                  <p style={{ marginBottom: "0.5rem", color: "var(--color-on-surface)" }}>
                    <span
                      style={{
                        display: "inline-block",
                        background: "rgba(60, 144, 255, 0.2)",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "4px",
                        marginRight: "0.75rem",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                      }}
                    >
                      {item.timestamp || "00:00"}
                    </span>
                    <span
                      style={{
                        background: "rgba(60, 144, 255, 0.3)",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        color: "rgb(100, 200, 255)",
                      }}
                    >
                      {item.quote || ""}
                    </span>
                  </p>
                  <div
                    style={{
                      background: "rgba(60, 144, 255, 0.1)",
                      border: "1px solid rgba(60, 144, 255, 0.3)",
                      borderRadius: "6px",
                      padding: "1rem",
                      marginLeft: "2rem",
                    }}
                  >
                    <p style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", fontWeight: "600", color: "rgb(100, 200, 255)" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>
                        auto_awesome
                      </span>
                      AI Co-pilot Insight
                    </p>
                    <p style={{ color: "var(--color-on-surface-variant)" }}>"{item.explanation || ""}"</p>
                  </div>
                </div>
              ))}

              {/* Needs Focus */}
              {needsFocus.map((item, index) => (
                <div key={`focus-${index}`} style={{ marginBottom: "1.5rem" }}>
                  <p style={{ marginBottom: "0.5rem", color: "var(--color-on-surface)" }}>
                    <span
                      style={{
                        display: "inline-block",
                        background: "rgba(255, 193, 7, 0.2)",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "4px",
                        marginRight: "0.75rem",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                      }}
                    >
                      {item.timestamp || "00:00"}
                    </span>
                    <span
                      style={{
                        background: "rgba(255, 193, 7, 0.3)",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        color: "rgb(255, 215, 0)",
                      }}
                    >
                      {item.quote || ""}
                    </span>
                  </p>
                  <div
                    style={{
                      background: "rgba(255, 193, 7, 0.1)",
                      border: "1px solid rgba(255, 193, 7, 0.3)",
                      borderRadius: "6px",
                      padding: "1rem",
                      marginLeft: "2rem",
                    }}
                  >
                    <p style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", fontWeight: "600", color: "rgb(255, 215, 0)" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>
                        warning
                      </span>
                      Improvement Area
                    </p>
                    <p style={{ color: "var(--color-on-surface-variant)" }}>"{item.explanation || ""}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Improved Pitch Section */}
          <div className="card card--padded-lg" style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "600" }}>Your Improved Pitch</h3>
              <button
                onClick={handleHearImprovedPitch}
                disabled={isGeneratingImprovedAudio || !improvedPitch}
                style={{
                  padding: "0.5rem 1rem",
                  background: "var(--color-primary)",
                  color: "var(--color-on-primary)",
                  border: "none",
                  borderRadius: "6px",
                  cursor: improvedPitch ? "pointer" : "not-allowed",
                  fontSize: "0.9rem",
                  opacity: isGeneratingImprovedAudio || !improvedPitch ? 0.6 : 1,
                }}
              >
                <span className="material-symbols-outlined" style={{ marginRight: "0.5rem", verticalAlign: "middle" }}>
                  {isGeneratingImprovedAudio ? "hourglass_top" : "volume_up"}
                </span>
                {isGeneratingImprovedAudio ? "Generating..." : "Hear Improved Pitch"}
              </button>
            </div>

            <div>
              <p style={{ marginBottom: "1.5rem", lineHeight: "1.6", color: "var(--color-on-surface)" }}>
                <span
                  style={{
                    display: "inline-block",
                    background: "rgba(76, 175, 80, 0.2)",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "4px",
                    marginRight: "0.75rem",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "rgb(129, 219, 126)",
                  }}
                >
                  IMPROVED PITCH
                </span>
                "{improvedPitch || "No improved pitch available."}"
              </p>
            </div>
          </div>
      </section>
    </AppShell>
  );
}

export default Analysis;
