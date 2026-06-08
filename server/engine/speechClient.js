import fetch from 'node-fetch';
import FormData from 'form-data';

import { createEngineError } from './errors.js';
import { logDebug, logError } from '../logger.js';
import { FAILED_GENERATE_AUDIO } from '../messages.js';
import { fetchWithTimeout, withRetries } from './retry.js';

const ELEVEN_TIMEOUT_MS = 30000;
const ELEVEN_TTS_VOICE_ID = 'pqHfZKP75CvOlQylNhV4';

/**
 * Parses an HTTP response body as JSON with raw text fallback.
 *
 * Args:
 * @param {object} response - Fetch Response-like object with a text function.
 *
 * Returns:
 * @returns {Promise<object>} Parsed JSON object when valid; otherwise an object shaped as {raw: string}.
 */
export const parseResponseJson = async (response) => {
  const rawText = await response.text();

  try {
    return JSON.parse(rawText);
  } catch {
    return { raw: rawText };
  }
};

/**
 * Reads optional multipart headers from a FormData instance.
 *
 * Args:
 * @param {object} formData - FormData-like object that may expose getHeaders.
 *
 * Returns:
 * @returns {object} Multipart headers from formData.getHeaders(); returns {} when getHeaders is unavailable.
 */
const getFormHeaders = (formData) => (
  typeof formData.getHeaders === 'function' ? formData.getHeaders() : {}
);

/**
 * Creates the ElevenLabs speech client for speech-to-text and text-to-speech.
 *
 * Args:
 * @param {object} [options] - Speech client dependencies and configuration.
 * @param {Function} [options.fetchFn] - Fetch-compatible function used for ElevenLabs calls.
 * @param {Function} [options.FormDataCtor] - FormData constructor used for audio uploads.
 * @param {Function} [options.parseJson] - Response JSON parser.
 * @param {Function} [options.retry] - Retry wrapper for speech-to-text calls.
 * @param {Function} [options.fetchWithTimeoutFn] - Fetch wrapper with timeout support.
 * @param {number} [options.timeoutMs] - ElevenLabs request timeout in milliseconds.
 * @param {string} [options.voiceId] - ElevenLabs voice ID used for text-to-speech.
 * @param {Function} [options.apiKeyProvider] - Function that returns ELEVEN_API_KEY.
 * @param {object} [options.logger] - Logger with logDebug and logError functions.
 *
 * Returns:
 * @returns {object} Speech client with transcribeWithElevenLabs and generateTextToSpeechAudio; both reject with status 500 when ELEVEN_API_KEY is missing, and API failures reject with the relevant ElevenLabs or app error.
 */
export const createSpeechClient = ({
  fetchFn = fetch,
  FormDataCtor = FormData,
  parseJson = parseResponseJson,
  retry = withRetries,
  fetchWithTimeoutFn = fetchWithTimeout,
  timeoutMs = ELEVEN_TIMEOUT_MS,
  voiceId = ELEVEN_TTS_VOICE_ID,
  apiKeyProvider = () => process.env.ELEVEN_API_KEY,
  logger = {
    logDebug,
    logError,
  },
} = {}) => {
  /**
   * Reads and validates the ElevenLabs API key.
   *
   * Args:
   * None.
   *
   * Returns:
   * @returns {string} ElevenLabs API key; throws status 500 when ELEVEN_API_KEY is missing.
   */
  const getApiKey = () => {
    const apiKey = apiKeyProvider();

    if (!apiKey) {
      throw createEngineError('ELEVEN_API_KEY environment variable is not set', 500);
    }

    return apiKey;
  };

  /**
   * Transcribes an uploaded audio file with ElevenLabs speech-to-text.
   *
   * Args:
   * @param {object} file - Uploaded file with buffer, originalname, and mimetype.
   *
   * Returns:
   * @returns {Promise<object>} Parsed ElevenLabs transcription response such as {text, audio_duration_secs}; rejects for missing API key, timeout, network errors, or non-OK API responses.
   */
  const transcribeWithElevenLabs = async (file) => {
    const apiKey = getApiKey();

    return retry(async () => {
      const formData = new FormDataCtor();
      formData.append('file', file.buffer, {
        filename: file.originalname || 'recording.webm',
        contentType: file.mimetype || 'audio/webm',
      });
      formData.append('model_id', 'scribe_v2');

      const response = await fetchWithTimeoutFn(
        fetchFn,
        'https://api.elevenlabs.io/v1/speech-to-text',
        {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            ...getFormHeaders(formData),
          },
          body: formData,
        },
        'ElevenLabs speech-to-text',
        timeoutMs
      );
      const data = await parseJson(response);

      logger.logDebug('ElevenLabs response:', data);

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            data.raw ||
            `Speech-to-text failed with status ${response.status}`
        );
      }

      return data;
    }, 'ElevenLabs speech-to-text');
  };

  /**
   * Generates spoken audio from text with ElevenLabs text-to-speech.
   *
   * Args:
   * @param {string} text - Transcript text to synthesize.
   *
   * Returns:
   * @returns {Promise<{audioUrl: string}>} Base64 audio data URL when successful; rejects with status 500 for missing API key or text-to-speech generation failure.
   */
  const generateTextToSpeechAudio = async (text) => {
    const apiKey = getApiKey();

    const response = await fetchWithTimeoutFn(
      fetchFn,
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.75,
          },
        }),
      },
      'ElevenLabs text-to-speech',
      timeoutMs
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.logError('ElevenLabs TTS error:', errorText);
      throw createEngineError(FAILED_GENERATE_AUDIO, 500);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return {
      audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
    };
  };

  return {
    generateTextToSpeechAudio,
    transcribeWithElevenLabs,
  };
};

const defaultSpeechClient = createSpeechClient();

/**
 * Transcribes an uploaded audio file with the default ElevenLabs client.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default transcribeWithElevenLabs function.
 *
 * Returns:
 * @returns {Promise<object>} ElevenLabs transcription response such as {text, audio_duration_secs}; rejects for missing ELEVEN_API_KEY, timeout, network, or non-OK API responses.
 */
export const transcribeWithElevenLabs = (...args) => (
  defaultSpeechClient.transcribeWithElevenLabs(...args)
);

/**
 * Generates text-to-speech audio with the default ElevenLabs client.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default generateTextToSpeechAudio function.
 *
 * Returns:
 * @returns {Promise<{audioUrl: string}>} Data URL audio payload when successful; rejects for missing ELEVEN_API_KEY, timeout, network, or ElevenLabs generation failures.
 */
export const generateTextToSpeechAudio = (...args) => (
  defaultSpeechClient.generateTextToSpeechAudio(...args)
);
