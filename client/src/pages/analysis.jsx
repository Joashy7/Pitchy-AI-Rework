import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Analysis() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("pitchPalResults");
    if (!raw) {
      alert("No analysis data found. Please record a pitch first.");
      navigate("/new-pitch");
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setData(parsed);
    } catch (error) {
      console.error("Failed to parse analysis data:", error);
      alert("Error loading analysis data");
      navigate("/new-pitch");
    }
  }, [navigate]);

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

  if (!data) {
    return <div>Loading...</div>;
  }

  const transcript = data.transcript || "No transcript available.";
  const clarity = Number(data.clarity || 0);
  const persuasiveness = Number(data.persuasiveness || 0);
  const confidence = Number(data.confidence || 0);
  const narrativeFlow = Number(data.narrative_flow || 0);
  const overall = Number(data.overall_score || 0);
  const summaryFeedback = data.summary_feedback || data.feedback || "No summary available.";
  const strongPoints = Array.isArray(data.strong_points) ? data.strong_points : [];
  const needsFocus = Array.isArray(data.needs_focus) ? data.needs_focus : [];

  const circumference = 282.7;
  const strokeDashoffset = circumference - (overall / 100) * circumference;

  return (
    <div className="dark">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ padding: "var(--space-8)" }}>
          <div className="sidebar__brand">
            <div className="sidebar__logo">
              <span
                className="material-symbols-outlined text-white"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                rocket_launch
              </span>
            </div>

            <div>
              <p className="sidebar__app-name">Pitchy-AI</p>
              <p className="sidebar__app-tagline">Your Pitch. Perfected.</p>
            </div>
          </div>

          <nav className="sidebar__nav">
            <a href="/landing" className="sidebar__nav-link">
              <span className="material-symbols-outlined">home</span>
              Home
            </a>

            <a href="/dashboard" className="sidebar__nav-link">
              <span className="material-symbols-outlined">dashboard</span>
              Dashboard
            </a>

            <a href="/analysis" className="sidebar__nav-link">
              <span className="material-symbols-outlined">psychology</span>
              AI Feedback
            </a>

            <a href="#" className="sidebar__nav-link">
              <span className="material-symbols-outlined">settings_suggest</span>
              Settings
            </a>
          </nav>
        </div>

        <div className="sidebar__footer">
          <div className="upgrade-card">
            <p className="upgrade-card__label">Upgrade to Pro</p>
            <p className="upgrade-card__body">Unlock advanced neural analysis</p>
            <button className="upgrade-card__btn">Get Started</button>
          </div>

          <nav className="sidebar__footer-nav">
            <a href="#" className="sidebar__footer-link">
              <span className="material-symbols-outlined">help</span>
              Help Center
            </a>

            <a href="#" className="sidebar__footer-link">
              <span className="material-symbols-outlined">logout</span>
              Logout
            </a>
          </nav>
        </div>
      </aside>

      {/* Main Body */}
      <main className="main-canvas">
        <header className="bg-[#121416]/60 backdrop-blur-xl border-b border-[#414754]/15 h-16 sticky top-0 z-40 flex justify-between items-center px-8 max-w-[1920px] mx-auto">
          <div className="flex items-center gap-8">
            <div className="relative hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                search
              </span>

              <input
                className="bg-surface-container-lowest border-none rounded-full py-1.5 pl-10 pr-4 text-xs text-on-surface focus:ring-1 focus:ring-primary w-64 placeholder:text-slate-600"
                placeholder="Search pitches..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="pitch-gradient text-on-primary-fixed font-headline font-bold text-sm px-6 py-2 rounded-full active:scale-95 transition-all shadow-lg shadow-primary/20">
              <a href="/new-pitch">New Pitch</a>
            </button>

            <div className="flex items-center gap-2 border-l border-outline-variant/30 pl-4">
              <button className="p-2 text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">notifications</span>
              </button>

              <button className="p-2 text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">settings</span>
              </button>

              <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/30">
                <img
                  alt="User profile"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEEkbMJ1oKR7lOHtujcFiuIzNc3K1uVHXipnX4-Rmtd2IXcQ0PrXPdhTjvL6zX0QvoJ64XX_0TiH-xL8XmiuCr5wooUWjk31OoG6C2n714SEQs-JR_F53Q2jZGPNlp7LISbArZLZZ5qGMTsFhaE1NX7EeScxjResy2KGnHpbMMSwgKZwH7gnWqSe0ZSlIDj3kLAvPajb2VZJie9zp8y5ud-GXDXFbyt_2rz7oPywnrlvbBvh8OeDHDuIB0k1ClJnbAWqBBi1TjVmo"
                />
              </div>
            </div>
          </div>
        </header>

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
        </section>
      </main>
    </div>
  );
}

export default Analysis;
