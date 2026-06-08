import assert from 'node:assert/strict';

import { createEngine } from '../../engine.js';
import { createPitchWorkflow } from '../../engine/pitchWorkflow.js';
import { createUserService } from '../../engine/userService.js';
import { loggedTest } from '../helpers/loggedTest.js';

const LOCATION = 'server/engine.js';

const createLogger = () => ({
  logDebug() {},
  logInfo() {},
});

const createMockStorage = () => {
  const users = new Map();
  const pitches = [];

  return {
    pitches,
    createUser: async ({ username, passwordHash }) => {
      if (users.has(username.toLowerCase())) {
        return {
          success: false,
          error: 'Username already exists',
        };
      }

      const user = {
        userId: `user_${users.size}`,
        username,
        passwordHash,
      };
      users.set(username.toLowerCase(), user);

      return {
        success: true,
        user,
      };
    },
    findUserByUsername: async (username) => users.get(username.toLowerCase()) || null,
    getDashboardData: async () => ({
      success: true,
      pitches,
      stats: {
        totalPitches: pitches.length,
      },
    }),
    initializeAuth: async () => {},
    savePitch: async (pitchData) => {
      const pitch = {
        ...pitchData,
        pitchId: `pitch_${pitches.length}`,
      };
      pitches.push(pitch);

      return {
        success: true,
        pitchId: pitch.pitchId,
      };
    },
    updateUserLastLogin: async () => ({
      success: true,
    }),
  };
};

const createMockAnalysis = () => ({
  clarity: 80,
  persuasiveness: 75,
  confidence: 85,
  narrative_flow: 70,
  overall_score: 78,
  summary_feedback: 'Mock Gemini feedback.',
  improved_transcript: 'Mock improved pitch.',
  strong_points: [],
  needs_focus: [],
  modification_regions: [],
  changes_made: [],
});

loggedTest('createEngine - mocked full workflow', LOCATION, async () => {
  const storageClient = createMockStorage();
  const pitchWorkflow = createPitchWorkflow({
    analyzeWithGemini: async () => createMockAnalysis(),
    generateTextToSpeechAudio: async (text) => ({
      audioUrl: `data:audio/mpeg;base64,${Buffer.from(text).toString('base64')}`,
    }),
    logger: createLogger(),
    storageClient,
    transcribeWithElevenLabs: async () => ({
      text: 'Mock audio transcript.',
      audio_duration_secs: 15,
    }),
  });
  const userService = createUserService({
    hashPasswordFn: (password) => `hash:${password}`,
    storageClient,
    verifyPasswordFn: (password, hash) => hash === `hash:${password}`,
  });
  const engine = createEngine({
    logger: createLogger(),
    pitchWorkflow,
    storageClient,
    userService,
  });

  await engine.initializeEngine();
  const signup = await engine.signUpUser({
    username: 'Joashy',
    password: 'secret1',
  });
  const login = await engine.loginUser({
    username: 'Joashy',
    password: 'secret1',
  });
  const textAnalysis = await engine.analyzePitchText(
    'Our product helps founders pitch more clearly.',
    login.user
  );
  const audioAnalysis = await engine.analyzePitchFile({
    buffer: Buffer.from('audio'),
    originalname: 'recording.webm',
    mimetype: 'audio/webm',
  }, login.user);
  const audio = await engine.generatePitchAudio('Read this improved pitch.');
  const dashboard = await engine.getDashboardData(login.user);

  assert.equal(signup.user.userId, 'user_0');
  assert.equal(login.user.username, 'Joashy');
  assert.equal(textAnalysis.score_analysis_available, false);
  assert.equal(audioAnalysis.score_analysis_available, true);
  assert.equal(audioAnalysis.transcript, 'Mock audio transcript.');
  assert.match(audio.audioUrl, /^data:audio\/mpeg;base64,/);
  assert.equal(dashboard.stats.totalPitches, 2);
});
