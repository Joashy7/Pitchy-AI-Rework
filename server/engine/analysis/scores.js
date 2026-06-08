/**
 * Parses and clamps a score value.
 *
 * Args:
 * @param {unknown} value - Raw score value to parse.
 *
 * Returns:
 * @returns {number|null} Integer score from 0 to 100; null when the value is not finite.
 */
const parseScore = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;

  return Math.min(100, Math.max(0, Math.round(parsed)));
};

/**
 * Calculates the average of positive score values.
 *
 * Args:
 * @param {number[]} scores - Score values to filter and average.
 *
 * Returns:
 * @returns {number} Rounded average of scores greater than 0; returns 0 when no positive scores exist.
 */
const averagePositiveScores = (scores) => {
  const scoreValues = scores.filter((score) => score > 0);

  if (!scoreValues.length) return 0;

  return Math.round(
    scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length
  );
};

/**
 * Normalizes analysis score fields into a complete score object.
 *
 * Args:
 * @param {object} [analysis] - Raw analysis object that may include score fields.
 *
 * Returns:
 * @returns {{clarity: number, persuasiveness: number, confidence: number, narrative_flow: number, overall_score: number}} Scores clamped from 0 to 100, with overall_score falling back to the average of positive component scores.
 */
export const normalizeScores = (analysis = {}) => {
  const clarity = parseScore(analysis.clarity) ?? 0;
  const persuasiveness = parseScore(analysis.persuasiveness) ?? 0;
  const confidence = parseScore(analysis.confidence) ?? 0;
  const narrativeFlow = parseScore(analysis.narrative_flow) ?? 0;
  const fallbackOverall = averagePositiveScores([
    clarity,
    persuasiveness,
    confidence,
    narrativeFlow,
  ]);

  return {
    clarity,
    persuasiveness,
    confidence,
    narrative_flow: narrativeFlow,
    overall_score: parseScore(analysis.overall_score) ?? fallbackOverall,
  };
};
