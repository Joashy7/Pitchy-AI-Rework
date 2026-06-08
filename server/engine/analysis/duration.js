/**
 * Formats a duration in seconds as mm:ss.
 *
 * Args:
 * @param {number|string} [durationSeconds] - Raw duration in seconds to round and clamp at zero.
 *
 * Returns:
 * @returns {string} Duration string formatted as "m:ss"; invalid, missing, or negative values return "0:00".
 */
export const formatDuration = (durationSeconds = 0) => {
  const totalSeconds = Math.max(0, Math.round(Number(durationSeconds) || 0));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};
