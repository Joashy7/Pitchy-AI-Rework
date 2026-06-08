import assert from 'node:assert/strict';

import {
  DEFAULT_GEMINI_MODEL_CHAIN,
  getGeminiErrorStatusCode,
  getGeminiModelChain,
  parseGeminiModelList,
  shouldFallbackToNextGeminiModel,
} from '../../engine/geminiModels.js';
import { loggedTest } from '../helpers/loggedTest.js';

const LOCATION = 'server/engine/geminiModels.js';

loggedTest('parseGeminiModelList - configured list', LOCATION, () => {
  assert.deepEqual(
    parseGeminiModelList('gemini-a, gemini-b  gemini-a\n gemini-c'),
    ['gemini-a', 'gemini-b', 'gemini-c']
  );
});

loggedTest('getGeminiModelChain - default chain', LOCATION, () => {
  assert.deepEqual(getGeminiModelChain({ env: {} }), DEFAULT_GEMINI_MODEL_CHAIN);
});

loggedTest('getGeminiModelChain - env chain', LOCATION, () => {
  assert.deepEqual(
    getGeminiModelChain({
      env: {
        GEMINI_MODEL: 'gemini-primary',
        GEMINI_MODEL_FALLBACKS: 'gemini-secondary,gemini-primary,gemini-third',
      },
    }),
    ['gemini-primary', 'gemini-secondary', 'gemini-third']
  );
});

loggedTest('getGeminiModelChain - explicit chain', LOCATION, () => {
  assert.deepEqual(
    getGeminiModelChain({
      env: {
        GEMINI_MODEL: 'gemini-env-primary',
      },
      modelNames: ['gemini-explicit-primary', 'gemini-explicit-secondary'],
    }),
    ['gemini-explicit-primary', 'gemini-explicit-secondary']
  );
});

loggedTest('getGeminiErrorStatusCode - nested status', LOCATION, () => {
  assert.equal(getGeminiErrorStatusCode({ response: { status: '503' } }), 503);
  assert.equal(getGeminiErrorStatusCode(new Error('No status')), null);
});

loggedTest('shouldFallbackToNextGeminiModel - retryable status', LOCATION, () => {
  assert.equal(shouldFallbackToNextGeminiModel({ status: 503 }), true);
  assert.equal(shouldFallbackToNextGeminiModel({ statusCode: 429 }), true);
});

loggedTest('shouldFallbackToNextGeminiModel - retryable message', LOCATION, () => {
  assert.equal(
    shouldFallbackToNextGeminiModel(new Error('Model overloaded due to high traffic')),
    true
  );
  assert.equal(
    shouldFallbackToNextGeminiModel(new Error('Gemini analysis timed out after 45 seconds')),
    true
  );
});

loggedTest('shouldFallbackToNextGeminiModel - nonretryable failure', LOCATION, () => {
  assert.equal(shouldFallbackToNextGeminiModel({ status: 400 }), false);
  assert.equal(
    shouldFallbackToNextGeminiModel(new Error('Gemini returned invalid JSON')),
    false
  );
});
