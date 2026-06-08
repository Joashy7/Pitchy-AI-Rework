/**
 * Builds the frontend-facing improvement suggestions payload from normalized analysis.
 *
 * Args:
 * @param {object} analysis - Original analysis object that may include score_analysis_available and score_analysis_message.
 * @param {object} normalizedAnalysis - Normalized analysis object containing scores, feedback, focus areas, changes, and modification regions.
 * @param {object} [options] - Suggestion generation options.
 * @param {Function} [options.now] - Timestamp provider used for generated_at.
 *
 * Returns:
 * @returns {object} Suggestions payload with overall_score or null, score_analysis_available, score_analysis_message, summary_feedback, strong_points, needs_focus, modification_regions, changes_made, score_breakdown values or nulls, and generated_at timestamp.
 */
export const generateImprovementSuggestions = (
  analysis,
  normalizedAnalysis,
  { now = () => new Date().toISOString() } = {}
) => {
  const scoreAnalysisAvailable = analysis.score_analysis_available !== false;

  return {
    overall_score: scoreAnalysisAvailable ? normalizedAnalysis.overall_score : null,
    score_analysis_available: scoreAnalysisAvailable,
    score_analysis_message: analysis.score_analysis_message || '',
    summary_feedback: normalizedAnalysis.summary_feedback,
    strong_points: normalizedAnalysis.strong_points,
    needs_focus: normalizedAnalysis.needs_focus,
    modification_regions: normalizedAnalysis.modification_regions,
    changes_made: normalizedAnalysis.changes_made,
    score_breakdown: {
      clarity: scoreAnalysisAvailable ? normalizedAnalysis.clarity : null,
      persuasiveness: scoreAnalysisAvailable ? normalizedAnalysis.persuasiveness : null,
      confidence: scoreAnalysisAvailable ? normalizedAnalysis.confidence : null,
      narrative_flow: scoreAnalysisAvailable ? normalizedAnalysis.narrative_flow : null,
    },
    generated_at: now(),
  };
};
