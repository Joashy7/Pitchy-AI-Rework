import * as defaultSheetsClient from './googleSheetsClient.js';
import {
  USERS_SHEET_NAME,
  USER_HEADERS,
} from './schema.js';
import {
  isHeaderValue,
  normalizeUsername,
} from './rowFormatters.js';
import { logError } from '../logger.js';

/**
 * Checks whether a row looks like stored user data.
 *
 * Args:
 * @param {unknown[]} row - Raw row from the users sheet.
 *
 * Returns:
 * @returns {boolean} True when the row is not a user header row and has a user ID or username; false otherwise.
 */
export const isUserDataRow = (row) => (
  !isHeaderValue(row[0], 'user_id') &&
  !isHeaderValue(row[1], 'username') &&
  Boolean(String(row[0] || row[1] || '').trim())
);

/**
 * Creates the repository that reads and writes user rows.
 *
 * Args:
 * @param {object} [options] - User repository dependencies.
 * @param {object} [options.sheetsClient] - Sheets-compatible client used for storage.
 * @param {Function|string} [options.now] - Timestamp provider or fixed timestamp for createdAt and lastLoginAt.
 * @param {object} [options.logger] - Logger with logError function.
 *
 * Returns:
 * @returns {object} User repository with createUser, findUserByUsername, and updateUserLastLogin; createUser returns success true with user or success false with "Username already exists" or storage error.
 */
export const createUsersRepository = ({
  sheetsClient = defaultSheetsClient,
  now = () => new Date().toISOString(),
  logger = { logError },
} = {}) => {
  const getTimestamp = typeof now === 'function' ? now : () => now;

  /**
   * Calculates the next user ID.
   *
   * Args:
   * @param {string} spreadsheetId - Spreadsheet ID used to read existing user rows.
   *
   * Returns:
   * @returns {Promise<string>} Next user ID using "user_0", "user_1", and so on.
   */
  const getNextUserId = async (spreadsheetId) => {
    const rows = await sheetsClient.getSheetValues(spreadsheetId, `${USERS_SHEET_NAME}!A:E`);
    const userRows = rows.filter(isUserDataRow);
    const existingNumericIds = userRows
      .map((row) => String(row[0] || '').trim().match(/^user_(\d+)$/i))
      .filter(Boolean)
      .map((match) => Number(match[1]))
      .filter(Number.isFinite);
    const nextNumber = existingNumericIds.length
      ? Math.max(...existingNumericIds) + 1
      : userRows.length;

    return `user_${nextNumber}`;
  };

  /**
   * Finds a stored user by username.
   *
   * Args:
   * @param {unknown} username - Username to normalize and search for.
   *
   * Returns:
   * @returns {Promise<object|null>} User row object with rowIndex, userId, username, passwordHash, createdAt, and lastLoginAt; null for missing or unmatched usernames.
   */
  const findUserByUsername = async (username) => {
    try {
      await sheetsClient.initializeAuth();
      const spreadsheetId = sheetsClient.getSpreadsheetId();
      await sheetsClient.ensureSheet(spreadsheetId, USERS_SHEET_NAME, USER_HEADERS);

      const normalizedUsername = normalizeUsername(username).toLowerCase();
      if (!normalizedUsername) return null;

      const rows = await sheetsClient.getSheetValues(spreadsheetId, `${USERS_SHEET_NAME}!A:E`);
      const userIndex = rows.findIndex((row, index) => {
        if (index === 0 && String(row[1] || '').toLowerCase() === 'username') {
          return false;
        }

        return normalizeUsername(row[1]).toLowerCase() === normalizedUsername;
      });

      if (userIndex === -1) return null;

      const row = rows[userIndex];
      return {
        rowIndex: userIndex + 1,
        userId: String(row[0] || '').trim(),
        username: String(row[1] || '').trim(),
        passwordHash: String(row[2] || '').trim(),
        createdAt: String(row[3] || '').trim(),
        lastLoginAt: String(row[4] || '').trim(),
      };
    } catch (error) {
      logger.logError('Error finding user:', error.message);
      throw error;
    }
  };

  /**
   * Creates a stored user row.
   *
   * Args:
   * @param {object} userInput - User creation input.
   * @param {string} userInput.username - Username to store.
   * @param {string} userInput.passwordHash - Hashed password to store.
   *
   * Returns:
   * @returns {Promise<object>} Result with success true, user, and result; success false with "Username already exists"; or success false with storage error message.
   */
  const createUser = async ({ username, passwordHash }) => {
    try {
      await sheetsClient.initializeAuth();
      const spreadsheetId = sheetsClient.getSpreadsheetId();
      await sheetsClient.ensureSheet(spreadsheetId, USERS_SHEET_NAME, USER_HEADERS);

      const normalizedUsername = normalizeUsername(username);
      const existingUser = await findUserByUsername(normalizedUsername);

      if (existingUser) {
        return {
          success: false,
          error: 'Username already exists',
        };
      }

      const timestamp = getTimestamp();
      const user = {
        userId: await getNextUserId(spreadsheetId),
        username: normalizedUsername,
        passwordHash,
        createdAt: timestamp,
        lastLoginAt: timestamp,
      };
      const row = [
        user.userId,
        user.username,
        user.passwordHash,
        user.createdAt,
        user.lastLoginAt,
      ];
      const result = await sheetsClient.appendToSheet(spreadsheetId, `${USERS_SHEET_NAME}!A:E`, row);

      return {
        success: true,
        user,
        result,
      };
    } catch (error) {
      logger.logError('Error creating user:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  /**
   * Updates a stored user's last login timestamp.
   *
   * Args:
   * @param {string} userId - User ID to update.
   *
   * Returns:
   * @returns {Promise<object>} Result with success true, lastLoginAt, and result; success false with "User with ID <id> not found"; or success false with storage error message.
   */
  const updateUserLastLogin = async (userId) => {
    try {
      await sheetsClient.initializeAuth();
      const spreadsheetId = sheetsClient.getSpreadsheetId();
      await sheetsClient.ensureSheet(spreadsheetId, USERS_SHEET_NAME, USER_HEADERS);

      const rowIndex = await sheetsClient.findRowByValue(
        spreadsheetId,
        USERS_SHEET_NAME,
        'A',
        userId
      );

      if (!rowIndex) {
        return {
          success: false,
          error: `User with ID ${userId} not found`,
        };
      }

      const lastLoginAt = getTimestamp();
      const result = await sheetsClient.updateSheet(
        spreadsheetId,
        `${USERS_SHEET_NAME}!E${rowIndex}`,
        [lastLoginAt]
      );

      return {
        success: true,
        lastLoginAt,
        result,
      };
    } catch (error) {
      logger.logError('Error updating user login:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  return {
    createUser,
    findUserByUsername,
    updateUserLastLogin,
  };
};

const defaultUsersRepository = createUsersRepository();

/**
 * Finds a user by username through the default users repository.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default findUserByUsername function.
 *
 * Returns:
 * @returns {Promise<object|null>} User row object with rowIndex, userId, username, passwordHash, createdAt, and lastLoginAt; null when username is missing or not found.
 */
export const findUserByUsername = (...args) => (
  defaultUsersRepository.findUserByUsername(...args)
);

/**
 * Creates a user through the default users repository.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default createUser function.
 *
 * Returns:
 * @returns {Promise<object>} Result with success true and user ID such as "user_0"; or success false with "Username already exists" or a storage error message.
 */
export const createUser = (...args) => (
  defaultUsersRepository.createUser(...args)
);

/**
 * Updates a user's last login timestamp through the default users repository.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default updateUserLastLogin function.
 *
 * Returns:
 * @returns {Promise<object>} Result with success true, lastLoginAt, and result; or success false with "User with ID <id> not found" or a storage error message.
 */
export const updateUserLastLogin = (...args) => (
  defaultUsersRepository.updateUserLastLogin(...args)
);
