const isClientLoggingEnabled =
  import.meta.env?.DEV || import.meta.env?.VITE_PITCHY_DEBUG === "true";

/**
 * Writes a frontend error log message when client logging is enabled.
 *
 * Args:
 * @param {...unknown} args - Values to send to console.error.
 *
 * Returns:
 * @returns {void} Does not return a value.
 */
export const logError = (...args) => {
  if (isClientLoggingEnabled) {
    console.error(...args);
  }
};

/**
 * Writes a frontend warning log message when client logging is enabled.
 *
 * Args:
 * @param {...unknown} args - Values to send to console.warn.
 *
 * Returns:
 * @returns {void} Does not return a value.
 */
export const logWarn = (...args) => {
  if (isClientLoggingEnabled) {
    console.warn(...args);
  }
};
