const isVerboseLoggingEnabled = process.env.PITCHY_DEBUG === 'true';

/**
 * Writes an informational log message.
 *
 * Args:
 * @param {...unknown} args - Values to send to the standard output logger.
 *
 * Returns:
 * @returns {void} Does not return a value.
 */
export const logInfo = (...args) => {
  console.log(...args);
};

/**
 * Writes a debug log message only when verbose logging is enabled.
 *
 * Args:
 * @param {...unknown} args - Values to send to the debug logger.
 *
 * Returns:
 * @returns {void} Does not return a value.
 */
export const logDebug = (...args) => {
  if (isVerboseLoggingEnabled) {
    console.log(...args);
  }
};

/**
 * Writes a warning log message.
 *
 * Args:
 * @param {...unknown} args - Values to send to the warning logger.
 *
 * Returns:
 * @returns {void} Does not return a value.
 */
export const logWarn = (...args) => {
  console.warn(...args);
};

/**
 * Writes an error log message.
 *
 * Args:
 * @param {...unknown} args - Values to send to the error logger.
 *
 * Returns:
 * @returns {void} Does not return a value.
 */
export const logError = (...args) => {
  console.error(...args);
};
