export const DASHBOARD_ITEMS_PER_PAGE = 4;

/**
 * Builds searchable text from a dashboard pitch row.
 *
 * Args:
 * @param {object} pitch - Dashboard pitch object.
 *
 * Returns:
 * @returns {string} Lowercase searchable text containing pitch name, description, status, and date.
 */
export const getSearchablePitchText = (pitch) => (
  [
    pitch.name,
    pitch.description,
    pitch.status,
    pitch.date,
  ]
    .join(" ")
    .toLowerCase()
);

/**
 * Filters dashboard pitches by a search term.
 *
 * Args:
 * @param {object[]} pitches - Dashboard pitch rows to filter.
 * @param {string} searchTerm - Search text typed by the user.
 *
 * Returns:
 * @returns {object[]} Original pitches when search is empty; otherwise pitches whose searchable text contains the normalized search term.
 */
export const filterPitchesBySearch = (pitches, searchTerm) => {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) return pitches;

  return pitches.filter((pitch) => (
    getSearchablePitchText(pitch).includes(normalizedSearch)
  ));
};

/**
 * Calculates the total number of dashboard pages.
 *
 * Args:
 * @param {number} totalItems - Number of filtered pitch rows.
 * @param {number} [itemsPerPage] - Number of pitch rows per page.
 *
 * Returns:
 * @returns {number} Page count with a minimum of 1.
 */
export const getTotalPages = (
  totalItems,
  itemsPerPage = DASHBOARD_ITEMS_PER_PAGE
) => Math.max(1, Math.ceil(totalItems / itemsPerPage));

/**
 * Slices dashboard pitches for the current page.
 *
 * Args:
 * @param {object[]} pitches - Filtered dashboard pitch rows.
 * @param {number} currentPage - One-based current page number.
 * @param {number} [itemsPerPage] - Number of pitch rows per page.
 *
 * Returns:
 * @returns {object[]} Pitch rows visible on the requested page.
 */
export const paginatePitches = (
  pitches,
  currentPage,
  itemsPerPage = DASHBOARD_ITEMS_PER_PAGE
) => pitches.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);

/**
 * Builds the compact dashboard pagination window.
 *
 * Args:
 * @param {number} currentPage - One-based current page number.
 * @param {number} totalPages - Total number of pages.
 *
 * Returns:
 * @returns {number[]} Page numbers to render in the pagination control.
 */
export const getVisiblePages = (currentPage, totalPages) => {
  const pages = [];
  const firstPage = Math.max(1, Math.min(currentPage - 1, totalPages - 3));
  const lastPage = Math.min(totalPages, firstPage + 3);

  for (let page = firstPage; page <= lastPage; page += 1) {
    pages.push(page);
  }

  return pages;
};

/**
 * Calculates the "showing X to Y" range for dashboard pagination.
 *
 * Args:
 * @param {number} totalItems - Number of filtered pitch rows.
 * @param {number} currentPage - One-based current page number.
 * @param {number} [itemsPerPage] - Number of pitch rows per page.
 *
 * Returns:
 * @returns {{showingStart: number, showingEnd: number}} Visible item range; both values are 0 when there are no items.
 */
export const getShowingRange = (
  totalItems,
  currentPage,
  itemsPerPage = DASHBOARD_ITEMS_PER_PAGE
) => {
  if (!totalItems) {
    return {
      showingEnd: 0,
      showingStart: 0,
    };
  }

  return {
    showingEnd: Math.min(currentPage * itemsPerPage, totalItems),
    showingStart: (currentPage - 1) * itemsPerPage + 1,
  };
};
