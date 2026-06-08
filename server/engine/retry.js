import { logDebug, logError } from '../logger.js';

const DEFAULT_ATTEMPTS = 3;

/**
 * Waits for a number of milliseconds.
 *
 * Args:
 * @param {number} ms - Milliseconds to wait before resolving.
 *
 * Returns:
 * @returns {Promise<void>} Promise that resolves after the requested delay.
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Normalizes retry options from a number or options object.
 *
 * Args:
 * @param {number|object} [options] - Retry attempt count or detailed retry options.
 *
 * Returns:
 * @returns {{attempts: number, sleep: Function, getDelayMs: Function, logger: object}} Normalized retry settings with attempts, sleep function, delay function, and logger.
 */
const getRetryOptions = (options = DEFAULT_ATTEMPTS) => {
  if (typeof options === 'number') {
    return {
      attempts: options,
      sleep: wait,
      getDelayMs: (attempt) => 1000 * attempt,
      logger: {
        logDebug,
        logError,
      },
    };
  }

  return {
    attempts: options.attempts ?? DEFAULT_ATTEMPTS,
    sleep: options.sleep ?? wait,
    getDelayMs: options.getDelayMs ?? ((attempt) => 1000 * attempt),
    logger: options.logger ?? {
      logDebug,
      logError,
    },
  };
};

/**
 * Races a promise against a timeout error.
 *
 * Args:
 * @param {Promise<unknown>} promise - Promise to resolve or reject before timeout.
 * @param {string} label - Operation label used in timeout error messages.
 * @param {number} timeoutMs - Timeout duration in milliseconds.
 *
 * Returns:
 * @returns {Promise<unknown>} Resolves with the original promise value; rejects with the original error or a timeout Error.
 */
export const withTimeout = async (promise, label, timeoutMs) => {
  let timeoutId;

  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)} seconds`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Retries an async operation with incremental delays.
 *
 * Args:
 * @param {Function} operation - Async function to execute.
 * @param {string} label - Operation label used in debug and error logs.
 * @param {number|object} [options] - Attempt count or retry options with attempts, sleep, getDelayMs, and logger.
 *
 * Returns:
 * @returns {Promise<unknown>} Resolves with the first successful operation result; rejects with the final error after all attempts fail.
 */
export const withRetries = async (
  operation,
  label,
  options = DEFAULT_ATTEMPTS
) => {
  const {
    attempts,
    logger,
    sleep,
    getDelayMs,
  } = getRetryOptions(options);
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      logger.logDebug(`${label} attempt ${attempt}`);
      return await operation();
    } catch (error) {
      lastError = error;
      logger.logError(`${label} attempt ${attempt} failed:`, error.message);

      if (attempt < attempts) {
        await sleep(getDelayMs(attempt));
      }
    }
  }

  throw lastError;
};

/**
 * Executes fetch with AbortController timeout support.
 *
 * Args:
 * @param {Function} fetchFn - Fetch-compatible function to call.
 * @param {string} url - Request URL.
 * @param {object} options - Fetch options to merge with the abort signal.
 * @param {string} label - Operation label used in timeout error messages.
 * @param {number} timeoutMs - Timeout duration in milliseconds.
 *
 * Returns:
 * @returns {Promise<Response>} Fetch response when the request completes; rejects with a timeout Error for AbortError or the original fetch error otherwise.
 */
export const fetchWithTimeout = async (
  fetchFn,
  url,
  options,
  label,
  timeoutMs
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetchFn(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)} seconds`);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};
