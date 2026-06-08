export const DASHBOARD_ITEMS_PER_PAGE = 4;

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

export const filterPitchesBySearch = (pitches, searchTerm) => {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) return pitches;

  return pitches.filter((pitch) => (
    getSearchablePitchText(pitch).includes(normalizedSearch)
  ));
};

export const getTotalPages = (
  totalItems,
  itemsPerPage = DASHBOARD_ITEMS_PER_PAGE
) => Math.max(1, Math.ceil(totalItems / itemsPerPage));

export const paginatePitches = (
  pitches,
  currentPage,
  itemsPerPage = DASHBOARD_ITEMS_PER_PAGE
) => pitches.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);

export const getVisiblePages = (currentPage, totalPages) => {
  const pages = [];
  const firstPage = Math.max(1, Math.min(currentPage - 1, totalPages - 3));
  const lastPage = Math.min(totalPages, firstPage + 3);

  for (let page = firstPage; page <= lastPage; page += 1) {
    pages.push(page);
  }

  return pages;
};

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
