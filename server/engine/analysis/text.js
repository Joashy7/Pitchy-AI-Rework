/**
 * Converts a raw value into trimmed text with a fallback.
 *
 * Args:
 * @param {unknown} value - Raw value to convert into text.
 * @param {string} [fallback] - Text returned when value is null, undefined, or empty after trimming.
 *
 * Returns:
 * @returns {string} Trimmed string value, or fallback when no usable text exists.
 */
export const toText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;

  const text = String(value).trim();
  return text || fallback;
};

/**
 * Extracts lowercase word tokens from a transcript.
 *
 * Args:
 * @param {unknown} transcript - Transcript value to normalize and tokenize.
 *
 * Returns:
 * @returns {string[]} Lowercase alphanumeric word tokens; returns an empty array when no words are found.
 */
export const getTranscriptWords = (transcript) => (
  toText(transcript)
    .toLowerCase()
    .match(/[a-z0-9']+/g) || []
);

/**
 * Produces a lightly cleaned transcript fallback sentence.
 *
 * Args:
 * @param {unknown} transcript - Transcript value to normalize, capitalize, and punctuate.
 *
 * Returns:
 * @returns {string} Cleaned sentence with final punctuation; returns "" when transcript has no text.
 */
export const cleanTranscriptFallback = (transcript) => {
  const cleaned = toText(transcript).replace(/\s+/g, ' ');
  if (!cleaned) return '';

  const capitalized = `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}`;
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
};
