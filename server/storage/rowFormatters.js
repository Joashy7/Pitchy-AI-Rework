/**
 * Normalizes a username for storage comparisons.
 *
 * Args:
 * @param {unknown} username - Raw username value.
 *
 * Returns:
 * @returns {string} Trimmed username string; returns "" for missing values.
 */
export const normalizeUsername = (username) => String(username || '').trim();

/**
 * Converts a value into a sheet-safe identifier segment.
 *
 * Args:
 * @param {unknown} value - Raw value to normalize into an identifier segment.
 *
 * Returns:
 * @returns {string} Lowercase alphanumeric underscore slug with surrounding underscores removed; returns "" when no identifier text exists.
 */
export const normalizeIdentifierPart = (value) => (
  normalizeUsername(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
);

/**
 * Checks whether a sheet cell matches a header value.
 *
 * Args:
 * @param {unknown} value - Cell value to inspect.
 * @param {string} header - Expected header name.
 *
 * Returns:
 * @returns {boolean} True when the cell text matches the header case-insensitively; false otherwise.
 */
export const isHeaderValue = (value, header) => (
  String(value || '').trim().toLowerCase() === header.toLowerCase()
);

/**
 * Converts a value into a number with fallback.
 *
 * Args:
 * @param {unknown} value - Raw numeric value.
 * @param {number} [fallback] - Value returned when parsing is not finite.
 *
 * Returns:
 * @returns {number} Parsed finite number, or fallback when parsing fails.
 */
export const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Checks whether a sheet cell has a meaningful value.
 *
 * Args:
 * @param {unknown} value - Raw sheet cell value.
 *
 * Returns:
 * @returns {boolean} True for non-null, non-undefined, non-empty trimmed values; false otherwise.
 */
export const hasSheetValue = (value) => (
  value !== null &&
  value !== undefined &&
  String(value).trim() !== ''
);

/**
 * Truncates text to a word-boundary preview.
 *
 * Args:
 * @param {unknown} text - Raw text to normalize and truncate.
 * @param {number} [maxLength] - Maximum output length including ellipsis.
 *
 * Returns:
 * @returns {string} Normalized text when short enough, word-boundary truncated text with "...", or "" for empty input.
 */
export const truncateText = (text, maxLength = 80) => {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();

  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;

  const maxTextLength = Math.max(0, maxLength - 3);
  const truncated = normalized.slice(0, maxTextLength).trim();
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  const wordBoundaryText = lastSpaceIndex > 0
    ? truncated.slice(0, lastSpaceIndex)
    : truncated;

  return `${wordBoundaryText}...`;
};

/**
 * Formats a timestamp for dashboard display.
 *
 * Args:
 * @param {unknown} timestamp - Raw timestamp value.
 *
 * Returns:
 * @returns {string} Formatted "Mon D, YYYY" date for valid timestamps, original timestamp for invalid date strings, or "Unknown date" when missing.
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown date';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Normalizes a duration value for display.
 *
 * Args:
 * @param {unknown} duration - Raw duration value.
 *
 * Returns:
 * @returns {string} Trimmed duration string, or "N/A" when missing.
 */
export const normalizeDuration = (duration) => {
  const normalized = String(duration || '').trim();
  return normalized || 'N/A';
};

/**
 * Converts a duration string into seconds.
 *
 * Args:
 * @param {unknown} duration - Duration value as seconds, mm:ss, hh:mm:ss, or display fallback.
 *
 * Returns:
 * @returns {number} Duration in seconds; returns 0 for missing, "N/A", invalid, or unsupported formats.
 */
export const durationToSeconds = (duration) => {
  const normalized = String(duration || '').trim();
  if (!normalized || normalized === 'N/A') return 0;

  if (/^\d+(\.\d+)?$/.test(normalized)) {
    return Math.round(Number(normalized));
  }

  const parts = normalized.split(':').map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part))) return 0;

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return 0;
};
