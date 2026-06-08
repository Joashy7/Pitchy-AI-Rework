import assert from "node:assert/strict";

const LOCATION = "client/src/utils/dashboardViewModel.js";

const pitches = [
  { date: "2026-06-01", description: "Recorded investor pitch", name: "Launch", status: "Recorded" },
  { date: "2026-06-02", description: "Typed cold outreach", name: "Email", status: "Text Only" },
  { date: "2026-06-03", description: "Recorded demo", name: "Demo", status: "Recorded" },
  { date: "2026-06-04", description: "Recorded close", name: "Close", status: "Recorded" },
  { date: "2026-06-05", description: "Text revision", name: "Revision", status: "Text Only" },
];

globalThis.loggedClientTest("getSearchablePitchText - visible fields", LOCATION, async () => {
  const { getSearchablePitchText } = await globalThis.loadClientModule("/src/utils/dashboardViewModel.js");

  assert.equal(
    getSearchablePitchText(pitches[0]),
    "launch recorded investor pitch recorded 2026-06-01"
  );
});

globalThis.loggedClientTest("filterPitchesBySearch - searches visible fields", LOCATION, async () => {
  const { filterPitchesBySearch } = await globalThis.loadClientModule("/src/utils/dashboardViewModel.js");

  assert.equal(filterPitchesBySearch(pitches, "recorded").length, 3);
  assert.deepEqual(
    filterPitchesBySearch(pitches, "email").map((pitch) => pitch.name),
    ["Email"]
  );
  assert.deepEqual(
    filterPitchesBySearch(pitches, "2026-06-05").map((pitch) => pitch.name),
    ["Revision"]
  );
});

globalThis.loggedClientTest("paginatePitches - page slicing", LOCATION, async () => {
  const { paginatePitches } = await globalThis.loadClientModule("/src/utils/dashboardViewModel.js");

  assert.deepEqual(
    paginatePitches(pitches, 1, 2).map((pitch) => pitch.name),
    ["Launch", "Email"]
  );
  assert.deepEqual(
    paginatePitches(pitches, 3, 2).map((pitch) => pitch.name),
    ["Revision"]
  );
});

globalThis.loggedClientTest("getTotalPages - empty and partial pages", LOCATION, async () => {
  const { getTotalPages } = await globalThis.loadClientModule("/src/utils/dashboardViewModel.js");

  assert.equal(getTotalPages(0), 1);
  assert.equal(getTotalPages(1, 4), 1);
  assert.equal(getTotalPages(4, 4), 1);
  assert.equal(getTotalPages(5, 4), 2);
  assert.equal(getTotalPages(9, 4), 3);
});

globalThis.loggedClientTest("getVisiblePages - compact window", LOCATION, async () => {
  const { getVisiblePages } = await globalThis.loadClientModule("/src/utils/dashboardViewModel.js");

  assert.deepEqual(getVisiblePages(1, 6), [1, 2, 3, 4]);
  assert.deepEqual(getVisiblePages(4, 6), [3, 4, 5, 6]);
  assert.deepEqual(getVisiblePages(6, 6), [3, 4, 5, 6]);
});

globalThis.loggedClientTest("getShowingRange - empty and populated", LOCATION, async () => {
  const {
    getShowingRange,
    getTotalPages,
  } = await globalThis.loadClientModule("/src/utils/dashboardViewModel.js");

  assert.equal(getTotalPages(0), 1);
  assert.equal(getTotalPages(9, 4), 3);
  assert.deepEqual(getShowingRange(0, 1, 4), {
    showingEnd: 0,
    showingStart: 0,
  });
  assert.deepEqual(getShowingRange(9, 3, 4), {
    showingEnd: 9,
    showingStart: 9,
  });
});
