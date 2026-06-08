import { google } from 'googleapis';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

import { logError, logInfo } from '../logger.js';

dotenv.config({ quiet: true });

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SERVICE_ACCOUNT_PATH = resolve(__dirname, '../../service_account.json');
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

/**
 * Converts a one-based spreadsheet column index into a column name.
 *
 * Args:
 * @param {number} index - One-based spreadsheet column index.
 *
 * Returns:
 * @returns {string} Spreadsheet column name such as "A", "Z", or "AA"; returns "" for non-positive indexes.
 */
export const getColumnName = (index) => {
  let number = index;
  let name = '';

  while (number > 0) {
    const remainder = (number - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    number = Math.floor((number - 1) / 26);
  }

  return name;
};

/**
 * Creates a Google Sheets API client wrapper.
 *
 * Args:
 * @param {object} [options] - Google Sheets client dependencies and settings.
 * @param {object} [options.googleApi] - Google API module or compatible mock.
 * @param {object} [options.env] - Environment-like object containing GOOGLE_SHEETS_SPREADSHEET_ID.
 * @param {Function} [options.readFile] - File reader used to load service_account.json.
 * @param {string} [options.serviceAccountPath] - Path to Google service account JSON.
 * @param {object|null} [options.initialAuthClient] - Optional preinitialized auth client.
 * @param {object|null} [options.initialSheetsApi] - Optional preinitialized Sheets API client.
 * @param {object} [options.logger] - Logger with logError and logInfo functions.
 *
 * Returns:
 * @returns {object} Sheets client with initializeAuth, getSheetsApi, getSpreadsheetId, appendToSheet, updateSheet, getSheetValues, ensureSheet, and findRowByValue.
 */
export const createGoogleSheetsClient = ({
  googleApi = google,
  env = process.env,
  readFile = readFileSync,
  serviceAccountPath = env.GOOGLE_SERVICE_ACCOUNT_PATH || DEFAULT_SERVICE_ACCOUNT_PATH,
  initialAuthClient = null,
  initialSheetsApi = null,
  logger = {
    logError,
    logInfo,
  },
} = {}) => {
  let authClient = initialAuthClient;
  let sheetsApi = initialSheetsApi;

  /**
   * Initializes and caches Google Sheets authentication.
   *
   * Args:
   * None.
   *
   * Returns:
   * @returns {Promise<object|null>} Google auth client when initialized; returns cached auth client when already available; rejects when service account loading or auth setup fails.
   */
  const initializeAuth = async () => {
    if (authClient || sheetsApi) return authClient;

    try {
      const keyFile = JSON.parse(readFile(serviceAccountPath, 'utf8'));

      authClient = new googleApi.auth.GoogleAuth({
        credentials: keyFile,
        scopes: [SHEETS_SCOPE],
      });

      sheetsApi = googleApi.sheets({
        version: 'v4',
        auth: authClient,
      });

      logger.logInfo('Google Sheets API initialized with service account');
      return authClient;
    } catch (error) {
      logger.logError('Failed to initialize Google Sheets auth:', error.message);
      throw error;
    }
  };

  /**
   * Returns the cached Sheets API client, initializing auth if needed.
   *
   * Args:
   * None.
   *
   * Returns:
   * @returns {Promise<object>} Google Sheets API client.
   */
  const getSheetsApi = async () => {
    if (!sheetsApi) {
      await initializeAuth();
    }

    return sheetsApi;
  };

  /**
   * Reads the configured Google spreadsheet ID.
   *
   * Args:
   * None.
   *
   * Returns:
   * @returns {string} GOOGLE_SHEETS_SPREADSHEET_ID value; throws when the environment variable is missing.
   */
  const getSpreadsheetId = () => {
    const spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID;
    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID environment variable is not set');
    }
    return spreadsheetId;
  };

  /**
   * Appends one row to a sheet range.
   *
   * Args:
   * @param {string} spreadsheetId - Google Sheets spreadsheet ID.
   * @param {string} range - A1-style sheet range to append into.
   * @param {unknown[]} values - Row values to append.
   *
   * Returns:
   * @returns {Promise<object>} Google Sheets append response data; rejects when the append request fails.
   */
  const appendToSheet = async (spreadsheetId, range, values) => {
    try {
      const api = await getSheetsApi();
      const response = await api.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'RAW',
        resource: {
          values: [values],
        },
      });

      logger.logInfo(`Appended row to ${range}`);
      return response.data;
    } catch (error) {
      logger.logError('Error appending to Google Sheets:', error.message);
      throw error;
    }
  };

  /**
   * Updates one row or range in a sheet.
   *
   * Args:
   * @param {string} spreadsheetId - Google Sheets spreadsheet ID.
   * @param {string} range - A1-style sheet range to update.
   * @param {unknown[]} values - Row values to write.
   *
   * Returns:
   * @returns {Promise<object>} Google Sheets update response data; rejects when the update request fails.
   */
  const updateSheet = async (spreadsheetId, range, values) => {
    try {
      const api = await getSheetsApi();
      const response = await api.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'RAW',
        resource: {
          values: [values],
        },
      });

      logger.logInfo(`Updated row at ${range}`);
      return response.data;
    } catch (error) {
      logger.logError('Error updating Google Sheets:', error.message);
      throw error;
    }
  };

  /**
   * Reads values from a sheet range.
   *
   * Args:
   * @param {string} spreadsheetId - Google Sheets spreadsheet ID.
   * @param {string} range - A1-style sheet range to read.
   *
   * Returns:
   * @returns {Promise<unknown[][]>} Sheet values from the range; returns [] when the range has no values; rejects when the read request fails.
   */
  const getSheetValues = async (spreadsheetId, range) => {
    try {
      const api = await getSheetsApi();
      const response = await api.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      return response.data.values || [];
    } catch (error) {
      logger.logError('Error reading from Google Sheets:', error.message);
      throw error;
    }
  };

  /**
   * Ensures a sheet tab and header row exist.
   *
   * Args:
   * @param {string} spreadsheetId - Google Sheets spreadsheet ID.
   * @param {string} sheetName - Sheet tab name to ensure.
   * @param {string[]} headers - Header row values to create when missing.
   *
   * Returns:
   * @returns {Promise<void>} Resolves after the sheet and header row exist; rejects when Sheets API operations fail.
   */
  const ensureSheet = async (spreadsheetId, sheetName, headers) => {
    const api = await getSheetsApi();
    const spreadsheet = await api.spreadsheets.get({ spreadsheetId });
    const sheetExists = spreadsheet.data.sheets?.some(
      (sheet) => sheet.properties?.title === sheetName
    );

    if (!sheetExists) {
      await api.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                },
              },
            },
          ],
        },
      });
    }

    const lastColumn = getColumnName(headers.length);
    const rows = await getSheetValues(spreadsheetId, `${sheetName}!A1:${lastColumn}1`);

    if (!rows.length) {
      await updateSheet(spreadsheetId, `${sheetName}!A1:${lastColumn}1`, headers);
    }
  };

  /**
   * Finds the one-based row index of a value in a sheet column.
   *
   * Args:
   * @param {string} spreadsheetId - Google Sheets spreadsheet ID.
   * @param {string} sheetName - Sheet tab name to search.
   * @param {string} column - Spreadsheet column name to search, such as "A".
   * @param {string} value - Cell value to match exactly.
   *
   * Returns:
   * @returns {Promise<number|null>} One-based row index when found; null when no matching value exists; rejects when the read request fails.
   */
  const findRowByValue = async (spreadsheetId, sheetName, column, value) => {
    try {
      const api = await getSheetsApi();
      const response = await api.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!${column}:${column}`,
      });

      const values = response.data.values || [];
      for (let i = 0; i < values.length; i += 1) {
        if (values[i][0] === value) {
          return i + 1;
        }
      }
      return null;
    } catch (error) {
      logger.logError('Error finding row:', error.message);
      throw error;
    }
  };

  return {
    appendToSheet,
    ensureSheet,
    findRowByValue,
    getSheetValues,
    getSheetsApi,
    getSpreadsheetId,
    initializeAuth,
    updateSheet,
  };
};

const defaultGoogleSheetsClient = createGoogleSheetsClient();

/**
 * Initializes auth through the default Google Sheets client.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default initializeAuth function.
 *
 * Returns:
 * @returns {Promise<object|null>} Google auth client or cached auth result; rejects when auth initialization fails.
 */
export const initializeAuth = (...args) => (
  defaultGoogleSheetsClient.initializeAuth(...args)
);

/**
 * Gets the Sheets API through the default Google Sheets client.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default getSheetsApi function.
 *
 * Returns:
 * @returns {Promise<object>} Google Sheets API client.
 */
export const getSheetsApi = (...args) => (
  defaultGoogleSheetsClient.getSheetsApi(...args)
);

/**
 * Gets the spreadsheet ID through the default Google Sheets client.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default getSpreadsheetId function.
 *
 * Returns:
 * @returns {string} Configured spreadsheet ID; throws when GOOGLE_SHEETS_SPREADSHEET_ID is missing.
 */
export const getSpreadsheetId = (...args) => (
  defaultGoogleSheetsClient.getSpreadsheetId(...args)
);

/**
 * Appends a row through the default Google Sheets client.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default appendToSheet function.
 *
 * Returns:
 * @returns {Promise<object>} Google Sheets append response data.
 */
export const appendToSheet = (...args) => (
  defaultGoogleSheetsClient.appendToSheet(...args)
);

/**
 * Updates a sheet range through the default Google Sheets client.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default updateSheet function.
 *
 * Returns:
 * @returns {Promise<object>} Google Sheets update response data.
 */
export const updateSheet = (...args) => (
  defaultGoogleSheetsClient.updateSheet(...args)
);

/**
 * Reads sheet values through the default Google Sheets client.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default getSheetValues function.
 *
 * Returns:
 * @returns {Promise<unknown[][]>} Sheet values, or [] when none exist.
 */
export const getSheetValues = (...args) => (
  defaultGoogleSheetsClient.getSheetValues(...args)
);

/**
 * Ensures a sheet and header row through the default Google Sheets client.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default ensureSheet function.
 *
 * Returns:
 * @returns {Promise<void>} Resolves after the sheet and header row exist.
 */
export const ensureSheet = (...args) => (
  defaultGoogleSheetsClient.ensureSheet(...args)
);

/**
 * Finds a row by value through the default Google Sheets client.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default findRowByValue function.
 *
 * Returns:
 * @returns {Promise<number|null>} One-based row index when found; null when no match exists.
 */
export const findRowByValue = (...args) => (
  defaultGoogleSheetsClient.findRowByValue(...args)
);
