import assert from 'node:assert/strict';

import {
  createAnalysisClient,
  createGeminiModelProvider,
} from '../../engine/analysisClient.js';
import { parseGeminiJson } from '../../engine/geminiParser.js';
import { loggedTest } from '../helpers/loggedTest.js';

const LOCATION = 'server/engine/analysisClient.js';

loggedTest('createGeminiModelProvider - missing API key', LOCATION, () => {
  const getModel = createGeminiModelProvider({
    GoogleGenerativeAIClient: class {},
    apiKey: '',
  });

  assert.throws(
    () => getModel(),
    /GEMINI_API_KEY environment variable is not set/
  );
});

loggedTest('createGeminiModelProvider - configured model', LOCATION, () => {
  const constructorKeys = [];
  const requestedModels = [];
  class FakeGoogleGenerativeAI {
    constructor(apiKey) {
      constructorKeys.push(apiKey);
    }

    getGenerativeModel(config) {
      requestedModels.push(config.model);
      return {
        model: config.model,
      };
    }
  }
  const getModel = createGeminiModelProvider({
    GoogleGenerativeAIClient: FakeGoogleGenerativeAI,
    apiKey: 'mock-key',
    modelName: 'gemini-test',
  });

  assert.deepEqual(getModel(), { model: 'gemini-test' });
  assert.deepEqual(getModel('gemini-other'), { model: 'gemini-other' });
  assert.deepEqual(constructorKeys, ['mock-key']);
  assert.deepEqual(requestedModels, ['gemini-test', 'gemini-other']);
});

loggedTest('createAnalysisClient.analyzeWithGemini - injected model', LOCATION, async () => {
  let capturedPrompt = '';
  const client = createAnalysisClient({
    getModel: () => ({
      generateContent: async (prompt) => {
        capturedPrompt = prompt;

        return {
          response: {
            text: () => JSON.stringify({
              clarity: 80,
              persuasiveness: 70,
              confidence: 90,
              narrative_flow: 60,
              overall_score: 75,
              summary_feedback: 'Strong pitch structure.',
              improved_transcript: 'A stronger pitch.',
            }),
          },
        };
      },
    }),
    modelNames: ['gemini-test'],
    buildPrompt: (transcript, durationSeconds) => `Prompt: ${transcript} (${durationSeconds})`,
    retry: async (operation) => operation(),
    timeout: async (promise) => promise,
    logger: {
      logDebug() {},
      logInfo() {},
    },
  });

  const analysis = await client.analyzeWithGemini('Original pitch.', 42);

  assert.equal(capturedPrompt, 'Prompt: Original pitch. (42)');
  assert.equal(analysis.overall_score, 75);
  assert.equal(analysis.summary_feedback, 'Strong pitch structure.');
  assert.equal(analysis.improved_transcript, 'A stronger pitch.');
});

loggedTest('createAnalysisClient.analyzeWithGemini - parse failure', LOCATION, async () => {
  const requestedModels = [];
  const client = createAnalysisClient({
    getModel: (modelName) => ({
      generateContent: async () => ({
        response: {
          text: () => {
            requestedModels.push(modelName);
            return '{bad json}';
          },
        },
      }),
    }),
    modelNames: ['gemini-primary', 'gemini-secondary'],
    buildPrompt: () => 'Prompt',
    parseJson: (text) => parseGeminiJson(text, {
      logDebug() {},
      logError() {},
    }),
    retry: async (operation) => operation(),
    timeout: async (promise) => promise,
    logger: {
      logDebug() {},
      logInfo() {},
    },
  });

  await assert.rejects(
    () => client.analyzeWithGemini('Original pitch.', 10),
    /Gemini returned invalid JSON/
  );
  assert.deepEqual(requestedModels, ['gemini-primary']);
});

loggedTest('createAnalysisClient.analyzeWithGemini - timeout failure', LOCATION, async () => {
  const client = createAnalysisClient({
    getModel: () => ({
      generateContent: async () => ({
        response: {
          text: () => '{}',
        },
      }),
    }),
    modelNames: ['gemini-test'],
    buildPrompt: () => 'Prompt',
    retry: async (operation) => operation(),
    timeout: async () => {
      throw new Error('Gemini analysis timed out after 45 seconds');
    },
    logger: {
      logDebug() {},
      logInfo() {},
    },
  });

  await assert.rejects(
    () => client.analyzeWithGemini('Original pitch.', 10),
    /Gemini analysis timed out/
  );
});

loggedTest('createAnalysisClient.analyzeWithGemini - retry success', LOCATION, async () => {
  let modelCalls = 0;
  let retryAttempts = 0;
  const client = createAnalysisClient({
    getModel: () => ({
      generateContent: async () => {
        modelCalls += 1;
        if (modelCalls === 1) {
          throw new Error('Temporary network failure');
        }

        return {
          response: {
            text: () => JSON.stringify({
              clarity: 90,
              persuasiveness: 80,
              confidence: 70,
              narrative_flow: 60,
              summary_feedback: 'Recovered.',
              improved_transcript: 'Recovered pitch.',
            }),
          },
        };
      },
    }),
    modelNames: ['gemini-test'],
    buildPrompt: () => 'Prompt',
    retry: async (operation, label, attempts) => {
      let lastError;
      for (let attempt = 1; attempt <= attempts; attempt += 1) {
        retryAttempts += 1;
        try {
          return await operation();
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError;
    },
    timeout: async (promise) => promise,
    attempts: 2,
    logger: {
      logDebug() {},
      logInfo() {},
    },
  });

  const analysis = await client.analyzeWithGemini('Original pitch.', 10);

  assert.equal(modelCalls, 2);
  assert.equal(retryAttempts, 2);
  assert.equal(analysis.summary_feedback, 'Recovered.');
});

loggedTest('createAnalysisClient.analyzeWithGemini - fallback success', LOCATION, async () => {
  const requestedModels = [];
  const client = createAnalysisClient({
    getModel: (modelName) => ({
      generateContent: async () => {
        requestedModels.push(modelName);

        if (modelName === 'gemini-primary') {
          const error = new Error('The model is overloaded due to high traffic');
          error.status = 503;
          throw error;
        }

        return {
          response: {
            text: () => JSON.stringify({
              clarity: 88,
              persuasiveness: 82,
              confidence: 77,
              narrative_flow: 85,
              summary_feedback: 'Fallback model recovered.',
              improved_transcript: 'Fallback pitch.',
            }),
          },
        };
      },
    }),
    modelNames: ['gemini-primary', 'gemini-secondary'],
    buildPrompt: () => 'Prompt',
    retry: async (operation) => operation(),
    timeout: async (promise) => promise,
    logger: {
      logDebug() {},
      logInfo() {},
    },
  });

  const analysis = await client.analyzeWithGemini('Original pitch.', 10);

  assert.deepEqual(requestedModels, ['gemini-primary', 'gemini-secondary']);
  assert.equal(analysis.summary_feedback, 'Fallback model recovered.');
});

loggedTest('createAnalysisClient.analyzeWithGemini - no fallback for client error', LOCATION, async () => {
  const requestedModels = [];
  const client = createAnalysisClient({
    getModel: (modelName) => ({
      generateContent: async () => {
        requestedModels.push(modelName);
        const error = new Error('Bad request');
        error.status = 400;
        throw error;
      },
    }),
    modelNames: ['gemini-primary', 'gemini-secondary'],
    buildPrompt: () => 'Prompt',
    retry: async (operation) => operation(),
    timeout: async (promise) => promise,
    logger: {
      logDebug() {},
      logInfo() {},
    },
  });

  await assert.rejects(
    () => client.analyzeWithGemini('Original pitch.', 10),
    /Bad request/
  );
  assert.deepEqual(requestedModels, ['gemini-primary']);
});
