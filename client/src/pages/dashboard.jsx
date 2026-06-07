import React, { useState } from "react";

function Dashboard() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const pitchData = [
    {
      id: 1,
      name: "Seed Round Prep",
      description: "Series A Pitch Deck v4",
      date: "Oct 24, 2023",
      persona: "The VC Critic",
      duration: "12:45",
      score: 82,
      status: "IMPROVING",
    },
    {
      id: 2,
      name: "Product Launch Keynote",
      description: "Internal Stakeholders",
      date: "Oct 22, 2023",
      persona: "The Friendly Mentor",
      duration: "08:12",
      score: 94,
      status: "ELITE",
    },
    {
      id: 3,
      name: "Client Onboarding",
      description: "Enterprise Sales Deck",
      date: "Oct 19, 2023",
      persona: "The Hard Negotiator",
      duration: "15:30",
      score: 64,
      status: "ACTION NEEDED",
    },
    {
      id: 4,
      name: "Elevator Pitch v2",
      description: "Networking Event Prep",
      date: "Oct 15, 2023",
      persona: "The VC Critic",
      duration: "02:00",
      score: 78,
      status: "IMPROVING",
    },
  ];

  const totalPitches = 24;
  const avgScore = 86;
  const totalRecordingTime = "4.2";
  const improvementRate = "+12%";

  const getStatusColor = (status) => {
    switch (status) {
      case "ELITE":
        return "status-elite";
      case "IMPROVING":
        return "status-improving";
      case "ACTION NEEDED":
        return "status-action";
      default:
        return "status-default";
    }
  };

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

            <a href="/dashboard" className="sidebar__nav-link active">
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
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", letterSpacing: "1px", color: "#8BA3FF", textTransform: "uppercase" }}>
                Performance Vault
              </span>
            </div>

            <h2 className="page-header__title">Pitch Archive</h2>

            <p className="page-header__subtitle">
              Review and refine your past performances.
            </p>
          </div>

          {/* Stats Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "40px" }}>
            <div className="card card--padded-lg" style={{ backgroundColor: "#1a1d21", borderColor: "#414754" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "24px" }}>
                <div style={{ width: "40px", height: "40px", backgroundColor: "#2a2f38", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="material-symbols-outlined" style={{ color: "#8BA3FF" }}>
                    note_stack
                  </span>
                </div>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#8BA3FF", backgroundColor: "rgba(139, 163, 255, 0.1)", padding: "6px 12px", borderRadius: "6px" }}>
                  +3 this week
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                Total Pitches
              </p>
              <p style={{ fontSize: "32px", fontWeight: "700", color: "#FFFFFF" }}>{totalPitches}</p>
            </div>

            <div className="card card--padded-lg" style={{ backgroundColor: "#1a1d21", borderColor: "#414754" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "24px" }}>
                <div style={{ width: "40px", height: "40px", backgroundColor: "#2a2f38", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "20px" }}>⭐</span>
                </div>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#F59E0B", backgroundColor: "rgba(245, 158, 11, 0.1)", padding: "6px 12px", borderRadius: "6px" }}>
                  Top 5%
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                Avg. Score
              </p>
              <p style={{ fontSize: "32px", fontWeight: "700", color: "#FFFFFF" }}>
                {avgScore}<span style={{ fontSize: "20px", color: "#9CA3AF" }}>/100</span>
              </p>
            </div>

            <div className="card card--padded-lg" style={{ backgroundColor: "#1a1d21", borderColor: "#414754" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "24px" }}>
                <div style={{ width: "40px", height: "40px", backgroundColor: "#2a2f38", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="material-symbols-outlined" style={{ color: "#8BA3FF" }}>
                    schedule
                  </span>
                </div>
              </div>
              <p style={{ fontSize: "12px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                Total Recording Time
              </p>
              <p style={{ fontSize: "32px", fontWeight: "700", color: "#FFFFFF" }}>
                {totalRecordingTime}<span style={{ fontSize: "20px", color: "#9CA3AF" }}> hrs</span>
              </p>
            </div>

            <div className="card card--padded-lg" style={{ backgroundColor: "#1a1d21", borderColor: "#414754" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "24px" }}>
                <div style={{ width: "40px", height: "40px", backgroundColor: "#2a2f38", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="material-symbols-outlined" style={{ color: "#22C55E" }}>
                    trending_up
                  </span>
                </div>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#22C55E", backgroundColor: "rgba(34, 197, 94, 0.1)", padding: "6px 12px", borderRadius: "6px" }}>
                  {improvementRate}
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                Improvement Rate
              </p>
              <p style={{ fontSize: "32px", fontWeight: "700", color: "#FFFFFF" }}>Steady</p>
            </div>
          </div>

          {/* Pitch History Section */}
          <div className="card card--padded-lg">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#FFFFFF" }}>Pitch History</h3>
              <div style={{ display: "flex", gap: "12px" }}>
                <button style={{ fontSize: "12px", color: "#8BA3FF", backgroundColor: "transparent", border: "1px solid #414754", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", transition: "all 0.2s" }}>
                  All Personas
                </button>
                <button style={{ fontSize: "12px", color: "#8BA3FF", backgroundColor: "transparent", border: "1px solid #414754", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", transition: "all 0.2s" }}>
                  Last 30 Days
                </button>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #414754" }}>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Pitch Name
                    </th>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Date
                    </th>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      AI Persona
                    </th>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Duration
                    </th>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Score
                    </th>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Status
                    </th>
                    <th style={{ padding: "16px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pitchData.map((pitch) => (
                    <tr key={pitch.id} style={{ borderBottom: "1px solid #2a2f38", transition: "background-color 0.2s" }}>
                      <td style={{ padding: "16px" }}>
                        <div>
                          <p style={{ fontSize: "14px", fontWeight: "600", color: "#FFFFFF", marginBottom: "4px" }}>
                            {pitch.name}
                          </p>
                          <p style={{ fontSize: "12px", color: "#9CA3AF" }}>{pitch.description}</p>
                        </div>
                      </td>
                      <td style={{ padding: "16px", fontSize: "14px", color: "#FFFFFF" }}>
                        {pitch.date}
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "32px", height: "32px", backgroundColor: "#2a2f38", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#9CA3AF" }}>
                              person
                            </span>
                          </div>
                          <span style={{ fontSize: "14px", color: "#FFFFFF" }}>{pitch.persona}</span>
                        </div>
                      </td>
                      <td style={{ padding: "16px", fontSize: "14px", color: "#FFFFFF" }}>
                        {pitch.duration}
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span style={{ fontSize: "16px", fontWeight: "700", color: "#FFFFFF" }}>
                          {pitch.score}
                        </span>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "600",
                            padding: "6px 12px",
                            borderRadius: "4px",
                            backgroundColor:
                              pitch.status === "ELITE"
                                ? "rgba(245, 158, 11, 0.15)"
                                : pitch.status === "IMPROVING"
                                ? "rgba(59, 130, 246, 0.15)"
                                : "rgba(239, 68, 68, 0.15)",
                            color:
                              pitch.status === "ELITE"
                                ? "#F59E0B"
                                : pitch.status === "IMPROVING"
                                ? "#3B82F6"
                                : "#EF4444",
                          }}
                        >
                          {pitch.status}
                        </span>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <a
                          href="#"
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#8BA3FF",
                            textDecoration: "none",
                            cursor: "pointer",
                            transition: "color 0.2s",
                          }}
                          onMouseEnter={(e) => (e.target.style.color = "#A8B8FF")}
                          onMouseLeave={(e) => (e.target.style.color = "#8BA3FF")}
                        >
                          View Analysis
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #414754" }}>
              <p style={{ fontSize: "12px", color: "#9CA3AF" }}>Showing 1-4 of {totalPitches} pitches</p>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  style={{
                    width: "32px",
                    height: "32px",
                    backgroundColor: "#2a2f38",
                    border: "1px solid #414754",
                    borderRadius: "4px",
                    color: "#9CA3AF",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#3a3f48";
                    e.target.style.color = "#FFFFFF";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#2a2f38";
                    e.target.style.color = "#9CA3AF";
                  }}
                >
                  ‹
                </button>
                {[1, 2, 3, 6].map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      width: "32px",
                      height: "32px",
                      backgroundColor: page === 1 ? "#5B7FFF" : "#2a2f38",
                      border: "1px solid #414754",
                      borderRadius: "4px",
                      color: page === 1 ? "#FFFFFF" : "#9CA3AF",
                      cursor: "pointer",
                      fontWeight: page === 1 ? "600" : "400",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (page !== 1) {
                        e.target.style.backgroundColor = "#3a3f48";
                        e.target.style.color = "#FFFFFF";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (page !== 1) {
                        e.target.style.backgroundColor = "#2a2f38";
                        e.target.style.color = "#9CA3AF";
                      }
                    }}
                  >
                    {page}
                  </button>
                ))}
                <button
                  style={{
                    width: "32px",
                    height: "32px",
                    backgroundColor: "#2a2f38",
                    border: "1px solid #414754",
                    borderRadius: "4px",
                    color: "#9CA3AF",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#3a3f48";
                    e.target.style.color = "#FFFFFF";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#2a2f38";
                    e.target.style.color = "#9CA3AF";
                  }}
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
