import { logDebug, logError } from '../logger.js';

/**
 * Removes Gemini markdown/prose wrappers around a JSON response.
 *
 * Args:
 * @param {unknown} text - Raw Gemini response text that may include code fences or prose.
 *
 * Returns:
 * @returns {string} Cleaned JSON-looking text between the first "{" and last "}"; returns trimmed cleaned text when braces are not found.
 */
export const cleanGeminiJsonText = (text) => {
  const cleaned = String(text || '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');

  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    return cleaned.slice(jsonStart, jsonEnd + 1);
  }

  return cleaned;
};

/**
 * Parses a Gemini JSON response after removing markdown/prose wrappers.
 *
 * Args:
 * @param {unknown} text - Raw Gemini response text to parse.
 * @param {object} [logger] - Logger with logDebug and logError functions.
 *
 * Returns:
 * @returns {object} Parsed JSON object when valid; throws "Gemini returned invalid JSON" when parsing fails.
 */
export const parseGeminiJson = (
  text,
  logger = {
    logDebug,
    logError,
  }
) => {
  const cleaned = cleanGeminiJsonText(text);

  try {
    return JSON.parse(cleaned);
  } catch (parseError) {
    logger.logError('Gemini JSON parse error:', parseError.message);
    logger.logDebug('Cleaned Gemini text:', cleaned);
    throw new Error('Gemini returned invalid JSON');
  }
};
