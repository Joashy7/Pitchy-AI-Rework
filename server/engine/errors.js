/**
 * Creates an Error object with an attached HTTP status code.
 *
 * Args:
 * @param {string} message - Error message to expose to route error handlers.
 * @param {number} [statusCode] - HTTP status code associated with the error.
 *
 * Returns:
 * @returns {Error & {statusCode: number}} Error object with statusCode attached; defaults to status 500.
 */
export const createEngineError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Reads the HTTP status code from an error object.
 *
 * Args:
 * @param {object} [error] - Error-like object that may include statusCode.
 *
 * Returns:
 * @returns {number} error.statusCode when present; otherwise 500.
 */
export const getErrorStatusCode = (error = {}) => error.statusCode || 500;
