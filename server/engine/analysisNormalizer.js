import { NO_SUMMARY_AVAILABLE } from '../messages.js';

import { formatDuration } from './analysis/duration.js';
import {
  normalizeChanges,
  normalizeFeedbackItems,
  normalizeModificationRegions,
} from './analysis/feedback.js';
import { generateImprovementSuggestions as buildImprovementSuggestions } from './analysis/improvementSuggestions.js';
import {
  buildLowContentAnalysis,
  isLowContentTranscript,
} from './analysis/lowContent.js';
import { normalizeScores } from './analysis/scores.js';
import {
  cleanTranscriptFallback,
  toText,
} from './analysis/text.js';

export {
  cleanTranscriptFallback,
  formatDuration,
  isLowContentTranscript,
  toText,
};

/**
 * Normalizes raw Gemini analysis into the backend analysis contract.
 *
 * Args:
 * @param {object} [analysis] - Raw parsed Gemini response.
 * @param {string} [transcript] - Source transcript used as the analysis source of truth.
 * @param {number} [durationSeconds] - Recorded or estimated duration in seconds.
 *
 * Returns:
 * @returns {object} Normalized analysis with scores, summary_feedback, strong_points, needs_focus, duration, improved_transcript, modification_regions, changes_made, and transcript; low-content transcripts return guarded low-score analysis without invented pitch content.
 */
export const normalizeAnalysis = (analysis = {}, transcript = '', durationSeconds = 0) => {
  const sourceTranscript = toText(transcript, analysis.transcript || '');

  if (sourceTranscript && isLowContentTranscript(sourceTranscript)) {
    const lowContentAnalysis = buildLowContentAnalysis(sourceTranscript, durationSeconds);
    return {
      ...lowContentAnalysis,
      duration: toText(analysis.duration, lowContentAnalysis.duration),
    };
  }

  const normalizedScores = normalizeScores(analysis);

  return {
    ...normalizedScores,
    summary_feedback: toText(analysis.summary_feedback, NO_SUMMARY_AVAILABLE),
    strong_points: normalizeFeedbackItems(analysis.strong_points),
    needs_focus: normalizeFeedbackItems(analysis.needs_focus),
    duration: toText(analysis.duration, formatDuration(durationSeconds)),
    improved_transcript: toText(analysis.improved_transcript),
    modification_regions: normalizeModificationRegions(analysis.modification_regions),
    changes_made: normalizeChanges(analysis.changes_made),
    transcript: sourceTranscript,
  };
};

/**
 * Generates improvement suggestions from an analysis object.
 *
 * Args:
 * @param {object} analysis - Analysis object to normalize and convert into improvement suggestions.
 * @param {object} [options] - Options forwarded to the improvement suggestion builder.
 *
 * Returns:
 * @returns {object} Improvement suggestions with score fields, score_analysis_available, summary feedback, feedback arrays, score_breakdown, and generated_at.
 */
export const generateImprovementSuggestions = (analysis, options) => (
  buildImprovementSuggestions(analysis, normalizeAnalysis(analysis), options)
);
