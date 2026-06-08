import assert from 'node:assert/strict';

import {
  logDebug,
  logError,
  logInfo,
  logWarn,
} from '../logger.js';
import { loggedTest } from './helpers/loggedTest.js';

const LOCATION = 'server/logger.js';

const captureConsoleMethod = async (methodName, callback) => {
  const originalMethod = console[methodName];
  const calls = [];
  console[methodName] = (...args) => {
    calls.push(args);
  };

  try {
    await callback(calls);
  } finally {
    console[methodName] = originalMethod;
  }
};

loggedTest('logInfo - console output', LOCATION, async () => {
  await captureConsoleMethod('log', async (calls) => {
    logInfo('Storage ready', { mode: 'local' });

    assert.deepEqual(calls, [['Storage ready', { mode: 'local' }]]);
  });
});

loggedTest('logWarn - console warning output', LOCATION, async () => {
  await captureConsoleMethod('warn', async (calls) => {
    logWarn('Missing optional config');

    assert.deepEqual(calls, [['Missing optional config']]);
  });
});

loggedTest('logError - console error output', LOCATION, async () => {
  await captureConsoleMethod('error', async (calls) => {
    logError('Engine failed', new Error('boom'));

    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], 'Engine failed');
    assert.equal(calls[0][1].message, 'boom');
  });
});

loggedTest('logDebug - respects debug flag', LOCATION, async () => {
  await captureConsoleMethod('log', async (calls) => {
    logDebug('debug message');

    if (process.env.PITCHY_DEBUG === 'true') {
      assert.deepEqual(calls, [['debug message']]);
      return;
    }

    assert.deepEqual(calls, []);
  });
});
