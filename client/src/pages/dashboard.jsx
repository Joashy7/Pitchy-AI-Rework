import React, { useEffect, useMemo, useState } from "react";
import AppShell from "../components/layout/AppShell";

const API_BASE_URL = "http://localhost:3000";

const DEFAULT_STATS = {
  totalPitches: 0,
  avgScore: 0,
  totalRecordingTime: "0.0",
  newThisWeek: 0,
  scoreBadge: "Building",
  improvementRate: "+0%",
  improvementLabel: "Steady",
};

function Dashboard() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pitchData, setPitchData] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(DEFAULT_STATS);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const itemsPerPage = 4;

  useEffect(() => {
    let isActive = true;

    const loadDashboardData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/dashboard-data`);
        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.error || "Failed to load dashboard data");
        }

        if (isActive) {
          setPitchData(Array.isArray(result.pitches) ? result.pitches : []);
          setDashboardStats({ ...DEFAULT_STATS, ...(result.stats || {}) });
          setError("");
        }
      } catch (loadError) {
        console.error("Dashboard data error:", loadError);

        if (isActive) {
          setError(loadError.message || "Failed to load dashboard data");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isActive = false;
    };
  }, []);

  const filteredPitchData = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) return pitchData;

    return pitchData.filter((pitch) => {
      const searchableText = [
        pitch.name,
        pitch.description,
        pitch.persona,
        pitch.status,
        pitch.date,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [pitchData, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredPitchData.length / itemsPerPage));
  const paginatedPitchData = filteredPitchData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const visiblePages = useMemo(() => {
    const pages = [];
    const firstPage = Math.max(1, Math.min(currentPage - 1, totalPages - 3));
    const lastPage = Math.min(totalPages, firstPage + 3);

    for (let page = firstPage; page <= lastPage; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [currentPage, totalPages]);

  const totalPitches = dashboardStats.totalPitches;
  const avgScore = dashboardStats.avgScore;
  const totalRecordingTime = dashboardStats.totalRecordingTime;
  const improvementRate = dashboardStats.improvementRate;
  const showingStart = filteredPitchData.length ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const showingEnd = Math.min(currentPage * itemsPerPage, filteredPitchData.length);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    setCurrentPage((page) => Math.max(1, page - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((page) => Math.min(totalPages, page + 1));
  };

  const handleViewAnalysis = (pitch) => {
    localStorage.setItem(
      "pitchPalResults",
      JSON.stringify({
        transcript: pitch.transcript,
        improvedPitch: pitch.improvedPitch,
        improved_transcript: pitch.improvedPitch,
        overall_score: pitch.overall_score,
        summary_feedback: pitch.summary_feedback,
        clarity: pitch.clarity,
        persuasiveness: pitch.persuasiveness,
        confidence: pitch.confidence,
        narrative_flow: pitch.narrative_flow,
      })
    );
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "ELITE":
        return {
          backgroundColor: "rgba(245, 158, 11, 0.15)",
          color: "#F59E0B",
        };
      case "IMPROVING":
        return {
          backgroundColor: "rgba(59, 130, 246, 0.15)",
          color: "#3B82F6",
        };
      case "ACTION NEEDED":
        return {
          backgroundColor: "rgba(239, 68, 68, 0.15)",
          color: "#EF4444",
        };
      default:
        return {
          backgroundColor: "rgba(156, 163, 175, 0.15)",
          color: "#9CA3AF",
        };
    }
  };

  return (
    <AppShell
      activePage="dashboard"
      searchValue={searchTerm}
      onSearchChange={handleSearchChange}
    >
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
                  {dashboardStats.newThisWeek > 0 ? `+${dashboardStats.newThisWeek} this week` : "No new this week"}
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
                  <span className="material-symbols-outlined" style={{ color: "#F59E0B" }}>
                    grade
                  </span>
                </div>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#F59E0B", backgroundColor: "rgba(245, 158, 11, 0.1)", padding: "6px 12px", borderRadius: "6px" }}>
                  {dashboardStats.scoreBadge}
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
              <p style={{ fontSize: "32px", fontWeight: "700", color: "#FFFFFF" }}>{dashboardStats.improvementLabel}</p>
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
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#9CA3AF" }}>
                        Loading pitch history...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#EF4444" }}>
                        {error}
                      </td>
                    </tr>
                  ) : paginatedPitchData.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#9CA3AF" }}>
                        No saved pitches found.
                      </td>
                    </tr>
                  ) : paginatedPitchData.map((pitch) => (
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
                            ...getStatusStyle(pitch.status),
                          }}
                        >
                          {pitch.status}
                        </span>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <a
                          href="/analysis"
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#8BA3FF",
                            textDecoration: "none",
                            cursor: "pointer",
                            transition: "color 0.2s",
                          }}
                          onClick={() => handleViewAnalysis(pitch)}
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
              <p style={{ fontSize: "12px", color: "#9CA3AF" }}>
                Showing {showingStart}-{showingEnd} of {filteredPitchData.length} pitches
              </p>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  disabled={currentPage === 1}
                  onClick={handlePreviousPage}
                  style={{
                    width: "32px",
                    height: "32px",
                    backgroundColor: "#2a2f38",
                    border: "1px solid #414754",
                    borderRadius: "4px",
                    color: "#9CA3AF",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    opacity: currentPage === 1 ? 0.5 : 1,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage === 1) return;
                    e.target.style.backgroundColor = "#3a3f48";
                    e.target.style.color = "#FFFFFF";
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage === 1) return;
                    e.target.style.backgroundColor = "#2a2f38";
                    e.target.style.color = "#9CA3AF";
                  }}
                >
                  {"<"}
                </button>
                {visiblePages.map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      width: "32px",
                      height: "32px",
                      backgroundColor: page === currentPage ? "#5B7FFF" : "#2a2f38",
                      border: "1px solid #414754",
                      borderRadius: "4px",
                      color: page === currentPage ? "#FFFFFF" : "#9CA3AF",
                      cursor: "pointer",
                      fontWeight: page === currentPage ? "600" : "400",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (page !== currentPage) {
                        e.target.style.backgroundColor = "#3a3f48";
                        e.target.style.color = "#FFFFFF";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (page !== currentPage) {
                        e.target.style.backgroundColor = "#2a2f38";
                        e.target.style.color = "#9CA3AF";
                      }
                    }}
                  >
                    {page}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={handleNextPage}
                  style={{
                    width: "32px",
                    height: "32px",
                    backgroundColor: "#2a2f38",
                    border: "1px solid #414754",
                    borderRadius: "4px",
                    color: "#9CA3AF",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    opacity: currentPage === totalPages ? 0.5 : 1,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage === totalPages) return;
                    e.target.style.backgroundColor = "#3a3f48";
                    e.target.style.color = "#FFFFFF";
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage === totalPages) return;
                    e.target.style.backgroundColor = "#2a2f38";
                    e.target.style.color = "#9CA3AF";
                  }}
                >
                  {">"}
                </button>
              </div>
            </div>
          </div>
      </section>
    </AppShell>
  );
}

export default Dashboard;
