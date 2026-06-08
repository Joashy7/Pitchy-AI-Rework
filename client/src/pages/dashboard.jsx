import React, { useMemo, useState } from "react";

import DashboardStats from "../components/dashboard/DashboardStats";
import PitchHistoryTable from "../components/dashboard/PitchHistoryTable";
import AppShell from "../components/layout/AppShell";
import { useDashboardData } from "../hooks/useDashboardData";
import { saveAnalysisResult, toStoredAnalysis } from "../utils/analysisResults";
import {
  DASHBOARD_ITEMS_PER_PAGE,
  filterPitchesBySearch,
  getShowingRange,
  getTotalPages,
  getVisiblePages,
  paginatePitches,
} from "../utils/dashboardViewModel";

function Dashboard() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const {
    pitchData,
    dashboardStats,
    isLoading,
    error,
  } = useDashboardData();

  const filteredPitchData = useMemo(
    () => filterPitchesBySearch(pitchData, searchTerm),
    [pitchData, searchTerm]
  );
  const totalPages = getTotalPages(filteredPitchData.length);
  const paginatedPitchData = paginatePitches(filteredPitchData, currentPage);
  const visiblePages = useMemo(
    () => getVisiblePages(currentPage, totalPages),
    [currentPage, totalPages]
  );
  const { showingEnd, showingStart } = getShowingRange(
    filteredPitchData.length,
    currentPage,
    DASHBOARD_ITEMS_PER_PAGE
  );

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
    saveAnalysisResult(toStoredAnalysis(pitch));
  };

  return (
    <AppShell
      activePage="dashboard"
      searchValue={searchTerm}
      onSearchChange={handleSearchChange}
    >
      <section className="page-section">
        <div className="page-header">
          <div className="mb-4 flex items-center gap-3">
            <span className="dashboard-eyebrow">Performance Vault</span>
          </div>

          <h2 className="page-header__title">Pitch Archive</h2>

          <p className="page-header__subtitle">
            Review and refine your past performances.
          </p>
        </div>

        <DashboardStats stats={dashboardStats} />

        <PitchHistoryTable
          pitches={paginatedPitchData}
          isLoading={isLoading}
          error={error}
          currentPage={currentPage}
          totalPages={totalPages}
          visiblePages={visiblePages}
          showingStart={showingStart}
          showingEnd={showingEnd}
          totalItems={filteredPitchData.length}
          onPageChange={setCurrentPage}
          onPreviousPage={handlePreviousPage}
          onNextPage={handleNextPage}
          onViewAnalysis={handleViewAnalysis}
        />
      </section>
    </AppShell>
  );
}

export default Dashboard;
