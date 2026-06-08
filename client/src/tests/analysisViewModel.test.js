import assert from "node:assert/strict";

const LOCATION = "client/src/utils/analysisViewModel.js";

globalThis.loggedClientTest("getSafeScore - clamps invalid values", LOCATION, async () => {
  const { getSafeScore } = await globalThis.loadClientModule("/src/utils/analysisViewModel.js");

  assert.equal(getSafeScore("88.6"), 89);
  assert.equal(getSafeScore(120), 100);
  assert.equal(getSafeScore(-10), 0);
  assert.equal(getSafeScore(null), 0);
  assert.equal(getSafeScore("not-a-score"), 0);
});

globalThis.loggedClientTest("getFeedbackItems - array fallback", LOCATION, async () => {
  const { getFeedbackItems } = await globalThis.loadClientModule("/src/utils/analysisViewModel.js");
  const items = [{ quote: "Strong opening." }];

  assert.equal(getFeedbackItems(items), items);
  assert.deepEqual(getFeedbackItems(null), []);
  assert.deepEqual(getFeedbackItems({ quote: "Not an array." }), []);
});

globalThis.loggedClientTest("toAnalysisViewModel - text-only analysis", LOCATION, async () => {
  const { toAnalysisViewModel } = await globalThis.loadClientModule("/src/utils/analysisViewModel.js");
  const viewModel = toAnalysisViewModel({
    analysis_mode: "text",
    improved_transcript: "Sharper typed pitch.",
    score_analysis_available: false,
    transcript: "Typed pitch.",
  });

  assert.equal(viewModel.scoreAnalysisAvailable, false);
  assert.match(viewModel.scoreAnalysisMessage, /Text-based analysis/i);
  assert.equal(viewModel.scores.overall, 0);
  assert.equal(viewModel.transcript, "Typed pitch.");
  assert.equal(viewModel.improvedPitch, "Sharper typed pitch.");
});

globalThis.loggedClientTest("toAnalysisViewModel - missing fields fallback", LOCATION, async () => {
  const { toAnalysisViewModel } = await globalThis.loadClientModule("/src/utils/analysisViewModel.js");
  const viewModel = toAnalysisViewModel({});

  assert.match(viewModel.transcript, /No transcript/i);
  assert.match(viewModel.summaryFeedback, /No summary/i);
  assert.deepEqual(viewModel.strongPoints, []);
  assert.deepEqual(viewModel.needsFocus, []);
  assert.deepEqual(viewModel.modificationRegions, []);
});

globalThis.loggedClientTest("getModificationRegions - model regions", LOCATION, async () => {
  const { getModificationRegions } = await globalThis.loadClientModule("/src/utils/analysisViewModel.js");
  const regions = getModificationRegions({
    modification_regions: [
      {
        issue: "Too vague",
        original: "We help teams.",
        reason: "Specificity improves trust.",
        section: "Opening",
        suggestedEdit: "We help sales teams cut onboarding time.",
      },
      {},
    ],
  });

  assert.equal(regions.length, 1);
  assert.equal(regions[0].timestamp, "00:00");
  assert.equal(regions[0].section, "Opening");
  assert.equal(regions[0].suggested_edit, "We help sales teams cut onboarding time.");
});

globalThis.loggedClientTest("getModificationRegions - legacy fallbacks", LOCATION, async () => {
  const { getModificationRegions } = await globalThis.loadClientModule("/src/utils/analysisViewModel.js");

  assert.deepEqual(getModificationRegions({
    changes_made: [{
      area: "Close",
      improved: "Book the pilot today.",
      original: "Let me know.",
      reason: "Adds a direct ask.",
    }],
  }), [{
    issue: "",
    original: "Let me know.",
    reason: "Adds a direct ask.",
    section: "Close",
    suggested_edit: "Book the pilot today.",
    timestamp: "00:00",
  }]);

  assert.deepEqual(getModificationRegions({
    needs_focus: [{
      explanation: "Add a customer result.",
      quote: "Our product is useful.",
      timestamp: "00:21",
    }],
  }), [{
    issue: "Add a customer result.",
    original: "Our product is useful.",
    reason: "Use this section as a priority revision point when refining your pitch.",
    section: "Focus area",
    suggested_edit: "",
    timestamp: "00:21",
  }]);
});
