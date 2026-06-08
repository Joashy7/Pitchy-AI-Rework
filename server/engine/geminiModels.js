export const DEFAULT_GEMINI_MODEL_CHAIN = Object.freeze([
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
]);

const FALLBACK_STATUS_CODES = new Set([
  408,
  409,
  429,
  500,
  502,
  503,
  504,
]);

const FALLBACK_ERROR_PATTERN = /429|500|502|503|504|busy|deadline|eai_again|econnreset|etimedout|fetch failed|high traffic|network|overload|overloaded|rate limit|resource_exhausted|service unavailable|temporarily unavailable|timeout|timed out|too many requests|unavailable/i;

/**
 * Splits a configured Gemini model list into unique model names.
 *
 * Args:
 * @param {string|string[]} value - Comma, whitespace, or array based model list.
 *
 * Returns:
 * @returns {string[]} Unique Gemini model names in the order they were configured; returns an empty array when no names are provided.
 */
export const parseGeminiModelList = (value) => {
  const rawValues = Array.isArray(value)
    ? value
    : String(value || '').split(/[\s,]+/);

  return [...new Set(
    rawValues
      .map((modelName) => String(modelName || '').trim())
      .filter(Boolean)
  )];
};

/**
 * Builds the ordered Gemini model fallback chain.
 *
 * Args:
 * @param {object} [options] - Model chain options.
 * @param {object} [options.env] - Environment-like object containing GEMINI_MODEL and GEMINI_MODEL_FALLBACKS.
 * @param {string|string[]} [options.modelNames] - Explicit full model chain to use instead of env values.
 * @param {string|string[]} [options.defaultModels] - Default model chain used when env values are missing.
 *
 * Returns:
 * @returns {string[]} Ordered Gemini model names, starting with the primary model and followed by fallback models.
 */
export const getGeminiModelChain = ({
  env = process.env,
  modelNames,
  defaultModels = DEFAULT_GEMINI_MODEL_CHAIN,
} = {}) => {
  const defaultChain = parseGeminiModelList(defaultModels);

  if (modelNames !== undefined) {
    const explicitModels = parseGeminiModelList(modelNames);
    return explicitModels.length > 0 ? explicitModels : defaultChain;
  }

  const primaryModels = parseGeminiModelList(env.GEMINI_MODEL);
  const configuredFallbacks = env.GEMINI_MODEL_FALLBACKS === undefined
    ? defaultChain.slice(1)
    : parseGeminiModelList(env.GEMINI_MODEL_FALLBACKS);
  const modelChain = [
    ...(primaryModels.length > 0 ? primaryModels : defaultChain.slice(0, 1)),
    ...configuredFallbacks,
  ];

  return parseGeminiModelList(modelChain);
};

/**
 * Reads a likely HTTP/status code from a Gemini error object.
 *
 * Args:
 * @param {unknown} error - Error thrown by the Gemini SDK, fetch, retry, or timeout layer.
 *
 * Returns:
 * @returns {number|null} Numeric status code when one is present; otherwise null.
 */
export const getGeminiErrorStatusCode = (error) => {
  const statusValue = error?.status
    ?? error?.statusCode
    ?? error?.code
    ?? error?.response?.status;
  const statusCode = Number(statusValue);

  return Number.isFinite(statusCode) ? statusCode : null;
};

/**
 * Determines whether a Gemini failure should move to the next configured model.
 *
 * Args:
 * @param {unknown} error - Error thrown by the Gemini SDK, fetch, retry, or timeout layer.
 *
 * Returns:
 * @returns {boolean} True for traffic, availability, timeout, network, and retryable server errors; false for validation, JSON parsing, auth, and other non-retryable failures.
 */
export const shouldFallbackToNextGeminiModel = (error) => {
  const statusCode = getGeminiErrorStatusCode(error);

  if (statusCode && FALLBACK_STATUS_CODES.has(statusCode)) {
    return true;
  }

  const errorMessage = String(error?.message || error || '');
  return FALLBACK_ERROR_PATTERN.test(errorMessage);
};
