import assert from "node:assert/strict";

import {
  installLocalStorageMock,
} from "./helpers/browserMocks.js";

const LOCATION = "client/src/utils/analysisResults.js";

globalThis.loggedClientTest("readStoredAnalysis - missing and malformed storage", LOCATION, async () => {
  const { localStorage, restore } = installLocalStorageMock();

  try {
    const { readStoredAnalysis } = await globalThis.loadClientModule("/src/utils/analysisResults.js");

    assert.match(readStoredAnalysis().error, /No analysis data found/);

    localStorage.setItem("pitchPalResults", "{bad json");
    const originalError = console.error;
    console.error = () => {};
    let malformedResult;

    try {
      malformedResult = readStoredAnalysis();
    } finally {
      console.error = originalError;
    }

    assert.equal(malformedResult.data, null);
    assert.match(malformedResult.error, /Error loading analysis data/);
  } finally {
    restore();
  }
});

globalThis.loggedClientTest("saveAnalysisResult and clearAnalysisResult - storage lifecycle", LOCATION, async () => {
  const { localStorage, restore } = installLocalStorageMock();

  try {
    const {
      clearAnalysisResult,
      readStoredAnalysis,
      saveAnalysisResult,
    } = await globalThis.loadClientModule("/src/utils/analysisResults.js");
    const analysis = {
      improvedPitch: "A sharper pitch.",
      transcript: "Original pitch.",
    };

    saveAnalysisResult(analysis);

    assert.deepEqual(readStoredAnalysis().data, analysis);
    clearAnalysisResult();
    assert.equal(localStorage.getItem("pitchPalResults"), null);
  } finally {
    restore();
  }
});

globalThis.loggedClientTest("toStoredAnalysis - dashboard pitch mapping", LOCATION, async () => {
  const { toStoredAnalysis } = await globalThis.loadClientModule("/src/utils/analysisResults.js");
  const storedAnalysis = toStoredAnalysis({
    changes_made: [{ area: "clarity" }],
    clarity: 90,
    confidence: 80,
    improvedPitch: "Improved pitch.",
    modification_regions: [{ section: "Opening" }],
    narrative_flow: 85,
    needs_focus: [{ quote: "Too broad" }],
    overall_score: 88,
    persuasiveness: 82,
    score_analysis_available: true,
    score_analysis_message: "",
    strong_points: [{ quote: "Clear ask" }],
    summary_feedback: "Good structure.",
    transcript: "Original pitch.",
  });

  assert.equal(storedAnalysis.analysis_mode, "audio");
  assert.equal(storedAnalysis.improved_transcript, "Improved pitch.");
  assert.equal(storedAnalysis.overall_score, 88);
  assert.deepEqual(storedAnalysis.modification_regions, [{ section: "Opening" }]);
});
