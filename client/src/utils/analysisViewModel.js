import {
  NO_SUMMARY_AVAILABLE,
  NO_TRANSCRIPT_AVAILABLE,
  TEXT_SCORE_ANALYSIS_MESSAGE,
} from "../constants/messages";

export const getSafeScore = (value) => {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;

  return Math.min(100, Math.max(0, Math.round(score)));
};

export const getFeedbackItems = (items) => (Array.isArray(items) ? items : []);

export const getModificationRegions = (analysisData) => {
  if (Array.isArray(analysisData?.modification_regions)) {
    const regions = analysisData.modification_regions
      .map((region) => ({
        timestamp: region.timestamp || "00:00",
        section: region.section || "Revision",
        original: region.original || "",
        issue: region.issue || "",
        suggested_edit: region.suggested_edit || region.suggestedEdit || "",
        reason: region.reason || "",
      }))
      .filter((region) => (
        region.original ||
        region.issue ||
        region.suggested_edit ||
        region.reason
      ));

    if (regions.length) return regions;
  }

  const changes = getFeedbackItems(analysisData?.changes_made).map((change) => ({
    timestamp: "00:00",
    section: change.area || "Revision",
    original: change.original || "",
    issue: "",
    suggested_edit: change.improved || "",
    reason: change.reason || "",
  }));

  if (changes.length) return changes;

  return getFeedbackItems(analysisData?.needs_focus).map((item) => ({
    timestamp: item.timestamp || "00:00",
    section: "Focus area",
    original: item.quote || "",
    issue: item.explanation || "",
    suggested_edit: "",
    reason: "Use this section as a priority revision point when refining your pitch.",
  }));
};

export const toAnalysisViewModel = (data) => {
  if (!data) return null;

  const scoreAnalysisAvailable = data.score_analysis_available !== false &&
    data.analysis_mode !== "text";

  return {
    transcript: data.transcript || NO_TRANSCRIPT_AVAILABLE,
    improvedPitch: data.improvedPitch || data.improved_transcript || "",
    scoreAnalysisAvailable,
    scoreAnalysisMessage: data.score_analysis_message || TEXT_SCORE_ANALYSIS_MESSAGE,
    scores: {
      clarity: getSafeScore(data.clarity),
      persuasiveness: getSafeScore(data.persuasiveness),
      confidence: getSafeScore(data.confidence),
      narrativeFlow: getSafeScore(data.narrative_flow),
      overall: getSafeScore(data.overall_score),
    },
    summaryFeedback: data.summary_feedback || data.feedback || NO_SUMMARY_AVAILABLE,
    strongPoints: getFeedbackItems(data.strong_points),
    needsFocus: getFeedbackItems(data.needs_focus),
    modificationRegions: getModificationRegions(data),
  };
};
