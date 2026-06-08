import assert from 'node:assert/strict';

import {
  buildPitchPrefix,
  createPitchesRepository,
  isPitchRow,
} from '../../storage/pitchesRepository.js';
import { loggedTest } from '../helpers/loggedTest.js';

const LOCATION = 'server/storage/pitchesRepository.js';

const createLogger = () => ({
  logError() {},
});

loggedTest('isPitchRow - data row detection', LOCATION, () => {
  assert.equal(isPitchRow(['user', 'id', 'pitch_id', '', 'transcribed_pitch']), false);
  assert.equal(isPitchRow(['Joashy', 'user_0', 'pitch_joashy_0', '', 'Transcript']), true);
  assert.equal(isPitchRow(['', '', '', '', '']), false);
});

loggedTest('buildPitchPrefix - username prefixes', LOCATION, () => {
  assert.equal(buildPitchPrefix('Joashy'), 'pitch_joashy');
  assert.equal(buildPitchPrefix('Joashy Gem Marcos'), 'pitch_joashy_gem_marcos');
  assert.equal(buildPitchPrefix(''), 'pitch');
});

loggedTest('createPitchesRepository.savePitch - user sequence', LOCATION, async () => {
  let appended;
  const repository = createPitchesRepository({
    now: '2026-01-01T00:00:00.000Z',
    logger: createLogger(),
    sheetsClient: {
      initializeAuth: async () => {},
      getSpreadsheetId: () => 'sheet_123',
      ensureSheet: async () => {},
      getSheetValues: async () => [
        ['user_name', 'user_id', 'pitch_id', 'created_at', 'transcribed_pitch'],
        ['Joashy', 'user_0', 'pitch_joashy_0', '', 'First pitch'],
        ['Other', 'user_1', 'pitch_other_0', '', 'Other pitch'],
      ],
      appendToSheet: async (spreadsheetId, range, row) => {
        appended = { spreadsheetId, range, row };
        return { updatedRows: 1 };
      },
    },
  });

  const result = await repository.savePitch({
    user_name: 'Joashy',
    user_id: 'user_0',
    transcribed_pitch: 'Second pitch',
    improvedPitch: 'Improved second pitch',
    analysis_score: 82,
    duration: '0:45',
  });

  assert.equal(result.success, true);
  assert.equal(result.pitchId, 'pitch_joashy_1');
  assert.equal(result.timestamp, '2026-01-01T00:00:00.000Z');
  assert.equal(appended.spreadsheetId, 'sheet_123');
  assert.equal(appended.range, 'Sheet1!A:M');
  assert.deepEqual(appended.row.slice(0, 6), [
    'Joashy',
    'user_0',
    'pitch_joashy_1',
    '2026-01-01T00:00:00.000Z',
    'Second pitch',
    'Improved second pitch',
  ]);
});

loggedTest('createPitchesRepository.savePitch - user sequence gaps', LOCATION, async () => {
  const repository = createPitchesRepository({
    now: '2026-01-01T00:00:00.000Z',
    logger: createLogger(),
    sheetsClient: {
      initializeAuth: async () => {},
      getSpreadsheetId: () => 'sheet_123',
      ensureSheet: async () => {},
      getSheetValues: async () => [
        ['Joashy', 'user_0', 'pitch_joashy_0', '', 'First pitch'],
        ['joashy', 'user_0', 'pitch_joashy_3', '', 'Fourth pitch'],
        ['Joashy', 'user_0', 'not_numeric', '', 'Legacy pitch'],
      ],
      appendToSheet: async () => ({ updatedRows: 1 }),
    },
  });

  const result = await repository.savePitch({
    user_name: 'JOASHY',
    user_id: 'user_0',
    transcribed_pitch: 'Next pitch',
  });

  assert.equal(result.success, true);
  assert.equal(result.pitchId, 'pitch_joashy_4');
});

loggedTest('createPitchesRepository.savePitch - anonymous sequence', LOCATION, async () => {
  const repository = createPitchesRepository({
    now: '2026-01-01T00:00:00.000Z',
    logger: createLogger(),
    sheetsClient: {
      initializeAuth: async () => {},
      getSpreadsheetId: () => 'sheet_123',
      ensureSheet: async () => {},
      getSheetValues: async () => [
        ['', '', 'pitch_0', '', 'Anonymous pitch'],
        ['Joashy', 'user_0', 'pitch_joashy_0', '', 'User pitch'],
      ],
      appendToSheet: async () => ({ updatedRows: 1 }),
    },
  });

  const result = await repository.savePitch({
    transcribed_pitch: 'Second anonymous pitch',
  });

  assert.equal(result.success, true);
  assert.equal(result.pitchId, 'pitch_1');
});

loggedTest('createPitchesRepository.savePitch - append failure', LOCATION, async () => {
  const repository = createPitchesRepository({
    logger: createLogger(),
    sheetsClient: {
      initializeAuth: async () => {},
      getSpreadsheetId: () => 'sheet_123',
      ensureSheet: async () => {},
      getSheetValues: async () => [],
      appendToSheet: async () => {
        throw new Error('Append failed');
      },
    },
  });

  const result = await repository.savePitch({
    transcribed_pitch: 'Pitch transcript.',
  });

  assert.equal(result.success, false);
  assert.equal(result.error, 'Append failed');
});

loggedTest('createPitchesRepository.getPitchRows - Sheets failure', LOCATION, async () => {
  const repository = createPitchesRepository({
    logger: createLogger(),
    sheetsClient: {
      initializeAuth: async () => {},
      getSpreadsheetId: () => 'sheet_123',
      ensureSheet: async () => {},
      getSheetValues: async () => {
        throw new Error('Sheets read failed');
      },
    },
  });

  await assert.rejects(
    () => repository.getPitchRows(),
    /Sheets read failed/
  );
});
