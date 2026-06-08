import assert from 'node:assert/strict';

import {
  createSpeechClient,
  generateTextToSpeechAudio as defaultGenerateTextToSpeechAudio,
  parseResponseJson,
  transcribeWithElevenLabs as defaultTranscribeWithElevenLabs,
} from '../../engine/speechClient.js';
import { loggedTest } from '../helpers/loggedTest.js';

const LOCATION = 'server/engine/speechClient.js';

const createLogger = () => ({
  logDebug() {},
  logError() {},
});

class FakeFormData {
  constructor() {
    this.entries = [];
  }

  append(name, value, options) {
    this.entries.push({ name, options, value });
  }

  getHeaders() {
    return {
      'x-form-data': 'fake',
    };
  }
}

loggedTest('parseResponseJson - JSON body', LOCATION, async () => {
  const parsed = await parseResponseJson({
    text: async () => '{"text":"hello"}',
  });

  assert.deepEqual(parsed, { text: 'hello' });
});

loggedTest('parseResponseJson - raw text body', LOCATION, async () => {
  const parsed = await parseResponseJson({
    text: async () => 'not json',
  });

  assert.deepEqual(parsed, { raw: 'not json' });
});

loggedTest('createSpeechClient.transcribeWithElevenLabs - success', LOCATION, async () => {
  let request;
  const client = createSpeechClient({
    FormDataCtor: FakeFormData,
    apiKeyProvider: () => 'mock-eleven-key',
    fetchWithTimeoutFn: async (fetchFn, url, options, label, timeoutMs) => {
      request = { label, options, timeoutMs, url };
      return fetchFn(url, options);
    },
    fetchFn: async () => ({
      ok: true,
      text: async () => '{"text":"Mock transcript","audio_duration_secs":12}',
    }),
    retry: async (operation) => operation(),
    logger: createLogger(),
  });

  const result = await client.transcribeWithElevenLabs({
    buffer: Buffer.from('audio'),
    originalname: 'recording.webm',
    mimetype: 'audio/webm',
  });

  assert.equal(request.url, 'https://api.elevenlabs.io/v1/speech-to-text');
  assert.equal(request.options.headers['xi-api-key'], 'mock-eleven-key');
  assert.equal(request.options.headers['x-form-data'], 'fake');
  assert.equal(result.text, 'Mock transcript');
  assert.equal(result.audio_duration_secs, 12);
});

loggedTest('createSpeechClient.transcribeWithElevenLabs - API failure', LOCATION, async () => {
  const client = createSpeechClient({
    FormDataCtor: FakeFormData,
    apiKeyProvider: () => 'mock-eleven-key',
    fetchWithTimeoutFn: async (fetchFn, url, options) => fetchFn(url, options),
    fetchFn: async () => ({
      ok: false,
      status: 400,
      text: async () => '{"message":"Bad audio"}',
    }),
    retry: async (operation) => operation(),
    logger: createLogger(),
  });

  await assert.rejects(
    () => client.transcribeWithElevenLabs({
      buffer: Buffer.from('audio'),
      originalname: 'recording.webm',
      mimetype: 'audio/webm',
    }),
    /Bad audio/
  );
});

loggedTest('createSpeechClient.transcribeWithElevenLabs - missing API key', LOCATION, async () => {
  let fetchCalls = 0;
  let retryCalls = 0;
  const client = createSpeechClient({
    FormDataCtor: FakeFormData,
    apiKeyProvider: () => '',
    fetchWithTimeoutFn: async () => {
      fetchCalls += 1;
    },
    retry: async (operation) => {
      retryCalls += 1;
      return operation();
    },
    logger: createLogger(),
  });

  await assert.rejects(
    () => client.transcribeWithElevenLabs({
      buffer: Buffer.from('audio'),
      originalname: 'recording.webm',
      mimetype: 'audio/webm',
    }),
    (error) => error.statusCode === 500 && /ELEVEN_API_KEY/.test(error.message)
  );
  assert.equal(fetchCalls, 0);
  assert.equal(retryCalls, 0);
});

loggedTest('createSpeechClient.generateTextToSpeechAudio - success', LOCATION, async () => {
  let request;
  const client = createSpeechClient({
    apiKeyProvider: () => 'mock-eleven-key',
    fetchWithTimeoutFn: async (fetchFn, url, options, label, timeoutMs) => {
      request = { label, options, timeoutMs, url };
      return fetchFn(url, options);
    },
    fetchFn: async () => ({
      ok: true,
      arrayBuffer: async () => Buffer.from('audio bytes'),
    }),
    logger: createLogger(),
    voiceId: 'voice_123',
  });

  const result = await client.generateTextToSpeechAudio('Read this pitch.');

  assert.equal(request.url, 'https://api.elevenlabs.io/v1/text-to-speech/voice_123');
  assert.equal(request.options.headers['xi-api-key'], 'mock-eleven-key');
  assert.equal(JSON.parse(request.options.body).text, 'Read this pitch.');
  assert.equal(result.audioUrl, `data:audio/mpeg;base64,${Buffer.from('audio bytes').toString('base64')}`);
});

loggedTest('createSpeechClient.generateTextToSpeechAudio - API failure', LOCATION, async () => {
  const client = createSpeechClient({
    apiKeyProvider: () => 'mock-eleven-key',
    fetchWithTimeoutFn: async (fetchFn, url, options) => fetchFn(url, options),
    fetchFn: async () => ({
      ok: false,
      text: async () => 'TTS failed',
    }),
    logger: createLogger(),
  });

  await assert.rejects(
    () => client.generateTextToSpeechAudio('Read this pitch.'),
    (error) => error.statusCode === 500 && /Failed to generate pitch audio/.test(error.message)
  );
});

loggedTest('createSpeechClient.generateTextToSpeechAudio - missing API key', LOCATION, async () => {
  let fetchCalls = 0;
  const client = createSpeechClient({
    apiKeyProvider: () => null,
    fetchWithTimeoutFn: async () => {
      fetchCalls += 1;
    },
    logger: createLogger(),
  });

  await assert.rejects(
    () => client.generateTextToSpeechAudio('Read this pitch.'),
    (error) => error.statusCode === 500 && /ELEVEN_API_KEY/.test(error.message)
  );
  assert.equal(fetchCalls, 0);
});

loggedTest('transcribeWithElevenLabs and generateTextToSpeechAudio - default missing API key', LOCATION, async () => {
  const originalApiKey = process.env.ELEVEN_API_KEY;

  try {
    process.env.ELEVEN_API_KEY = '';

    await assert.rejects(
      () => defaultTranscribeWithElevenLabs({
        buffer: Buffer.from('audio'),
        originalname: 'recording.webm',
        mimetype: 'audio/webm',
      }),
      (error) => error.statusCode === 500 && /ELEVEN_API_KEY/.test(error.message)
    );
    await assert.rejects(
      () => defaultGenerateTextToSpeechAudio('Read this pitch.'),
      (error) => error.statusCode === 500 && /ELEVEN_API_KEY/.test(error.message)
    );
  } finally {
    if (originalApiKey === undefined) {
      delete process.env.ELEVEN_API_KEY;
    } else {
      process.env.ELEVEN_API_KEY = originalApiKey;
    }
  }
});
