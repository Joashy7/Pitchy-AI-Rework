import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  createSheetsClientForMode,
  createStorage,
  getStorageMode,
  isLocalStorageMode,
} from '../../storage.js';
import { createLocalSheetsClient } from '../../storage/localSheetsClient.js';
import {
  PITCH_HEADERS,
  PITCHES_SHEET_NAME,
  USER_HEADERS,
  USERS_SHEET_NAME,
} from '../../storage/schema.js';
import { loggedTest } from '../helpers/loggedTest.js';

const LOCATION = 'server/storage/localSheetsClient.js';
const FACADE_LOCATION = 'server/storage.js';

const createLogger = () => ({
  logError() {},
  logInfo() {},
});

const withTempStoragePath = async (callback) => {
  const tempDir = await mkdtemp(join(tmpdir(), 'pitchy-local-storage-'));
  const storagePath = join(tempDir, 'storage.json');

  try {
    return await callback(storagePath);
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
};

loggedTest('createLocalSheetsClient - sheet operations', LOCATION, async () => {
  await withTempStoragePath(async (storagePath) => {
    const client = createLocalSheetsClient({
      logger: createLogger(),
      storagePath,
    });

    await client.initializeAuth();
    await client.ensureSheet('local', USERS_SHEET_NAME, USER_HEADERS);
    await client.appendToSheet('local', `${USERS_SHEET_NAME}!A:E`, [
      'user_0',
      'Joashy',
      'hash',
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
    ]);
    await client.updateSheet('local', `${USERS_SHEET_NAME}!E2`, [
      '2026-01-02T00:00:00.000Z',
    ]);

    const rows = await client.getSheetValues('local', `${USERS_SHEET_NAME}!A:E`);
    const usernameColumn = await client.getSheetValues('local', `${USERS_SHEET_NAME}!B:B`);
    const rowIndex = await client.findRowByValue('local', USERS_SHEET_NAME, 'A', 'user_0');

    assert.deepEqual(rows[0], USER_HEADERS);
    assert.equal(rows[1][1], 'Joashy');
    assert.equal(rows[1][4], '2026-01-02T00:00:00.000Z');
    assert.deepEqual(usernameColumn, [['username'], ['Joashy']]);
    assert.equal(rowIndex, 2);
  });
});

loggedTest('createLocalSheetsClient - persists rows', LOCATION, async () => {
  await withTempStoragePath(async (storagePath) => {
    const firstClient = createLocalSheetsClient({
      logger: createLogger(),
      storagePath,
    });
    await firstClient.initializeAuth();
    await firstClient.ensureSheet('local', PITCHES_SHEET_NAME, PITCH_HEADERS);
    await firstClient.appendToSheet('local', `${PITCHES_SHEET_NAME}!A:M`, [
      'Joashy',
      'user_0',
      'pitch_joashy_0',
      '2026-01-01T00:00:00.000Z',
      'Pitch transcript.',
      'Improved pitch.',
      90,
      'Good structure.',
      90,
      88,
      89,
      87,
      '0:30',
    ]);

    const secondClient = createLocalSheetsClient({
      logger: createLogger(),
      storagePath,
    });
    const rows = await secondClient.getSheetValues('local', `${PITCHES_SHEET_NAME}!A:M`);

    assert.equal(rows.length, 2);
    assert.equal(rows[1][2], 'pitch_joashy_0');
  });
});

loggedTest('createLocalSheetsClient - corrupted store recovery', LOCATION, async () => {
  await withTempStoragePath(async (storagePath) => {
    const logs = [];
    const client = createLocalSheetsClient({
      logger: {
        logInfo: (...args) => logs.push(args),
      },
      storagePath,
    });

    await writeFile(storagePath, '{bad json', 'utf8');
    await client.initializeAuth();
    await client.ensureSheet('local', USERS_SHEET_NAME, USER_HEADERS);

    const rows = await client.getSheetValues('local', `${USERS_SHEET_NAME}!A:E`);

    assert.deepEqual(rows, [USER_HEADERS]);
    assert.match(logs[0][0], /was malformed; resetting it/);
  });
});

loggedTest('createSheetsClientForMode - local mode selection', FACADE_LOCATION, async () => {
  await withTempStoragePath(async (storagePath) => {
    const client = createSheetsClientForMode({
      env: { STORAGE_MODE: 'local' },
      localStoragePath: storagePath,
      logger: createLogger(),
    });

    await client.initializeAuth();

    assert.equal(client.getSpreadsheetId(), 'local-demo-spreadsheet');
  });
});

loggedTest('isLocalStorageMode - demo mode detection', FACADE_LOCATION, () => {
  assert.equal(isLocalStorageMode({ STORAGE_MODE: 'mock' }), true);
  assert.equal(isLocalStorageMode({ STORAGE_MODE: 'demo' }), true);
  assert.equal(isLocalStorageMode({ STORAGE_MODE: ' LOCAL ' }), true);
  assert.equal(isLocalStorageMode({ STORAGE_MODE: 'google' }), false);
  assert.equal(isLocalStorageMode({ STORAGE_MODE: '' }), false);
  assert.equal(isLocalStorageMode({}), false);
});

loggedTest('getStorageMode - env fallback and normalization', FACADE_LOCATION, () => {
  assert.equal(getStorageMode({ STORAGE_MODE: ' LOCAL ' }), 'local');
  assert.equal(getStorageMode({ STORAGE_MODE: '' }), '');
  assert.equal(getStorageMode({}), '');
});

loggedTest('createStorage - local demo user and pitch flow', FACADE_LOCATION, async () => {
  await withTempStoragePath(async (storagePath) => {
    const storage = createStorage({
      logger: createLogger(),
      now: '2026-01-01T00:00:00.000Z',
      sheetsClient: createLocalSheetsClient({
        logger: createLogger(),
        storagePath,
      }),
    });

    await storage.initializeAuth();
    const createdUser = await storage.createUser({
      passwordHash: 'hash',
      username: 'DemoUser',
    });
    const foundUser = await storage.findUserByUsername('demouser');
    const savedPitch = await storage.savePitch({
      analysis_score: 84,
      duration: '0:30',
      improvedPitch: 'Improved pitch.',
      transcribed_pitch: 'Pitch transcript.',
      user_id: createdUser.user.userId,
      user_name: createdUser.user.username,
    });
    const dashboard = await storage.getDashboardData({
      userId: createdUser.user.userId,
      username: createdUser.user.username,
    });

    assert.equal(createdUser.user.userId, 'user_0');
    assert.equal(foundUser.username, 'DemoUser');
    assert.equal(savedPitch.pitchId, 'pitch_demouser_0');
    assert.equal(dashboard.pitches.length, 1);
    assert.equal(dashboard.pitches[0].pitchId, 'pitch_demouser_0');
  });
});
