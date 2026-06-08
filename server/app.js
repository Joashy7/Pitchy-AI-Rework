import express from 'express';
import multer from 'multer';
import cors from 'cors';

import { createEngineError } from './engine/errors.js';
import { logError } from './logger.js';
import {
  FAILED_ACCOUNT_CREATE,
  FAILED_ANALYZE_SPEECH,
  FAILED_ANALYZE_TEXT,
  FAILED_DASHBOARD_DATA,
  FAILED_GENERATE_AUDIO,
  FAILED_LOGIN,
} from './messages.js';

export const MAX_AUDIO_UPLOAD_BYTES = 25 * 1024 * 1024;

export const ALLOWED_AUDIO_MIME_TYPES = new Set([
  'audio/webm',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/ogg',
]);

/**
 * Creates the Multer upload middleware used for audio pitch submissions.
 *
 * Args:
 * @param {object} [options] - Optional upload configuration overrides.
 * @param {Set<string>} [options.allowedMimeTypes] - MIME types accepted for uploaded audio files.
 * @param {object} [options.limits] - Multer upload limits, including file size.
 * @param {object} [options.storage] - Multer storage engine to use for uploaded files.
 *
 * Returns:
 * @returns {import('multer').Multer} A Multer instance that accepts supported audio uploads or rejects unsupported file types with status code 400.
 */
export const createAudioUpload = ({
  allowedMimeTypes = ALLOWED_AUDIO_MIME_TYPES,
  limits = { fileSize: MAX_AUDIO_UPLOAD_BYTES },
  storage = multer.memoryStorage(),
} = {}) => multer({
  fileFilter: (req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(createEngineError('Unsupported audio file type', 400));
    }

    return callback(null, true);
  },
  limits,
  storage,
});

/**
 * Sends a JSON error response using the engine's error status mapping.
 *
 * Args:
 * @param {object} engine - Engine facade that exposes getErrorStatusCode.
 * @param {object} res - Express response object used to send the error payload.
 * @param {Error & {statusCode?: number}} error - Error thrown by a route or middleware.
 * @param {string} fallbackMessage - Message used when the error does not include one.
 *
 * Returns:
 * @returns {object} The Express response returned by res.status(...).json(...).
 */
export const sendEngineError = (engine, res, error, fallbackMessage) => {
  const statusCode = engine.getErrorStatusCode(error);

  return res.status(statusCode).json({
    error: error.message || fallbackMessage,
  });
};

/**
 * Wraps an async Express route handler with consistent logging and error responses.
 *
 * Args:
 * @param {object} engine - Engine facade used for error status mapping.
 * @param {string} errorLabel - Prefix used when logging route failures.
 * @param {string} fallbackMessage - Message used when the thrown error has no message.
 * @param {Function} handler - Async route handler that receives req and res.
 * @param {object} [logger] - Logger with a logError function.
 *
 * Returns:
 * @returns {Function} Express-compatible async route handler that returns the handler result or an error response.
 */
export const asyncRoute = (
  engine,
  errorLabel,
  fallbackMessage,
  handler,
  logger = { logError }
) => async (req, res) => {
  try {
    return await handler(req, res);
  } catch (error) {
    logger.logError(`${errorLabel}:`, error);
    return sendEngineError(engine, res, error, fallbackMessage);
  }
};

/**
 * Creates the Express application and wires HTTP routes to the engine facade.
 *
 * Args:
 * @param {object} [options] - App construction options.
 * @param {object} options.engine - Engine facade with dashboard, auth, analysis, audio, and error helpers.
 * @param {object} [options.logger] - Logger with a logError function.
 * @param {object} [options.upload] - Multer upload middleware instance for audio files.
 *
 * Returns:
 * @returns {import('express').Express} Configured Express app with health, auth, dashboard, analysis, upload, and audio routes.
 */
export const createApp = ({
  engine,
  logger = { logError },
  upload = createAudioUpload(),
} = {}) => {
  if (!engine) {
    throw new Error('createApp requires an engine instance');
  }

  const app = express();
  const route = (errorLabel, fallbackMessage, handler) => (
    asyncRoute(engine, errorLabel, fallbackMessage, handler, logger)
  );

  app.use(cors());
  app.use(express.json());

  app.get('/', (req, res) => {
    res.send('Pitchy AI Server is running');
  });

  app.get(
    '/dashboard-data',
    route('Dashboard data error', FAILED_DASHBOARD_DATA, async (req, res) => {
      const dashboardData = await engine.getDashboardData(req.query);

      if (!dashboardData.success) {
        return res.status(500).json(dashboardData);
      }

      return res.json(dashboardData);
    })
  );

  app.post(
    '/signup',
    route('Signup error', FAILED_ACCOUNT_CREATE, async (req, res) => {
      return res.status(201).json(await engine.signUpUser(req.body));
    })
  );

  app.post(
    '/login',
    route('Login error', FAILED_LOGIN, async (req, res) => {
      return res.json(await engine.loginUser(req.body));
    })
  );

  app.post(
    '/analyze',
    upload.single('file'),
    route('Analyze error', FAILED_ANALYZE_SPEECH, async (req, res) => {
      return res.json(await engine.analyzePitchFile(req.file, req.body));
    })
  );

  app.post(
    '/analyze-text',
    route('Analyze text error', FAILED_ANALYZE_TEXT, async (req, res) => {
      const { transcript, userId, username } = req.body;

      return res.json(await engine.analyzePitchText(transcript, { userId, username }));
    })
  );

  app.post(
    '/generate-pitch-audio',
    route('TTS route error', FAILED_GENERATE_AUDIO, async (req, res) => {
      return res.json(await engine.generatePitchAudio(req.body.transcript));
    })
  );

  app.use((error, req, res, next) => {
    void next;
    logger.logError('Request middleware error:', error);

    if (error.code === 'LIMIT_FILE_SIZE') {
      return sendEngineError(
        engine,
        res,
        createEngineError('Audio file is too large', 413),
        'Audio file is too large'
      );
    }

    return sendEngineError(engine, res, error, error.message || 'Request failed');
  });

  return app;
};
