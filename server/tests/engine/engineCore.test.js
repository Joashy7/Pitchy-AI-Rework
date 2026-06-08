import assert from 'node:assert/strict';

import {
  analyzePitchFile as defaultAnalyzePitchFile,
  analyzePitchText as defaultAnalyzePitchText,
  createEngine,
  generatePitchAudio as defaultGeneratePitchAudio,
  loginUser as defaultLoginUser,
  signUpUser as defaultSignUpUser,
} from '../../engine.js';
import { createDashboardService } from '../../engine/dashboardService.js';
import {
  createEngineError,
  getErrorStatusCode,
} from '../../engine/errors.js';
import { loggedTest } from '../helpers/loggedTest.js';

const ENGINE_LOCATION = 'server/engine.js';
const DASHBOARD_LOCATION = 'server/engine/dashboardService.js';
const ERRORS_LOCATION = 'server/engine/errors.js';
const loggedEngineFacadeTest = (functionName, runTest) => loggedTest({
  functionName,
  location: ENGINE_LOCATION,
  structure: 'UNIT | Engine facade',
}, runTest);

loggedEngineFacadeTest('createEngine.initializeEngine - storage init success', async () => {
  const messages = [];
  let initialized = false;
  const engine = createEngine({
    storageClient: {
      initializeAuth: async () => {
        initialized = true;
      },
    },
    logger: {
      logInfo: (...args) => messages.push(args),
    },
  });

  await engine.initializeEngine();

  assert.equal(initialized, true);
  assert.deepEqual(messages[0], ['Storage system initialized successfully']);
});

loggedEngineFacadeTest('createEngine.initializeEngine - storage init failure', async () => {
  const engine = createEngine({
    storageClient: {
      initializeAuth: async () => {
        throw new Error('Sheets auth failed');
      },
    },
    logger: {
      logInfo() {},
    },
  });

  await assert.rejects(
    () => engine.initializeEngine(),
    /Sheets auth failed/
  );
});

loggedEngineFacadeTest('createEngine - delegates services', async () => {
  const calls = [];
  const engine = createEngine({
    dashboardService: {
      getDashboardData: async (user) => {
        calls.push(['dashboard', user]);
        return { success: true };
      },
    },
    pitchWorkflow: {
      analyzePitchFile: async (file, user) => {
        calls.push(['file', file, user]);
        return { success: true };
      },
      analyzePitchText: async (transcript, user) => {
        calls.push(['text', transcript, user]);
        return { success: true };
      },
      generatePitchAudio: async (transcript) => {
        calls.push(['audio', transcript]);
        return { audioUrl: 'data:audio/mpeg;base64,abc' };
      },
    },
    storageClient: {
      initializeAuth: async () => {},
    },
    userService: {
      loginUser: async (credentials) => {
        calls.push(['login', credentials]);
        return { success: true };
      },
      signUpUser: async (credentials) => {
        calls.push(['signup', credentials]);
        return { success: true };
      },
    },
  });

  await engine.getDashboardData({ userId: 'user_0' });
  await engine.analyzePitchText('Pitch.', { userId: 'user_0' });
  await engine.analyzePitchFile({ originalname: 'audio.webm' }, { userId: 'user_0' });
  await engine.generatePitchAudio('Read this.');
  await engine.loginUser({ username: 'Joashy' });
  await engine.signUpUser({ username: 'Joashy' });

  assert.deepEqual(calls, [
    ['dashboard', { userId: 'user_0' }],
    ['text', 'Pitch.', { userId: 'user_0' }],
    ['file', { originalname: 'audio.webm' }, { userId: 'user_0' }],
    ['audio', 'Read this.'],
    ['login', { username: 'Joashy' }],
    ['signup', { username: 'Joashy' }],
  ]);
});

loggedEngineFacadeTest('analyzePitchFile, analyzePitchText, generatePitchAudio - default validation', async () => {
  await assert.rejects(
    () => defaultAnalyzePitchFile(null),
    (error) => error.statusCode === 400 && /No audio file uploaded/.test(error.message)
  );
  await assert.rejects(
    () => defaultAnalyzePitchText('   '),
    (error) => error.statusCode === 400 && /Pitch text is required/.test(error.message)
  );
  await assert.rejects(
    () => defaultGeneratePitchAudio(''),
    (error) => error.statusCode === 400 && /Transcript is required/.test(error.message)
  );
});

loggedEngineFacadeTest('signUpUser and loginUser - default validation', async () => {
  await assert.rejects(
    () => defaultSignUpUser({ username: '', password: '' }),
    (error) => error.statusCode === 400 && /Username is required/.test(error.message)
  );
  await assert.rejects(
    () => defaultLoginUser({ username: 'Joashy', password: '' }),
    (error) => error.statusCode === 400 && /Password is required/.test(error.message)
  );
});

loggedTest('createDashboardService.getDashboardData - delegates user', DASHBOARD_LOCATION, async () => {
  let receivedUser;
  const dashboardService = createDashboardService({
    storageClient: {
      getDashboardData: async (user) => {
        receivedUser = user;
        return { success: true };
      },
    },
  });

  const result = await dashboardService.getDashboardData({
    userId: 'user_0',
    username: 'Joashy',
  });

  assert.equal(result.success, true);
  assert.deepEqual(receivedUser, {
    userId: 'user_0',
    username: 'Joashy',
  });
});

loggedTest('createEngineError and getErrorStatusCode - status helpers', ERRORS_LOCATION, () => {
  const error = createEngineError('Invalid request', 422);

  assert.equal(error.message, 'Invalid request');
  assert.equal(error.statusCode, 422);
  assert.equal(getErrorStatusCode(error), 422);
  assert.equal(getErrorStatusCode(new Error('Unknown')), 500);
});
