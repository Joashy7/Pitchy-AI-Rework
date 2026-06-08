import * as defaultStorage from '../storage.js';

import { analyzeWithGemini as defaultAnalyzeWithGemini } from './analysisClient.js';
import {
  formatDuration,
  generateImprovementSuggestions,
  toText,
} from './analysisNormalizer.js';
import { createEngineError } from './errors.js';
import {
  generateTextToSpeechAudio as defaultGenerateTextToSpeechAudio,
  transcribeWithElevenLabs as defaultTranscribeWithElevenLabs,
} from './speechClient.js';
import { logDebug, logInfo } from '../logger.js';
import {
  PITCH_TEXT_REQUIRED,
  TEXT_SCORE_ANALYSIS_MESSAGE,
} from '../messages.js';

const TEXT_ANALYSIS_WORDS_PER_MINUTE = 130;

/**
 * Estimates speech duration for typed transcript input.
 *
 * Args:
 * @param {unknown} transcript - Transcript text used for word-count based duration estimation.
 *
 * Returns:
 * @returns {number} Estimated duration in seconds using 130 words per minute.
 */
export const estimateTranscriptDurationSeconds = (transcript) => {
  const words = toText(transcript).split(/\s+/).filter(Boolean);
  return Math.round((words.length / TEXT_ANALYSIS_WORDS_PER_MINUTE) * 60);
};

/**
 * Removes delivery scores from text-only analysis responses.
 *
 * Args:
 * @param {object} analysis - Normalized analysis object to convert into text-only mode.
 *
 * Returns:
 * @returns {object} Analysis copy with clarity, persuasiveness, confidence, narrative_flow, and overall_score set to null, score_analysis_available false, analysis_mode "text", and score_analysis_message populated.
 */
export const suppressScoreAnalysis = (analysis) => ({
  ...analysis,
  clarity: null,
  persuasiveness: null,
  confidence: null,
  narrative_flow: null,
  overall_score: null,
  score_analysis_available: false,
  analysis_mode: 'text',
  score_analysis_message: TEXT_SCORE_ANALYSIS_MESSAGE,
});

/**
 * Builds the storage payload for a pitch analysis result.
 *
 * Args:
 * @param {string} transcript - Transcript text to store.
 * @param {number} durationSeconds - Duration used when analysis duration is missing.
 * @param {object} user - User identity with username and userId.
 * @param {object} analysis - Analysis result containing scores, feedback, improved transcript, and duration.
 *
 * Returns:
 * @returns {object} Storage payload with user fields, transcript, improvedPitch, scores, summary feedback, and duration.
 */
export const buildPitchStorageData = (
  transcript,
  durationSeconds,
  user,
  analysis
) => ({
  user_name: toText(user.username),
  user_id: toText(user.userId),
  transcribed_pitch: transcript,
  improvedPitch: analysis.improved_transcript || '',
  analysis_score: analysis.overall_score ?? '',
  improvement_suggestion_text: analysis.summary_feedback,
  clarity_score: analysis.clarity ?? '',
  persuasiveness_score: analysis.persuasiveness ?? '',
  confidence_score: analysis.confidence ?? '',
  narrative_flow_score: analysis.narrative_flow ?? '',
  duration: analysis.duration || formatDuration(durationSeconds),
});

/**
 * Creates the pitch workflow service for audio, text, storage, and text-to-speech.
 *
 * Args:
 * @param {object} [options] - Pitch workflow dependencies.
 * @param {object} [options.storageClient] - Storage facade with savePitch.
 * @param {Function} [options.analyzeWithGemini] - Function that analyzes transcript text.
 * @param {Function} [options.transcribeWithElevenLabs] - Function that transcribes uploaded audio.
 * @param {Function} [options.generateTextToSpeechAudio] - Function that generates text-to-speech audio.
 * @param {object} [options.logger] - Logger with logDebug and logInfo functions.
 *
 * Returns:
 * @returns {object} Workflow with analyzePitchFile, analyzePitchText, and generatePitchAudio; audio analysis returns analysis_mode "audio" with scores, text analysis returns analysis_mode "text" with score_analysis_available false, and audio generation returns audioUrl.
 */
export const createPitchWorkflow = ({
  storageClient = defaultStorage,
  analyzeWithGemini = defaultAnalyzeWithGemini,
  transcribeWithElevenLabs = defaultTranscribeWithElevenLabs,
  generateTextToSpeechAudio = defaultGenerateTextToSpeechAudio,
  logger = {
    logDebug,
    logInfo,
  },
} = {}) => {
  /**
   * Analyzes a transcript, builds suggestions, saves it, and returns the response payload.
   *
   * Args:
   * @param {string} transcript - Transcript text to analyze and save.
   * @param {number} durationSeconds - Recorded or estimated duration in seconds.
   * @param {object} [user] - User identity with userId and username.
   * @param {object} [options] - Analysis response options.
   * @param {boolean} [options.includeScores] - Set false to suppress delivery score analysis for text-only input.
   *
   * Returns:
   * @returns {Promise<object>} Analysis payload with transcript, analysis fields, improvedPitch, improvementSuggestions, and storageResult; analysis_mode is "audio" when scores are included and "text" when scores are suppressed.
   */
  const analyzeTranscript = async (
    transcript,
    durationSeconds,
    user = {},
    options = {}
  ) => {
    const analysis = await analyzeWithGemini(transcript, durationSeconds);
    const responseAnalysis = options.includeScores === false
      ? suppressScoreAnalysis(analysis)
      : {
          ...analysis,
          score_analysis_available: true,
          analysis_mode: 'audio',
        };
    const improvementSuggestions = generateImprovementSuggestions(responseAnalysis);
    const improvedPitch = responseAnalysis.improved_transcript || '';
    const storageResult = await storageClient.savePitch(
      buildPitchStorageData(transcript, durationSeconds, user, responseAnalysis)
    );

    logger.logDebug('Storage result:', storageResult);

    return {
      transcript,
      ...responseAnalysis,
      improvedPitch,
      improvementSuggestions,
      storageResult,
    };
  };

  /**
   * Analyzes an uploaded audio pitch file.
   *
   * Args:
   * @param {object} file - Uploaded audio file object with buffer, originalname, and mimetype.
   * @param {object} [user] - User identity with userId and username.
   *
   * Returns:
   * @returns {Promise<object>} Audio analysis payload with analysis_mode "audio", score_analysis_available true, transcript, scores, feedback, improvedPitch, improvementSuggestions, and storageResult; rejects with status 400 when file is missing.
   */
  const analyzePitchFile = async (file, user = {}) => {
    if (!file) {
      throw createEngineError('No audio file uploaded', 400);
    }

    logger.logInfo('Analyze workflow started');

    const sttData = await transcribeWithElevenLabs(file);
    const transcript = sttData.text || 'No transcript returned';
    const durationSeconds = sttData.audio_duration_secs || 0;

    logger.logDebug('Transcript ready for analysis:', transcript);

    return analyzeTranscript(transcript, durationSeconds, user);
  };

  /**
   * Analyzes typed pitch text without delivery score analysis.
   *
   * Args:
   * @param {unknown} transcript - Typed pitch transcript.
   * @param {object} [user] - User identity with userId and username.
   *
   * Returns:
   * @returns {Promise<object>} Text analysis payload with analysis_mode "text", score_analysis_available false, null score fields, feedback, improvedPitch, improvementSuggestions, and storageResult; rejects with status 400 when transcript is empty.
   */
  const analyzePitchText = async (transcript, user = {}) => {
    const text = toText(transcript);

    if (!text) {
      throw createEngineError(PITCH_TEXT_REQUIRED, 400);
    }

    logger.logInfo('Text pitch analysis workflow started');
    logger.logDebug('Text pitch transcript:', text);

    return analyzeTranscript(
      text,
      estimateTranscriptDurationSeconds(text),
      user,
      { includeScores: false }
    );
  };

  /**
   * Generates text-to-speech audio for a transcript.
   *
   * Args:
   * @param {unknown} transcript - Transcript text to convert into audio.
   *
   * Returns:
   * @returns {Promise<{audioUrl: string}>} Data URL audio payload; rejects with status 400 when transcript text is missing.
   */
  const generatePitchAudio = async (transcript) => {
    const text = toText(transcript);
    if (!text) {
      throw createEngineError('Transcript is required', 400);
    }

    return generateTextToSpeechAudio(text);
  };

  return {
    analyzePitchFile,
    analyzePitchText,
    generatePitchAudio,
  };
};

const defaultPitchWorkflow = createPitchWorkflow();

/**
 * Analyzes an uploaded audio file through the default pitch workflow.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default analyzePitchFile function.
 *
 * Returns:
 * @returns {Promise<object>} Audio analysis with transcript, analysis_mode "audio", score_analysis_available true, scores, feedback, improvedPitch, improvementSuggestions, and storageResult; rejects with status 400 when no file is uploaded.
 */
export const analyzePitchFile = (...args) => (
  defaultPitchWorkflow.analyzePitchFile(...args)
);

/**
 * Analyzes typed transcript text through the default pitch workflow.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default analyzePitchText function.
 *
 * Returns:
 * @returns {Promise<object>} Text analysis with transcript, analysis_mode "text", score_analysis_available false, null score fields, feedback, improvedPitch, improvementSuggestions, and storageResult; rejects with status 400 when text is missing.
 */
export const analyzePitchText = (...args) => (
  defaultPitchWorkflow.analyzePitchText(...args)
);

/**
 * Generates speech audio for a transcript through the default pitch workflow.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default generatePitchAudio function.
 *
 * Returns:
 * @returns {Promise<object>} Audio payload containing audioUrl; rejects with status 400 when transcript text is missing.
 */
export const generatePitchAudio = (...args) => (
  defaultPitchWorkflow.generatePitchAudio(...args)
);
