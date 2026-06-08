import assert from 'node:assert/strict';

import {
  asyncRoute,
  createApp,
  sendEngineError,
} from '../../app.js';
import { loggedTest } from '../helpers/loggedTest.js';

const LOCATION = 'server/app.js';
const loggedAppHelperTest = (functionName, runTest) => loggedTest({
  functionName,
  location: LOCATION,
  structure: 'UNIT | HTTP helpers',
}, runTest);

const createResponse = () => ({
  body: null,
  statusCode: 200,
  json(body) {
    this.body = body;
    return this;
  },
  status(statusCode) {
    this.statusCode = statusCode;
    return this;
  },
});

loggedAppHelperTest('createApp - missing engine validation', () => {
  assert.throws(
    () => createApp(),
    /createApp requires an engine instance/
  );
});

loggedAppHelperTest('sendEngineError - fallback message', () => {
  const response = createResponse();
  const error = new Error('');
  error.statusCode = 418;

  sendEngineError(
    { getErrorStatusCode: (receivedError) => receivedError.statusCode },
    response,
    error,
    'Fallback message'
  );

  assert.equal(response.statusCode, 418);
  assert.deepEqual(response.body, { error: 'Fallback message' });
});

loggedAppHelperTest('asyncRoute - caught error response', async () => {
  const response = createResponse();
  const loggedErrors = [];
  const error = new Error('Route failed');
  error.statusCode = 400;
  const handler = async () => {
    throw error;
  };
  const route = asyncRoute(
    { getErrorStatusCode: (receivedError) => receivedError.statusCode },
    'Route label',
    'Fallback message',
    handler,
    {
      logError: (...args) => loggedErrors.push(args),
    }
  );

  await route({}, response);

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, { error: 'Route failed' });
  assert.equal(loggedErrors[0][0], 'Route label:');
  assert.equal(loggedErrors[0][1], error);
});
