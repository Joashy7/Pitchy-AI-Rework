import assert from 'node:assert/strict';

import {
  createGoogleSheetsClient,
  getColumnName,
} from '../../storage/googleSheetsClient.js';
import { loggedTest } from '../helpers/loggedTest.js';

const LOCATION = 'server/storage/googleSheetsClient.js';

const createLogger = () => ({
  logError() {},
  logInfo() {},
});

loggedTest('getColumnName - spreadsheet columns', LOCATION, () => {
  assert.equal(getColumnName(1), 'A');
  assert.equal(getColumnName(26), 'Z');
  assert.equal(getColumnName(27), 'AA');
  assert.equal(getColumnName(52), 'AZ');
  assert.equal(getColumnName(53), 'BA');
});

loggedTest('createGoogleSheetsClient.getSpreadsheetId - env value', LOCATION, () => {
  const client = createGoogleSheetsClient({
    env: {
      GOOGLE_SHEETS_SPREADSHEET_ID: 'sheet_123',
    },
    initialSheetsApi: {},
    logger: createLogger(),
  });

  assert.equal(client.getSpreadsheetId(), 'sheet_123');
});

loggedTest('createGoogleSheetsClient.getSpreadsheetId - missing env', LOCATION, () => {
  const client = createGoogleSheetsClient({
    env: {},
    initialSheetsApi: {},
    logger: createLogger(),
  });

  assert.throws(
    () => client.getSpreadsheetId(),
    /GOOGLE_SHEETS_SPREADSHEET_ID environment variable is not set/
  );
});

loggedTest('createGoogleSheetsClient.initializeAuth - invalid JSON', LOCATION, async () => {
  const errors = [];
  const client = createGoogleSheetsClient({
    readFile: () => 'not json',
    logger: {
      logError: (...args) => errors.push(args),
      logInfo() {},
    },
  });

  await assert.rejects(
    () => client.initializeAuth(),
    /Unexpected token/
  );
  assert.equal(errors[0][0], 'Failed to initialize Google Sheets auth:');
});

loggedTest('createGoogleSheetsClient.initializeAuth - caches auth client', LOCATION, async () => {
  let authCalls = 0;
  let sheetsCalls = 0;
  const googleApi = {
    auth: {
      GoogleAuth: class {
        constructor(config) {
          authCalls += 1;
          this.config = config;
        }
      },
    },
    sheets: (config) => {
      sheetsCalls += 1;
      return { config };
    },
  };
  const client = createGoogleSheetsClient({
    googleApi,
    readFile: () => '{"client_email":"test@example.com"}',
    logger: createLogger(),
  });

  const firstAuth = await client.initializeAuth();
  const secondAuth = await client.initializeAuth();

  assert.equal(firstAuth, secondAuth);
  assert.equal(authCalls, 1);
  assert.equal(sheetsCalls, 1);
  assert.deepEqual(firstAuth.config.scopes, ['https://www.googleapis.com/auth/spreadsheets']);
});

loggedTest('createGoogleSheetsClient.ensureSheet - missing sheet', LOCATION, async () => {
  const calls = [];
  const api = {
    spreadsheets: {
      get: async () => ({
        data: {
          sheets: [],
        },
      }),
      batchUpdate: async (request) => {
        calls.push(['batchUpdate', request.resource.requests[0].addSheet.properties.title]);
        return { data: {} };
      },
      values: {
        get: async ({ range }) => {
          calls.push(['values.get', range]);
          return { data: { values: [] } };
        },
        update: async ({ range, resource }) => {
          calls.push(['values.update', range, resource.values[0]]);
          return { data: { updatedRows: 1 } };
        },
      },
    },
  };
  const client = createGoogleSheetsClient({
    env: {
      GOOGLE_SHEETS_SPREADSHEET_ID: 'sheet_123',
    },
    initialSheetsApi: api,
    logger: createLogger(),
  });

  await client.ensureSheet('sheet_123', 'Users', ['user_id', 'username']);

  assert.deepEqual(calls, [
    ['batchUpdate', 'Users'],
    ['values.get', 'Users!A1:B1'],
    ['values.update', 'Users!A1:B1', ['user_id', 'username']],
  ]);
});

loggedTest('createGoogleSheetsClient.ensureSheet - existing sheet', LOCATION, async () => {
  const calls = [];
  const api = {
    spreadsheets: {
      get: async () => ({
        data: {
          sheets: [
            {
              properties: {
                title: 'Users',
              },
            },
          ],
        },
      }),
      batchUpdate: async () => {
        calls.push('batchUpdate');
      },
      values: {
        get: async ({ range }) => {
          calls.push(['values.get', range]);
          return { data: { values: [['user_id', 'username']] } };
        },
        update: async () => {
          calls.push('values.update');
        },
      },
    },
  };
  const client = createGoogleSheetsClient({
    env: {
      GOOGLE_SHEETS_SPREADSHEET_ID: 'sheet_123',
    },
    initialSheetsApi: api,
    logger: createLogger(),
  });

  await client.ensureSheet('sheet_123', 'Users', ['user_id', 'username']);

  assert.deepEqual(calls, [['values.get', 'Users!A1:B1']]);
});

loggedTest('createGoogleSheetsClient.appendToSheet - row wrapper', LOCATION, async () => {
  let request;
  const api = {
    spreadsheets: {
      values: {
        append: async (receivedRequest) => {
          request = receivedRequest;
          return { data: { updatedRows: 1 } };
        },
      },
    },
  };
  const client = createGoogleSheetsClient({
    initialSheetsApi: api,
    logger: createLogger(),
  });

  const result = await client.appendToSheet('sheet_123', 'Sheet1!A:M', ['row']);

  assert.deepEqual(result, { updatedRows: 1 });
  assert.equal(request.spreadsheetId, 'sheet_123');
  assert.equal(request.range, 'Sheet1!A:M');
  assert.deepEqual(request.resource.values, [['row']]);
});

loggedTest('createGoogleSheetsClient.getSheetValues - missing values fallback', LOCATION, async () => {
  const api = {
    spreadsheets: {
      values: {
        get: async () => ({ data: {} }),
      },
    },
  };
  const client = createGoogleSheetsClient({
    initialSheetsApi: api,
    logger: createLogger(),
  });

  assert.deepEqual(await client.getSheetValues('sheet_123', 'Sheet1!A:M'), []);
});

loggedTest('createGoogleSheetsClient.findRowByValue - found and missing', LOCATION, async () => {
  const api = {
    spreadsheets: {
      values: {
        get: async () => ({
          data: {
            values: [
              ['user_id'],
              ['user_0'],
              ['user_1'],
            ],
          },
        }),
      },
    },
  };
  const client = createGoogleSheetsClient({
    env: {
      GOOGLE_SHEETS_SPREADSHEET_ID: 'sheet_123',
    },
    initialSheetsApi: api,
    logger: createLogger(),
  });

  assert.equal(await client.findRowByValue('sheet_123', 'Users', 'A', 'user_1'), 3);
  assert.equal(await client.findRowByValue('sheet_123', 'Users', 'A', 'user_404'), null);
});

loggedTest('createGoogleSheetsClient.findRowByValue - Sheets failure', LOCATION, async () => {
  const client = createGoogleSheetsClient({
    env: {
      GOOGLE_SHEETS_SPREADSHEET_ID: 'sheet_123',
    },
    initialSheetsApi: {
      spreadsheets: {
        values: {
          get: async () => {
            throw new Error('Sheets unavailable');
          },
        },
      },
    },
    logger: createLogger(),
  });

  await assert.rejects(
    () => client.findRowByValue('sheet_123', 'Users', 'A', 'user_0'),
    /Sheets unavailable/
  );
});
