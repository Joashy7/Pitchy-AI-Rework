import { GoogleGenerativeAI } from '@google/generative-ai';

import { normalizeAnalysis } from './analysisNormalizer.js';
import { parseGeminiJson } from './geminiParser.js';
import {
  DEFAULT_GEMINI_MODEL_CHAIN,
  getGeminiModelChain,
  shouldFallbackToNextGeminiModel,
} from './geminiModels.js';
import { buildAnalysisPrompt } from './prompts.js';
import { logDebug, logInfo } from '../logger.js';
import { withRetries, withTimeout } from './retry.js';

const GEMINI_TIMEOUT_MS = 45000;

/**
 * Creates a lazy Gemini model provider.
 *
 * Args:
 * @param {object} [options] - Gemini model provider options.
 * @param {Function} [options.GoogleGenerativeAIClient] - GoogleGenerativeAI constructor to use.
 * @param {string} [options.apiKey] - Gemini API key read from the environment by default.
 * @param {Function} [options.apiKeyProvider] - Function that returns the Gemini API key at model call time.
 * @param {string} [options.modelName] - Gemini model name to load.
 *
 * Returns:
 * @returns {Function} Function that returns the requested Gemini model; throws when GEMINI_API_KEY is missing.
 */
export const createGeminiModelProvider = ({
  GoogleGenerativeAIClient = GoogleGenerativeAI,
  apiKey,
  apiKeyProvider = () => apiKey ?? process.env.GEMINI_API_KEY,
  modelName = DEFAULT_GEMINI_MODEL_CHAIN[0],
} = {}) => {
  let genAI;
  let activeApiKey;

  return (requestedModelName = modelName) => {
    const resolvedApiKey = apiKeyProvider();

    if (!resolvedApiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    if (!genAI || activeApiKey !== resolvedApiKey) {
      genAI = new GoogleGenerativeAIClient(resolvedApiKey);
      activeApiKey = resolvedApiKey;
    }

    return genAI.getGenerativeModel({ model: requestedModelName });
  };
};

/**
 * Creates the Gemini analysis client.
 *
 * Args:
 * @param {object} [options] - Analysis client dependencies and settings.
 * @param {Function} [options.getModel] - Function that returns a Gemini model with generateContent for an optional model name.
 * @param {string|string[]} [options.modelNames] - Explicit Gemini model fallback chain.
 * @param {Function} [options.getModelNames] - Function that returns the current Gemini model fallback chain.
 * @param {Function} [options.buildPrompt] - Function that builds the Gemini prompt from transcript and duration.
 * @param {Function} [options.normalize] - Function that normalizes parsed Gemini analysis.
 * @param {Function} [options.parseJson] - Function that parses Gemini text into JSON.
 * @param {Function} [options.shouldFallback] - Function that decides whether an API error should move to the next model.
 * @param {Function} [options.retry] - Retry wrapper for Gemini requests.
 * @param {Function} [options.timeout] - Timeout wrapper for Gemini requests.
 * @param {number} [options.timeoutMs] - Gemini timeout in milliseconds.
 * @param {number} [options.attempts] - Number of Gemini retry attempts.
 * @param {object} [options.logger] - Logger with logDebug and logInfo functions.
 *
 * Returns:
 * @returns {object} Analysis client with analyzeWithGemini, which returns normalized analysis or rejects on API, timeout, or JSON parse failures.
 */
export const createAnalysisClient = ({
  getModel = createGeminiModelProvider(),
  modelNames,
  getModelNames = () => getGeminiModelChain({ modelNames }),
  buildPrompt = buildAnalysisPrompt,
  normalize = normalizeAnalysis,
  parseJson = parseGeminiJson,
  shouldFallback = shouldFallbackToNextGeminiModel,
  retry = withRetries,
  timeout = withTimeout,
  timeoutMs = GEMINI_TIMEOUT_MS,
  attempts = 2,
  logger = {
    logDebug,
    logInfo,
  },
} = {}) => {
  /**
   * Generates raw text from one Gemini model for a prompt.
   *
   * Args:
   * @param {string} prompt - Prompt sent to Gemini.
   * @param {string} label - Operation label used for retry and timeout messages.
   * @param {string} modelName - Gemini model name used for this attempt.
   *
   * Returns:
   * @returns {Promise<string>} Trimmed Gemini response text; rejects on model, retry, or timeout failures.
   */
  const generateGeminiTextForModel = async (prompt, label, modelName) => retry(
    async () => {
      const result = await timeout(
        getModel(modelName).generateContent(prompt),
        label,
        timeoutMs
      );

      return result.response.text().trim();
    },
    `${label} (${modelName})`,
    attempts
  );

  /**
   * Generates raw text from Gemini with fallback across configured models.
   *
   * Args:
   * @param {string} prompt - Prompt sent to Gemini.
   * @param {string} label - Operation label used for retry and timeout messages.
   *
   * Returns:
   * @returns {Promise<string>} Trimmed Gemini response text from the first successful model; rejects with the final model error or a configuration error when no models are available.
   */
  const generateGeminiText = async (prompt, label) => {
    const modelChain = getModelNames();

    if (modelChain.length === 0) {
      throw new Error('No Gemini models configured');
    }

    let lastError;

    for (let index = 0; index < modelChain.length; index += 1) {
      const modelName = modelChain[index];

      try {
        logger.logInfo(`Gemini analysis using ${modelName}`);
        return await generateGeminiTextForModel(prompt, label, modelName);
      } catch (error) {
        lastError = error;
        const nextModel = modelChain[index + 1];

        if (!nextModel || !shouldFallback(error)) {
          throw error;
        }

        logger.logInfo(
          `Gemini model ${modelName} failed with retryable error; trying ${nextModel}`
        );
      }
    }

    throw lastError;
  };

  /**
   * Analyzes a transcript with Gemini and normalizes the result.
   *
   * Args:
   * @param {string} transcript - Transcript to analyze.
   * @param {number} durationSeconds - Speech duration in seconds.
   *
   * Returns:
   * @returns {Promise<object>} Normalized analysis object; rejects when Gemini fails, times out, or returns malformed JSON.
   */
  const analyzeWithGemini = async (transcript, durationSeconds) => {
    logger.logInfo('Gemini analysis started');

    const text = await generateGeminiText(
      buildPrompt(transcript, durationSeconds),
      'Gemini analysis'
    );

    logger.logDebug('Raw Gemini response:', text);

    return normalize(parseJson(text), transcript, durationSeconds);
  };

  return {
    analyzeWithGemini,
  };
};

const defaultAnalysisClient = createAnalysisClient();

/**
 * Analyzes a transcript with Gemini through the default analysis client.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default analyzeWithGemini function.
 *
 * Returns:
 * @returns {Promise<object>} Normalized analysis object; rejects on Gemini API, timeout, or malformed JSON failures.
 */
export const analyzeWithGemini = (...args) => (
  defaultAnalysisClient.analyzeWithGemini(...args)
);
