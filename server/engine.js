import dotenv from 'dotenv';

import * as storage from './storage.js';
import { analyzeWithGemini } from './engine/analysisClient.js';
import {
  formatDuration,
  generateImprovementSuggestions,
  normalizeAnalysis,
} from './engine/analysisNormalizer.js';
import {
  createDashboardService,
} from './engine/dashboardService.js';
import { getErrorStatusCode } from './engine/errors.js';
import { logInfo } from './logger.js';
import {
  createPitchWorkflow,
} from './engine/pitchWorkflow.js';
import {
  generateTextToSpeechAudio,
  transcribeWithElevenLabs,
} from './engine/speechClient.js';
import {
  createUserService,
} from './engine/userService.js';

dotenv.config({ quiet: true });

export { getErrorStatusCode };
export {
  analyzeWithGemini,
  generateImprovementSuggestions,
  normalizeAnalysis,
  formatDuration,
  transcribeWithElevenLabs,
};

/**
 * Creates the backend engine facade that coordinates workflow, users, dashboard, API clients, and storage.
 *
 * Args:
 * @param {object} [options] - Optional engine dependencies.
 * @param {object} [options.storageClient] - Storage facade used for persistence and initialization.
 * @param {object} [options.dashboardService] - Dashboard service with getDashboardData.
 * @param {object} [options.pitchWorkflow] - Pitch workflow with audio, text, and audio generation handlers.
 * @param {object} [options.userService] - User service with signup and login handlers.
 * @param {object} [options.logger] - Logger with a logInfo function.
 *
 * Returns:
 * @returns {object} Engine facade with initializeEngine, auth, dashboard, analysis, audio, and error helper functions.
 */
export const createEngine = ({
  storageClient = storage,
  dashboardService = createDashboardService({ storageClient }),
  pitchWorkflow = createPitchWorkflow({ storageClient }),
  userService = createUserService({ storageClient }),
  logger = { logInfo },
} = {}) => {
  const initializeEngine = async () => {
    await storageClient.initializeAuth();
    logger.logInfo('Storage system initialized successfully');
  };

  return {
    analyzePitchFile: pitchWorkflow.analyzePitchFile,
    analyzePitchText: pitchWorkflow.analyzePitchText,
    analyzeWithGemini,
    formatDuration,
    generateImprovementSuggestions,
    generatePitchAudio: pitchWorkflow.generatePitchAudio,
    generateTextToSpeechAudio,
    getDashboardData: dashboardService.getDashboardData,
    getErrorStatusCode,
    initializeEngine,
    loginUser: userService.loginUser,
    normalizeAnalysis,
    signUpUser: userService.signUpUser,
    transcribeWithElevenLabs,
  };
};

const defaultEngine = createEngine();

/**
 * Initializes the default engine and its storage system.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default engine initializeEngine function.
 *
 * Returns:
 * @returns {Promise<void>} Resolves when storage initializes successfully; rejects if storage initialization fails.
 */
export const initializeEngine = (...args) => defaultEngine.initializeEngine(...args);

/**
 * Loads dashboard data through the default engine.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default engine getDashboardData function.
 *
 * Returns:
 * @returns {Promise<object>} Dashboard response with success, pitches, and stats; failures are returned by the underlying service contract.
 */
export const getDashboardData = (...args) => defaultEngine.getDashboardData(...args);

/**
 * Creates a user account through the default engine.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default engine signUpUser function.
 *
 * Returns:
 * @returns {Promise<object>} Signup result with success true and a public user object; rejects with a status-coded error on validation or duplicate username failures.
 */
export const signUpUser = (...args) => defaultEngine.signUpUser(...args);

/**
 * Logs in a user through the default engine.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default engine loginUser function.
 *
 * Returns:
 * @returns {Promise<object>} Login result with success true and a public user object; rejects with status 401 for invalid credentials.
 */
export const loginUser = (...args) => defaultEngine.loginUser(...args);

/**
 * Analyzes an uploaded pitch audio file through the default engine.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default engine analyzePitchFile function.
 *
 * Returns:
 * @returns {Promise<object>} Audio analysis response including transcript, scores, feedback, improvedPitch, improvementSuggestions, and storageResult.
 */
export const analyzePitchFile = (...args) => defaultEngine.analyzePitchFile(...args);

/**
 * Analyzes a typed pitch transcript through the default engine.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default engine analyzePitchText function.
 *
 * Returns:
 * @returns {Promise<object>} Text analysis response with score_analysis_available false, analysis_mode "text", feedback, improvedPitch, improvementSuggestions, and storageResult.
 */
export const analyzePitchText = (...args) => defaultEngine.analyzePitchText(...args);

/**
 * Generates text-to-speech audio for a transcript through the default engine.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default engine generatePitchAudio function.
 *
 * Returns:
 * @returns {Promise<object>} Audio response containing audioUrl; rejects with a status-coded error when the transcript is missing or generation fails.
 */
export const generatePitchAudio = (...args) => defaultEngine.generatePitchAudio(...args);

export default defaultEngine;
