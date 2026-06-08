import assert from 'node:assert/strict';

import { createApp, createAudioUpload } from '../../app.js';
import { loggedTest } from '../helpers/loggedTest.js';

const LOCATION = 'server/app.js';

const createLogger = () => ({
  logError() {},
});

const createTestServer = async (engine, appOptions = {}) => {
  const app = createApp({
    engine,
    logger: createLogger(),
    ...appOptions,
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

const createBaseEngine = (overrides = {}) => ({
  analyzePitchFile: async () => ({ success: true }),
  analyzePitchText: async () => ({ success: true }),
  generatePitchAudio: async () => ({ audioUrl: 'data:audio/mpeg;base64,abc' }),
  getDashboardData: async () => ({
    success: true,
    pitches: [],
    stats: { totalPitches: 0 },
  }),
  getErrorStatusCode: (error = {}) => error.statusCode || 500,
  loginUser: async () => ({
    success: true,
    user: { userId: 'user_0', username: 'Joashy' },
  }),
  signUpUser: async () => ({
    success: true,
    user: { userId: 'user_0', username: 'Joashy' },
  }),
  ...overrides,
});

loggedTest('createApp - health route', LOCATION, async () => {
  const server = await createTestServer(createBaseEngine());

  try {
    const response = await fetch(`${server.baseUrl}/`);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'Pitchy AI Server is running');
  } finally {
    await server.close();
  }
});

loggedTest('createApp - login route', LOCATION, async () => {
  let receivedBody;
  const server = await createTestServer(createBaseEngine({
    loginUser: async (body) => {
      receivedBody = body;
      return {
        success: true,
        user: { userId: 'user_0', username: body.username },
      };
    },
  }));

  try {
    const { body, status } = await fetchJson(`${server.baseUrl}/login`, {
      method: 'POST',
      body: JSON.stringify({
        username: 'Joashy',
        password: 'secret1',
      }),
    });

    assert.equal(status, 200);
    assert.deepEqual(receivedBody, {
      username: 'Joashy',
      password: 'secret1',
    });
    assert.equal(body.user.username, 'Joashy');
  } finally {
    await server.close();
  }
});

loggedTest('createApp - signup route', LOCATION, async () => {
  const server = await createTestServer(createBaseEngine());

  try {
    const { status, body } = await fetchJson(`${server.baseUrl}/signup`, {
      method: 'POST',
      body: JSON.stringify({
        username: 'Joashy',
        password: 'secret1',
      }),
    });

    assert.equal(status, 201);
    assert.equal(body.success, true);
  } finally {
    await server.close();
  }
});

loggedTest('createApp - dashboard route', LOCATION, async () => {
  let receivedQuery;
  const server = await createTestServer(createBaseEngine({
    getDashboardData: async (query) => {
      receivedQuery = query;
      return {
        success: true,
        pitches: [{ id: 'pitch_joashy_0' }],
        stats: { totalPitches: 1 },
      };
    },
  }));

  try {
    const { status, body } = await fetchJson(
      `${server.baseUrl}/dashboard-data?userId=user_0&username=Joashy`
    );

    assert.equal(status, 200);
    assert.equal(receivedQuery.userId, 'user_0');
    assert.equal(receivedQuery.username, 'Joashy');
    assert.equal(body.pitches[0].id, 'pitch_joashy_0');
  } finally {
    await server.close();
  }
});

loggedTest('createApp - dashboard failure route', LOCATION, async () => {
  const server = await createTestServer(createBaseEngine({
    getDashboardData: async () => ({
      success: false,
      error: 'Sheets unavailable',
      pitches: [],
      stats: { totalPitches: 0 },
    }),
  }));

  try {
    const { status, body } = await fetchJson(`${server.baseUrl}/dashboard-data`);

    assert.equal(status, 500);
    assert.equal(body.success, false);
    assert.equal(body.error, 'Sheets unavailable');
  } finally {
    await server.close();
  }
});

loggedTest('createApp - text analysis route', LOCATION, async () => {
  let receivedTranscript;
  let receivedUser;
  const server = await createTestServer(createBaseEngine({
    analyzePitchText: async (transcript, user) => {
      receivedTranscript = transcript;
      receivedUser = user;
      return {
        transcript,
        success: true,
      };
    },
  }));

  try {
    const { status, body } = await fetchJson(`${server.baseUrl}/analyze-text`, {
      method: 'POST',
      body: JSON.stringify({
        transcript: 'Typed pitch.',
        userId: 'user_0',
        username: 'Joashy',
      }),
    });

    assert.equal(status, 200);
    assert.equal(receivedTranscript, 'Typed pitch.');
    assert.deepEqual(receivedUser, {
      userId: 'user_0',
      username: 'Joashy',
    });
    assert.equal(body.transcript, 'Typed pitch.');
  } finally {
    await server.close();
  }
});

loggedTest('createApp - text analysis missing transcript', LOCATION, async () => {
  const server = await createTestServer(createBaseEngine({
    analyzePitchText: async () => {
      const error = new Error('Pitch text is required');
      error.statusCode = 400;
      throw error;
    },
  }));

  try {
    const { status, body } = await fetchJson(`${server.baseUrl}/analyze-text`, {
      method: 'POST',
      body: JSON.stringify({}),
    });

    assert.equal(status, 400);
    assert.equal(body.error, 'Pitch text is required');
  } finally {
    await server.close();
  }
});

loggedTest('createApp - pitch audio route', LOCATION, async () => {
  const server = await createTestServer(createBaseEngine());

  try {
    const { status, body } = await fetchJson(`${server.baseUrl}/generate-pitch-audio`, {
      method: 'POST',
      body: JSON.stringify({
        transcript: 'Pitch audio please.',
      }),
    });

    assert.equal(status, 200);
    assert.equal(body.audioUrl, 'data:audio/mpeg;base64,abc');
  } finally {
    await server.close();
  }
});

loggedTest('createApp - pitch audio missing transcript', LOCATION, async () => {
  const server = await createTestServer(createBaseEngine({
    generatePitchAudio: async () => {
      const error = new Error('Transcript is required');
      error.statusCode = 400;
      throw error;
    },
  }));

  try {
    const { status, body } = await fetchJson(`${server.baseUrl}/generate-pitch-audio`, {
      method: 'POST',
      body: JSON.stringify({}),
    });

    assert.equal(status, 400);
    assert.equal(body.error, 'Transcript is required');
  } finally {
    await server.close();
  }
});

loggedTest('createApp - login validation error', LOCATION, async () => {
  const server = await createTestServer(createBaseEngine({
    loginUser: async () => {
      const error = new Error('Invalid username or password');
      error.statusCode = 401;
      throw error;
    },
  }));

  try {
    const { status, body } = await fetchJson(`${server.baseUrl}/login`, {
      method: 'POST',
      body: JSON.stringify({
        username: 'Joashy',
        password: 'bad-password',
      }),
    });

    assert.equal(status, 401);
    assert.equal(body.error, 'Invalid username or password');
  } finally {
    await server.close();
  }
});

loggedTest('createApp - signup validation error', LOCATION, async () => {
  const server = await createTestServer(createBaseEngine({
    signUpUser: async () => {
      const error = new Error('Username is required');
      error.statusCode = 400;
      throw error;
    },
  }));

  try {
    const { status, body } = await fetchJson(`${server.baseUrl}/signup`, {
      method: 'POST',
      body: JSON.stringify({
        username: '',
        password: 'secret1',
      }),
    });

    assert.equal(status, 400);
    assert.equal(body.error, 'Username is required');
  } finally {
    await server.close();
  }
});

loggedTest('createApp - error status mapping', LOCATION, async () => {
  const server = await createTestServer(createBaseEngine({
    analyzePitchText: async () => {
      const error = new Error('Invalid transcript');
      error.statusCode = 400;
      throw error;
    },
  }));

  try {
    const { status, body } = await fetchJson(`${server.baseUrl}/analyze-text`, {
      method: 'POST',
      body: JSON.stringify({
        transcript: '',
      }),
    });

    assert.equal(status, 400);
    assert.equal(body.error, 'Invalid transcript');
  } finally {
    await server.close();
  }
});

loggedTest('createApp - audio analysis missing file', LOCATION, async () => {
  const server = await createTestServer(createBaseEngine({
    analyzePitchFile: async (file) => {
      assert.equal(file, undefined);
      const error = new Error('No audio file uploaded');
      error.statusCode = 400;
      throw error;
    },
  }));

  try {
    const { status, body } = await fetchJson(`${server.baseUrl}/analyze`, {
      method: 'POST',
      body: JSON.stringify({}),
    });

    assert.equal(status, 400);
    assert.equal(body.error, 'No audio file uploaded');
  } finally {
    await server.close();
  }
});

loggedTest('createApp - audio analysis unsupported file type', LOCATION, async () => {
  let analyzeCalls = 0;
  const server = await createTestServer(createBaseEngine({
    analyzePitchFile: async () => {
      analyzeCalls += 1;
      return { success: true };
    },
  }));

  try {
    const formData = new FormData();
    formData.append(
      'file',
      new Blob(['not audio'], { type: 'text/plain' }),
      'pitch.txt'
    );

    const response = await fetch(`${server.baseUrl}/analyze`, {
      method: 'POST',
      body: formData,
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error, 'Unsupported audio file type');
    assert.equal(analyzeCalls, 0);
  } finally {
    await server.close();
  }
});

loggedTest('createApp - audio analysis file too large', LOCATION, async () => {
  let analyzeCalls = 0;
  const upload = createAudioUpload({ limits: { fileSize: 4 } });
  const server = await createTestServer(createBaseEngine({
    analyzePitchFile: async () => {
      analyzeCalls += 1;
      return { success: true };
    },
  }), { upload });

  try {
    const formData = new FormData();
    formData.append(
      'file',
      new Blob(['large audio'], { type: 'audio/webm' }),
      'recording.webm'
    );

    const response = await fetch(`${server.baseUrl}/analyze`, {
      method: 'POST',
      body: formData,
    });
    const body = await response.json();

    assert.equal(response.status, 413);
    assert.equal(body.error, 'Audio file is too large');
    assert.equal(analyzeCalls, 0);
  } finally {
    await server.close();
  }
});

loggedTest('createApp - audio analysis route', LOCATION, async () => {
  let receivedFile;
  let receivedBody;
  const server = await createTestServer(createBaseEngine({
    analyzePitchFile: async (file, body) => {
      receivedFile = file;
      receivedBody = body;
      return {
        success: true,
        originalname: file.originalname,
      };
    },
  }));

  try {
    const formData = new FormData();
    formData.append(
      'file',
      new Blob(['fake audio'], { type: 'audio/webm' }),
      'recording.webm'
    );
    formData.append('username', 'Joashy');

    const response = await fetch(`${server.baseUrl}/analyze`, {
      method: 'POST',
      body: formData,
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(receivedFile.originalname, 'recording.webm');
    assert.equal(receivedBody.username, 'Joashy');
    assert.equal(body.originalname, 'recording.webm');
  } finally {
    await server.close();
  }
});
