import assert from 'node:assert/strict';

import { createStorage } from '../../storage.js';
import { loggedTest } from '../helpers/loggedTest.js';

const LOCATION = 'server/storage.js';

const createLogger = () => ({
  logError() {},
  logInfo() {},
});

const createInMemorySheetsClient = () => {
  const rowsBySheet = new Map([
    ['Sheet1', []],
    ['Users', []],
  ]);
  const getSheetName = (range) => range.split('!')[0];
  const getRangeRows = (range) => rowsBySheet.get(getSheetName(range)) || [];

  return {
    appendCalls: [],
    initializeAuth: async () => {},
    getSpreadsheetId: () => 'sheet_123',
    ensureSheet: async () => {},
    getSheetValues: async (spreadsheetId, range) => getRangeRows(range),
    appendToSheet: async (spreadsheetId, range, row) => {
      const rows = getRangeRows(range);
      rows.push(row);
      rowsBySheet.set(getSheetName(range), rows);

      return {
        updatedRows: 1,
      };
    },
    findRowByValue: async (spreadsheetId, sheetName, column, value) => {
      const rows = rowsBySheet.get(sheetName) || [];
      const rowIndex = rows.findIndex((row) => row[0] === value);

      return rowIndex === -1 ? null : rowIndex + 1;
    },
    updateSheet: async (spreadsheetId, range, values) => {
      const match = range.match(/^Users!E(\d+)$/);
      if (match) {
        const rowIndex = Number(match[1]) - 1;
        const rows = rowsBySheet.get('Users') || [];
        rows[rowIndex][4] = values[0];
      }

      return {
        updatedRows: 1,
      };
    },
  };
};

loggedTest('createStorage - user pitch dashboard flow', LOCATION, async () => {
  const sheetsClient = createInMemorySheetsClient();
  const storage = createStorage({
    logger: createLogger(),
    now: '2026-01-01T00:00:00.000Z',
    sheetsClient,
  });

  const createdUser = await storage.createUser({
    username: 'Joashy',
    passwordHash: 'hash',
  });
  const duplicateUser = await storage.createUser({
    username: 'joashy',
    passwordHash: 'hash',
  });
  const savedPitch = await storage.savePitch({
    user_name: 'Joashy',
    user_id: createdUser.user.userId,
    transcribed_pitch: 'A real pitch transcript.',
    improvedPitch: 'A stronger pitch transcript.',
    analysis_score: 88,
    duration: '0:45',
  });
  const dashboard = await storage.getDashboardData({
    userId: createdUser.user.userId,
    username: 'Joashy',
  });

  assert.equal(createdUser.success, true);
  assert.equal(createdUser.user.userId, 'user_0');
  assert.equal(duplicateUser.success, false);
  assert.equal(duplicateUser.error, 'Username already exists');
  assert.equal(savedPitch.success, true);
  assert.equal(savedPitch.pitchId, 'pitch_joashy_0');
  assert.equal(dashboard.success, true);
  assert.equal(dashboard.pitches.length, 1);
  assert.equal(dashboard.pitches[0].pitchId, 'pitch_joashy_0');
  assert.equal(dashboard.stats.totalPitches, 1);
});

loggedTest('createStorage - anonymous dashboard isolation', LOCATION, async () => {
  const sheetsClient = createInMemorySheetsClient();
  const storage = createStorage({
    logger: createLogger(),
    now: '2026-01-01T00:00:00.000Z',
    sheetsClient,
  });

  await storage.savePitch({
    transcribed_pitch: 'Anonymous pitch.',
    analysis_score: '',
    duration: '0:10',
  });
  await storage.savePitch({
    user_name: 'Joashy',
    user_id: 'user_0',
    transcribed_pitch: 'User pitch.',
    analysis_score: 90,
    duration: '0:30',
  });

  const anonymousDashboard = await storage.getDashboardData();
  const userDashboard = await storage.getDashboardData({
    userId: 'user_0',
    username: 'Joashy',
  });

  assert.equal(anonymousDashboard.pitches.length, 1);
  assert.equal(anonymousDashboard.pitches[0].pitchId, 'pitch_0');
  assert.equal(userDashboard.pitches.length, 1);
  assert.equal(userDashboard.pitches[0].pitchId, 'pitch_joashy_0');
});
