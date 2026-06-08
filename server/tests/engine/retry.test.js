import assert from 'node:assert/strict';

import {
  fetchWithTimeout,
  withRetries,
  withTimeout,
} from '../../engine/retry.js';
import { loggedTest } from '../helpers/loggedTest.js';

const LOCATION = 'server/engine/retry.js';
const SILENT_LOGGER = {
  logDebug() {},
  logError() {},
};

loggedTest('withRetries - eventual success', LOCATION, async () => {
  const delays = [];
  let attempts = 0;

  const result = await withRetries(
    async () => {
      attempts += 1;
      if (attempts < 3) {
        throw new Error('Try again');
      }
      return 'success';
    },
    'retry test',
    {
      attempts: 3,
      getDelayMs: (attempt) => attempt * 10,
      logger: SILENT_LOGGER,
      sleep: async (delay) => {
        delays.push(delay);
      },
    }
  );

  assert.equal(result, 'success');
  assert.equal(attempts, 3);
  assert.deepEqual(delays, [10, 20]);
});

loggedTest('withRetries - final failure', LOCATION, async () => {
  let attempts = 0;

  await assert.rejects(
    () => withRetries(
      async () => {
        attempts += 1;
        throw new Error('Still failing');
      },
      'retry failure test',
      {
        attempts: 2,
        logger: SILENT_LOGGER,
        sleep: async () => {},
        getDelayMs: () => 0,
      }
    ),
    /Still failing/
  );
  assert.equal(attempts, 2);
});

loggedTest('withTimeout - resolves fast promise', LOCATION, async () => {
  const result = await withTimeout(Promise.resolve('done'), 'fast operation', 100);

  assert.equal(result, 'done');
});

loggedTest('withTimeout - rejects slow promise', LOCATION, async () => {
  await assert.rejects(
    () => withTimeout(new Promise(() => {}), 'slow operation', 1),
    /slow operation timed out after 0 seconds/
  );
});

loggedTest('fetchWithTimeout - passes abort signal', LOCATION, async () => {
  let receivedSignal;
  const response = await fetchWithTimeout(
    async (url, options) => {
      receivedSignal = options.signal;
      return {
        ok: true,
        url,
      };
    },
    'https://example.test',
    { method: 'GET' },
    'mock fetch',
    100
  );

  assert.equal(response.ok, true);
  assert.equal(receivedSignal instanceof AbortSignal, true);
});

loggedTest('fetchWithTimeout - maps abort errors', LOCATION, async () => {
  await assert.rejects(
    () => fetchWithTimeout(
      async () => {
        const error = new Error('Aborted');
        error.name = 'AbortError';
        throw error;
      },
      'https://example.test',
      {},
      'mock fetch',
      100
    ),
    /mock fetch timed out after 0 seconds/
  );
});
