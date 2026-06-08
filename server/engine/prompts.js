import { readFileSync } from 'fs';

const ANALYSIS_PROMPT_TEMPLATE = readFileSync(
  new URL('../../config/Context/ANALYSIS.md', import.meta.url),
  'utf8'
);

/**
 * Builds the Gemini analysis prompt from the markdown prompt template.
 *
 * Args:
 * @param {string} transcript - Pitch transcript inserted into the {{transcript}} placeholder.
 * @param {number} durationSeconds - Speech duration inserted into the {{durationSeconds}} placeholder.
 *
 * Returns:
 * @returns {string} Complete prompt string with transcript and duration placeholders replaced.
 */
export const buildAnalysisPrompt = (transcript, durationSeconds) => `
${ANALYSIS_PROMPT_TEMPLATE}
`
  .replaceAll('{{durationSeconds}}', String(durationSeconds))
  .replaceAll('{{transcript}}', transcript);
