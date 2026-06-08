import assert from 'node:assert/strict';

import { createApp } from '../../app.js';
import { createEngine } from '../../engine.js';
import { createPitchWorkflow } from '../../engine/pitchWorkflow.js';
import { createStorage } from '../../storage.js';
import { loggedTest } from '../helpers/loggedTest.js';

const LOCATION = 'server/app.js -> server/engine.js -> server/storage.js';

const createLogger = () => ({
  logDebug() {},
  logError() {},
  logInfo() {},
});

const createTestServer = async (engine) => {
  const app = createApp({
    engine,
    logger: createLogger(),
  });
  const server = await new Promise((resolve) => {
    const runningServer = app.listen(0, () => resolve(runningServer));
  });
  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
  };
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  const body = await response.json().catch(() => ({}));

  return {
    body,
    status: response.status,
  };
};

const createInMemorySheetsClient = () => {
  const rowsBySheet = new Map([
    ['Sheet1', []],
    ['Users', []],
  ]);
  const getSheetName = (range) => range.split('!')[0];
  const getRows = (sheetName) => rowsBySheet.get(sheetName) || [];

  return {
    initializeAuth: async () => {},
    getSpreadsheetId: () => 'sheet_123',
    ensureSheet: async () => {},
    getSheetValues: async (spreadsheetId, range) => getRows(getSheetName(range)),
    appendToSheet: async (spreadsheetId, range, row) => {
      const sheetName = getSheetName(range);
      const rows = getRows(sheetName);
      rows.push(row);
      rowsBySheet.set(sheetName, rows);

      return {
        updatedRows: 1,
      };
    },
    findRowByValue: async (spreadsheetId, sheetName, column, value) => {
      const columnIndex = column.toUpperCase().charCodeAt(0) - 65;
      const rowIndex = getRows(sheetName).findIndex((row) => row[columnIndex] === value);

      return rowIndex === -1 ? null : rowIndex + 1;
    },
    updateSheet: async (spreadsheetId, range, values) => {
      const match = range.match(/^([^!]+)!([A-Z]+)(\d+)$/);
      if (match) {
        const [, sheetName, column, rowNumber] = match;
        const rows = getRows(sheetName);
        const rowIndex = Number(rowNumber) - 1;
        const columnIndex = column.charCodeAt(0) - 65;
        rows[rowIndex][columnIndex] = values[0];
      }

      return {
        updatedRows: 1,
      };
    },
  };
};

const createMockAnalysis = () => ({
  clarity: 88,
  persuasiveness: 82,
  confidence: 84,
  narrative_flow: 80,
  overall_score: 84,
  summary_feedback: 'Mock feedback from Gemini.',
  improved_transcript: 'Our product helps founders practice clearer pitches with guided AI feedback.',
  strong_points: [],
  needs_focus: [],
  modification_regions: [],
  changes_made: [],
});

loggedTest({
  functionName: 'createApp -> createEngine -> createStorage - text pitch flow',
  location: LOCATION,
  structure: 'INTEGRATION | HTTP routes -> Engine -> Storage',
}, async () => {
  const storageClient = createStorage({
    logger: createLogger(),
    now: '2026-01-01T00:00:00.000Z',
    sheetsClient: createInMemorySheetsClient(),
  });
  const pitchWorkflow = createPitchWorkflow({
    analyzeWithGemini: async () => createMockAnalysis(),
    logger: createLogger(),
    storageClient,
  });
  const engine = createEngine({
    logger: createLogger(),
    pitchWorkflow,
    storageClient,
  });
  const server = await createTestServer(engine);

  try {
    const signup = await fetchJson(`${server.baseUrl}/signup`, {
      method: 'POST',
      body: JSON.stringify({
        username: 'Joashy',
        password: 'secret1',
      }),
    });
    const login = await fetchJson(`${server.baseUrl}/login`, {
      method: 'POST',
      body: JSON.stringify({
        username: 'Joashy',
        password: 'secret1',
      }),
    });
    const analysis = await fetchJson(`${server.baseUrl}/analyze-text`, {
      method: 'POST',
      body: JSON.stringify({
        transcript: 'Our product helps founders practice clearer pitches.',
        userId: login.body.user.userId,
        username: login.body.user.username,
      }),
    });
    const dashboard = await fetchJson(
      `${server.baseUrl}/dashboard-data?userId=${login.body.user.userId}&username=${login.body.user.username}`
    );

    assert.equal(signup.status, 201);
    assert.equal(signup.body.user.userId, 'user_0');
    assert.equal(login.status, 200);
    assert.equal(login.body.user.username, 'Joashy');
    assert.equal(analysis.status, 200);
    assert.equal(analysis.body.analysis_mode, 'text');
    assert.equal(analysis.body.score_analysis_available, false);
    assert.equal(analysis.body.storageResult.pitchId, 'pitch_joashy_0');
    assert.equal(dashboard.status, 200);
    assert.equal(dashboard.body.pitches.length, 1);
    assert.equal(dashboard.body.pitches[0].pitchId, 'pitch_joashy_0');
    assert.equal(dashboard.body.pitches[0].score_analysis_available, false);
    assert.equal(dashboard.body.stats.totalPitches, 1);
  } finally {
    await server.close();
  }
});

loggedTest({
  functionName: 'createApp -> createEngine -> mock API clients -> createStorage - full pitch flow',
  location: LOCATION,
  structure: 'INTEGRATION | HTTP routes -> Engine -> API clients -> Storage',
}, async () => {
  const apiCalls = [];
  const storageClient = createStorage({
    logger: createLogger(),
    now: '2026-01-01T00:00:00.000Z',
    sheetsClient: createInMemorySheetsClient(),
  });
  const pitchWorkflow = createPitchWorkflow({
    analyzeWithGemini: async (transcript, durationSeconds) => {
      apiCalls.push(['gemini', transcript, durationSeconds]);
      return createMockAnalysis();
    },
    generateTextToSpeechAudio: async (text) => {
      apiCalls.push(['eleven-tts', text]);
      return {
        audioUrl: `data:audio/mpeg;base64,${Buffer.from(text).toString('base64')}`,
      };
    },
    logger: createLogger(),
    storageClient,
    transcribeWithElevenLabs: async (file) => {
      apiCalls.push(['eleven-stt', file.originalname, file.mimetype]);
      return {
        text: 'Mock audio transcript for a recorded pitch.',
        audio_duration_secs: 42,
      };
    },
  });
  const engine = createEngine({
    logger: createLogger(),
    pitchWorkflow,
    storageClient,
  });
  const server = await createTestServer(engine);

  try {
    await engine.initializeEngine();
    const signup = await fetchJson(`${server.baseUrl}/signup`, {
      method: 'POST',
      body: JSON.stringify({
        username: 'MockUser',
        password: 'secret1',
      }),
    });
    const login = await fetchJson(`${server.baseUrl}/login`, {
      method: 'POST',
      body: JSON.stringify({
        username: 'MockUser',
        password: 'secret1',
      }),
    });
    const textAnalysis = await fetchJson(`${server.baseUrl}/analyze-text`, {
      method: 'POST',
      body: JSON.stringify({
        transcript: 'Typed pitch for mock Gemini analysis.',
        userId: login.body.user.userId,
        username: login.body.user.username,
      }),
    });
    const audioForm = new FormData();
    audioForm.set(
      'file',
      new Blob([Buffer.from('mock audio bytes')], { type: 'audio/webm' }),
      'recording.webm'
    );
    audioForm.set('userId', login.body.user.userId);
    audioForm.set('username', login.body.user.username);

    const audioResponse = await fetch(`${server.baseUrl}/analyze`, {
      method: 'POST',
      body: audioForm,
    });
    const audioAnalysis = await audioResponse.json();
    const generatedAudio = await fetchJson(`${server.baseUrl}/generate-pitch-audio`, {
      method: 'POST',
      body: JSON.stringify({
        transcript: 'Read this mock improved pitch.',
      }),
    });
    const dashboard = await fetchJson(
      `${server.baseUrl}/dashboard-data?userId=${login.body.user.userId}&username=${login.body.user.username}`
    );

    assert.equal(signup.status, 201);
    assert.equal(login.status, 200);
    assert.equal(textAnalysis.status, 200);
    assert.equal(textAnalysis.body.analysis_mode, 'text');
    assert.equal(audioResponse.status, 200);
    assert.equal(audioAnalysis.analysis_mode, 'audio');
    assert.equal(audioAnalysis.transcript, 'Mock audio transcript for a recorded pitch.');
    assert.equal(generatedAudio.status, 200);
    assert.match(generatedAudio.body.audioUrl, /^data:audio\/mpeg;base64,/);
    assert.equal(dashboard.body.stats.totalPitches, 2);
    assert.deepEqual(apiCalls.map(([name]) => name), [
      'gemini',
      'eleven-stt',
      'gemini',
      'eleven-tts',
    ]);
  } finally {
    await server.close();
  }
});
