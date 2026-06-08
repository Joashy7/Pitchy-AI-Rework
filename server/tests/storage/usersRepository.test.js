import assert from 'node:assert/strict';

import {
  createUsersRepository,
  isUserDataRow,
} from '../../storage/usersRepository.js';
import { loggedTest } from '../helpers/loggedTest.js';

const LOCATION = 'server/storage/usersRepository.js';

const createLogger = () => ({
  logError() {},
});

loggedTest('isUserDataRow - data row detection', LOCATION, () => {
  assert.equal(isUserDataRow(['user_id', 'username']), false);
  assert.equal(isUserDataRow(['user_0', 'Joashy']), true);
  assert.equal(isUserDataRow(['', '']), false);
});

loggedTest('createUsersRepository.findUserByUsername - case insensitive', LOCATION, async () => {
  const repository = createUsersRepository({
    logger: createLogger(),
    sheetsClient: {
      initializeAuth: async () => {},
      getSpreadsheetId: () => 'sheet_123',
      ensureSheet: async () => {},
      getSheetValues: async () => [
        ['user_id', 'username', 'password_hash', 'created_at', 'last_login_at'],
        ['user_0', 'Joashy', 'hash', 'created', 'login'],
      ],
    },
  });

  const user = await repository.findUserByUsername('joashy');

  assert.equal(user.userId, 'user_0');
  assert.equal(user.username, 'Joashy');
  assert.equal(user.passwordHash, 'hash');
  assert.equal(user.rowIndex, 2);
});

loggedTest('createUsersRepository.createUser - next user id', LOCATION, async () => {
  let appendedRow;
  const repository = createUsersRepository({
    now: '2026-01-01T00:00:00.000Z',
    logger: createLogger(),
    sheetsClient: {
      initializeAuth: async () => {},
      getSpreadsheetId: () => 'sheet_123',
      ensureSheet: async () => {},
      getSheetValues: async () => [
        ['user_id', 'username', 'password_hash', 'created_at', 'last_login_at'],
        ['user_0', 'Existing', 'hash', 'created', 'login'],
      ],
      appendToSheet: async (spreadsheetId, range, row) => {
        appendedRow = row;
        return { spreadsheetId, range };
      },
    },
  });

  const result = await repository.createUser({
    username: 'NewUser',
    passwordHash: 'hash_new',
  });

  assert.equal(result.success, true);
  assert.equal(result.user.userId, 'user_1');
  assert.deepEqual(appendedRow, [
    'user_1',
    'NewUser',
    'hash_new',
    '2026-01-01T00:00:00.000Z',
    '2026-01-01T00:00:00.000Z',
  ]);
});

loggedTest('createUsersRepository.createUser - duplicate username', LOCATION, async () => {
  const repository = createUsersRepository({
    logger: createLogger(),
    sheetsClient: {
      initializeAuth: async () => {},
      getSpreadsheetId: () => 'sheet_123',
      ensureSheet: async () => {},
      getSheetValues: async () => [
        ['user_id', 'username', 'password_hash', 'created_at', 'last_login_at'],
        ['user_0', 'Joashy', 'hash', 'created', 'login'],
      ],
      appendToSheet: async () => {
        throw new Error('Should not append duplicate user');
      },
    },
  });

  const result = await repository.createUser({
    username: 'joashy',
    passwordHash: 'hash',
  });

  assert.equal(result.success, false);
  assert.equal(result.error, 'Username already exists');
});

loggedTest('createUsersRepository.createUser - append failure', LOCATION, async () => {
  const repository = createUsersRepository({
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

  const result = await repository.createUser({
    username: 'Joashy',
    passwordHash: 'hash',
  });

  assert.equal(result.success, false);
  assert.equal(result.error, 'Append failed');
});

loggedTest('createUsersRepository.findUserByUsername - Sheets failure', LOCATION, async () => {
  const repository = createUsersRepository({
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
    () => repository.findUserByUsername('Joashy'),
    /Sheets read failed/
  );
});

loggedTest('createUsersRepository.updateUserLastLogin - success', LOCATION, async () => {
  let updated;
  const repository = createUsersRepository({
    now: '2026-01-01T00:00:00.000Z',
    logger: createLogger(),
    sheetsClient: {
      initializeAuth: async () => {},
      getSpreadsheetId: () => 'sheet_123',
      ensureSheet: async () => {},
      findRowByValue: async () => 3,
      updateSheet: async (spreadsheetId, range, values) => {
        updated = { spreadsheetId, range, values };
        return { updatedRows: 1 };
      },
    },
  });

  const result = await repository.updateUserLastLogin('user_1');

  assert.equal(result.success, true);
  assert.equal(result.lastLoginAt, '2026-01-01T00:00:00.000Z');
  assert.deepEqual(updated, {
    spreadsheetId: 'sheet_123',
    range: 'Users!E3',
    values: ['2026-01-01T00:00:00.000Z'],
  });
});

loggedTest('createUsersRepository.updateUserLastLogin - missing user', LOCATION, async () => {
  const repository = createUsersRepository({
    logger: createLogger(),
    sheetsClient: {
      initializeAuth: async () => {},
      getSpreadsheetId: () => 'sheet_123',
      ensureSheet: async () => {},
      findRowByValue: async () => null,
      updateSheet: async () => {
        throw new Error('Should not update missing user');
      },
    },
  });

  const result = await repository.updateUserLastLogin('user_404');

  assert.equal(result.success, false);
  assert.equal(result.error, 'User with ID user_404 not found');
});

loggedTest('createUsersRepository.updateUserLastLogin - update failure', LOCATION, async () => {
  const repository = createUsersRepository({
    logger: createLogger(),
    sheetsClient: {
      initializeAuth: async () => {},
      getSpreadsheetId: () => 'sheet_123',
      ensureSheet: async () => {},
      findRowByValue: async () => 2,
      updateSheet: async () => {
        throw new Error('Update failed');
      },
    },
  });

  const result = await repository.updateUserLastLogin('user_0');

  assert.equal(result.success, false);
  assert.equal(result.error, 'Update failed');
});
