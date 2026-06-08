import { Link } from "react-router-dom";

const getStatusClassName = (status) => {
  if (status === "Recorded") return "pitch-history__status--recorded";
  if (status === "Text Only") return "pitch-history__status--text";

  return "pitch-history__status--default";
};

function EmptyTableRow({ children, tone = "default" }) {
  const toneClass = tone === "error" ? "pitch-history__empty--error" : "";

  return (
    <tr>
      <td colSpan={6} className={`pitch-history__empty ${toneClass}`}>
        {children}
      </td>
    </tr>
  );
}

function PaginationButton({ children, disabled, isActive, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`pitch-history__pagination-button ${isActive ? "is-active" : ""}`}
    >
      {children}
    </button>
  );
}

function PitchRow({ pitch, onViewAnalysis }) {
  const statusLabel = pitch.score_analysis_available ? "Recorded" : "Text Only";

  return (
    <tr className="pitch-history__row">
      <td className="pitch-history__cell">
        <div>
          <p className="pitch-history__pitch-name">{pitch.name}</p>
          <p className="pitch-history__pitch-description">{pitch.description}</p>
        </div>
      </td>

      <td className="pitch-history__cell">{pitch.date}</td>
      <td className="pitch-history__cell">{pitch.duration}</td>

      <td className="pitch-history__cell">
        <span className="pitch-history__score">
          {pitch.score_analysis_available ? pitch.score : "N/A"}
        </span>
      </td>

      <td className="pitch-history__cell">
        <span className={`pitch-history__status ${getStatusClassName(statusLabel)}`}>
          {statusLabel}
        </span>
      </td>

      <td className="pitch-history__cell">
        <Link
          to="/analysis"
          className="pitch-history__analysis-link"
          onClick={() => onViewAnalysis(pitch)}
        >
          View Analysis
        </Link>
      </td>
    </tr>
  );
}

export default function PitchHistoryTable({
  pitches,
  isLoading,
  error,
  currentPage,
  totalPages,
  visiblePages,
  showingStart,
  showingEnd,
  totalItems,
  onPageChange,
  onPreviousPage,
  onNextPage,
  onViewAnalysis,
}) {
  return (
    <div className="card card--padded-lg">
      <div className="pitch-history__header">
        <h3 className="pitch-history__title">Pitch History</h3>
      </div>

      <div className="pitch-history__table-wrapper">
        <table className="pitch-history__table">
          <thead>
            <tr className="pitch-history__heading-row">
              <th className="pitch-history__header-cell">Pitch Name</th>
              <th className="pitch-history__header-cell">Date</th>
              <th className="pitch-history__header-cell">Duration</th>
              <th className="pitch-history__header-cell">Score</th>
              <th className="pitch-history__header-cell">Status</th>
              <th className="pitch-history__header-cell">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <EmptyTableRow>Loading pitch history...</EmptyTableRow>
            ) : error ? (
              <EmptyTableRow tone="error">{error}</EmptyTableRow>
            ) : pitches.length === 0 ? (
              <EmptyTableRow>No saved pitches found.</EmptyTableRow>
            ) : (
              pitches.map((pitch) => (
                <PitchRow
                  key={pitch.id}
                  pitch={pitch}
                  onViewAnalysis={onViewAnalysis}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pitch-history__footer">
        <p className="pitch-history__summary">
          Showing {showingStart}-{showingEnd} of {totalItems} pitches
        </p>

        <div className="pitch-history__pagination">
          <PaginationButton
            disabled={currentPage === 1}
            onClick={onPreviousPage}
          >
            {"<"}
          </PaginationButton>

          {visiblePages.map((page) => (
            <PaginationButton
              key={page}
              isActive={page === currentPage}
              onClick={() => onPageChange(page)}
            >
              {page}
            </PaginationButton>
          ))}

          <PaginationButton
            disabled={currentPage === totalPages}
            onClick={onNextPage}
          >
            {">"}
          </PaginationButton>
        </div>
      </div>
    </div>
  );
}
