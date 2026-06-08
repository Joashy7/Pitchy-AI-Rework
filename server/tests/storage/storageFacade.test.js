import assert from 'node:assert/strict';

import { createStorage } from '../../storage.js';
import { loggedTest } from '../helpers/loggedTest.js';

const LOCATION = 'server/storage.js';
const loggedStorageFacadeTest = (functionName, runTest) => loggedTest({
  functionName,
  location: LOCATION,
  structure: 'UNIT | Storage facade',
}, runTest);

const createLogger = () => ({
  logError() {},
});

const createSheetsClient = () => {
  let authCalls = 0;
  const pitches = [];
  const users = [];

  return {
    get authCalls() {
      return authCalls;
    },
    initializeAuth: async () => {
      authCalls += 1;
    },
    getSpreadsheetId: () => 'sheet_123',
    ensureSheet: async () => {},
    getSheetValues: async (spreadsheetId, range) => {
      if (range.startsWith('Users!')) return users;
      return pitches;
    },
    appendToSheet: async (spreadsheetId, range, row) => {
      if (range.startsWith('Users!')) {
        users.push(row);
      } else {
        pitches.push(row);
      }

      return { updatedRows: 1 };
    },
    findRowByValue: async (spreadsheetId, sheetName, column, value) => {
      const rows = sheetName === 'Users' ? users : pitches;
      const rowIndex = rows.findIndex((row) => row[0] === value);
      return rowIndex === -1 ? null : rowIndex + 1;
    },
    updateSheet: async (spreadsheetId, range, values) => {
      const match = range.match(/^Users!E(\d+)$/);
      if (match) {
        users[Number(match[1]) - 1][4] = values[0];
      }
      return { updatedRows: 1 };
    },
  };
};

loggedStorageFacadeTest('createStorage.initializeAuth - delegated auth', async () => {
  const sheetsClient = createSheetsClient();
  const storage = createStorage({
    logger: createLogger(),
    sheetsClient,
  });

  await storage.initializeAuth();

  assert.equal(sheetsClient.authCalls, 1);
});

loggedStorageFacadeTest('createStorage - repository facade flow', async () => {
  const sheetsClient = createSheetsClient();
  const storage = createStorage({
    logger: createLogger(),
    now: '2026-01-01T00:00:00.000Z',
    sheetsClient,
  });

  const createdUser = await storage.createUser({
    username: 'Joashy',
    passwordHash: 'hash',
  });
  const foundUser = await storage.findUserByUsername('joashy');
  const loginUpdate = await storage.updateUserLastLogin(createdUser.user.userId);
  const savedPitch = await storage.savePitch({
    user_name: 'Joashy',
    user_id: createdUser.user.userId,
    transcribed_pitch: 'Pitch transcript.',
    analysis_score: 90,
    duration: '0:30',
  });
  const dashboard = await storage.getDashboardData({
    userId: createdUser.user.userId,
    username: 'Joashy',
  });

  assert.equal(createdUser.user.userId, 'user_0');
  assert.equal(foundUser.username, 'Joashy');
  assert.equal(loginUpdate.success, true);
  assert.equal(savedPitch.pitchId, 'pitch_joashy_0');
  assert.equal(dashboard.pitches.length, 1);
});
