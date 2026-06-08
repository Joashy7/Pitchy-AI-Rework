import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { logInfo } from '../logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_LOCAL_STORAGE_PATH = resolve(
  __dirname,
  '../../.local/pitchy-storage.json'
);
const LOCAL_SPREADSHEET_ID = 'local-demo-spreadsheet';

/**
 * Creates an empty local storage document.
 *
 * Args:
 * None.
 *
 * Returns:
 * @returns {{sheets: object}} Empty local store with a sheets object.
 */
const createEmptyStore = () => ({
  sheets: {},
});

/**
 * Extracts a sheet name from an A1-style range.
 *
 * Args:
 * @param {string} range - A1-style range such as "Users!A:E".
 *
 * Returns:
 * @returns {string} Sheet name before "!", or the full range string when "!" is absent.
 */
const getSheetName = (range) => String(range || '').split('!')[0];

/**
 * Extracts the range portion after the sheet name.
 *
 * Args:
 * @param {string} range - A1-style range such as "Users!A:E".
 *
 * Returns:
 * @returns {string} Range portion after "!", or "" when no range portion exists.
 */
const getRangePart = (range) => String(range || '').split('!')[1] || '';

/**
 * Converts a spreadsheet column name to a zero-based column index.
 *
 * Args:
 * @param {string} columnName - Spreadsheet column name such as "A" or "AA".
 *
 * Returns:
 * @returns {number} Zero-based column index; returns -1 for missing or empty column names.
 */
const getColumnIndex = (columnName) => {
  const normalized = String(columnName || '').toUpperCase();

  return [...normalized].reduce(
    (index, character) => index * 26 + character.charCodeAt(0) - 64,
    0
  ) - 1;
};

/**
 * Parses an A1-style range into row and column indexes.
 *
 * Args:
 * @param {string} range - A1-style range such as "Users!A:E" or "Users!E2".
 *
 * Returns:
 * @returns {object} Parsed range with startColumnIndex, endColumnIndex, startRowIndex, and endRowIndex; invalid ranges default to column 0, row 0, and open-ended rows.
 */
const parseRange = (range) => {
  const rangePart = getRangePart(range);
  const match = rangePart.match(/^([A-Z]+)(\d+)?(?::([A-Z]+)?(\d+)?)?$/i);

  if (!match) {
    return {
      endColumnIndex: null,
      endRowIndex: null,
      startColumnIndex: 0,
      startRowIndex: 0,
    };
  }

  const [, startColumn, startRow, endColumn, endRow] = match;
  const startColumnIndex = getColumnIndex(startColumn);
  const endColumnIndex = endColumn ? getColumnIndex(endColumn) : startColumnIndex;
  const startRowIndex = startRow ? Number(startRow) - 1 : 0;
  const endRowIndex = endRow ? Number(endRow) - 1 : null;

  return {
    endColumnIndex,
    endRowIndex,
    startColumnIndex,
    startRowIndex,
  };
};

/**
 * Slices local rows according to an A1-style range.
 *
 * Args:
 * @param {unknown[][]} rows - Local sheet rows to slice.
 * @param {string} range - A1-style range used to select rows and columns.
 *
 * Returns:
 * @returns {unknown[][]} Selected rows and columns; returns [] when the requested row range is empty.
 */
const getRowsForRange = (rows, range) => {
  const {
    endColumnIndex,
    endRowIndex,
    startColumnIndex,
    startRowIndex,
  } = parseRange(range);
  const rowEnd = endRowIndex === null ? rows.length - 1 : endRowIndex;

  if (rowEnd < startRowIndex) return [];

  return rows
    .slice(startRowIndex, rowEnd + 1)
    .map((row) => row.slice(startColumnIndex, endColumnIndex + 1));
};

/**
 * Ensures a row exists in a local sheet array.
 *
 * Args:
 * @param {unknown[][]} rows - Mutable sheet rows array.
 * @param {number} rowIndex - Zero-based row index that must exist.
 *
 * Returns:
 * @returns {unknown[]} Existing or newly created row at rowIndex.
 */
const ensureRow = (rows, rowIndex) => {
  while (rows.length <= rowIndex) {
    rows.push([]);
  }

  return rows[rowIndex];
};

/**
 * Creates a local JSON-backed Sheets-compatible client for demos.
 *
 * Args:
 * @param {object} [options] - Local client options.
 * @param {object} [options.logger] - Logger with logInfo function.
 * @param {string} [options.storagePath] - Path to the local JSON storage file.
 *
 * Returns:
 * @returns {object} Sheets-compatible local client with initializeAuth, getSpreadsheetId, ensureSheet, getSheetValues, appendToSheet, updateSheet, and findRowByValue.
 */
export const createLocalSheetsClient = ({
  logger = { logInfo },
  storagePath = DEFAULT_LOCAL_STORAGE_PATH,
} = {}) => {
  let store = null;
  let writeQueue = Promise.resolve();

  /**
   * Loads the local store from disk or creates an empty store.
   *
   * Args:
   * None.
   *
   * Returns:
   * @returns {Promise<object>} Local store object with a sheets property; rejects for non-missing file read or JSON parse errors.
   */
  const loadStore = async () => {
    if (store) return store;

    try {
      store = JSON.parse(await readFile(storagePath, 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      store = createEmptyStore();
    }

    store.sheets ||= {};
    return store;
  };

  /**
   * Persists the local store to disk in write order.
   *
   * Args:
   * None.
   *
   * Returns:
   * @returns {Promise<void>} Resolves after the store is written to storagePath.
   */
  const saveStore = async () => {
    writeQueue = writeQueue.then(async () => {
      await mkdir(dirname(storagePath), { recursive: true });
      await writeFile(storagePath, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
    });

    return writeQueue;
  };

  /**
   * Gets mutable rows for a local sheet, creating the sheet when missing.
   *
   * Args:
   * @param {string} sheetName - Local sheet name.
   *
   * Returns:
   * @returns {Promise<unknown[][]>} Mutable row array for the requested sheet.
   */
  const getSheetRows = async (sheetName) => {
    const currentStore = await loadStore();
    currentStore.sheets[sheetName] ||= [];
    return currentStore.sheets[sheetName];
  };

  /**
   * Initializes local demo storage.
   *
   * Args:
   * None.
   *
   * Returns:
   * @returns {Promise<{mode: string, storagePath: string}>} Local initialization result with mode "local" and the storage path.
   */
  const initializeAuth = async () => {
    await loadStore();
    await saveStore();
    logger.logInfo(`Local demo storage initialized at ${storagePath}`);
    return { mode: 'local', storagePath };
  };

  /**
   * Returns the fixed local demo spreadsheet ID.
   *
   * Args:
   * None.
   *
   * Returns:
   * @returns {string} "local-demo-spreadsheet".
   */
  const getSpreadsheetId = () => LOCAL_SPREADSHEET_ID;

  /**
   * Ensures a local sheet and header row exist.
   *
   * Args:
   * @param {string} spreadsheetId - Ignored local spreadsheet ID kept for Sheets compatibility.
   * @param {string} sheetName - Local sheet name to ensure.
   * @param {string[]} headers - Header row values to create when the sheet is empty.
   *
   * Returns:
   * @returns {Promise<void>} Resolves after the sheet and headers exist.
   */
  const ensureSheet = async (spreadsheetId, sheetName, headers) => {
    const rows = await getSheetRows(sheetName);

    if (!rows.length) {
      rows.push(headers);
      await saveStore();
    }
  };

  /**
   * Reads values from local storage using an A1-style range.
   *
   * Args:
   * @param {string} spreadsheetId - Ignored local spreadsheet ID kept for Sheets compatibility.
   * @param {string} range - Sheet name or A1-style range to read.
   *
   * Returns:
   * @returns {Promise<unknown[][]>} Local sheet values for the requested range; returns the whole sheet when no "!" exists.
   */
  const getSheetValues = async (spreadsheetId, range) => {
    const sheetName = getSheetName(range);
    const rows = await getSheetRows(sheetName);

    if (!range.includes('!')) return rows;

    return getRowsForRange(rows, range);
  };

  /**
   * Appends a row to local storage.
   *
   * Args:
   * @param {string} spreadsheetId - Ignored local spreadsheet ID kept for Sheets compatibility.
   * @param {string} range - A1-style sheet range used to identify the sheet.
   * @param {unknown[]} values - Row values to append.
   *
   * Returns:
   * @returns {Promise<{local: boolean, updatedRows: number}>} Local append result with local true and updatedRows 1.
   */
  const appendToSheet = async (spreadsheetId, range, values) => {
    const rows = await getSheetRows(getSheetName(range));
    rows.push(values);
    await saveStore();

    return {
      local: true,
      updatedRows: 1,
    };
  };

  /**
   * Updates a local row/range.
   *
   * Args:
   * @param {string} spreadsheetId - Ignored local spreadsheet ID kept for Sheets compatibility.
   * @param {string} range - A1-style target range such as "Users!E2".
   * @param {unknown[]} values - Values to write starting at the parsed range start.
   *
   * Returns:
   * @returns {Promise<{local: boolean, updatedRows: number}>} Local update result with local true and updatedRows 1.
   */
  const updateSheet = async (spreadsheetId, range, values) => {
    const rows = await getSheetRows(getSheetName(range));
    const {
      startColumnIndex,
      startRowIndex,
    } = parseRange(range);
    const row = ensureRow(rows, startRowIndex);

    values.forEach((value, offset) => {
      row[startColumnIndex + offset] = value;
    });

    await saveStore();

    return {
      local: true,
      updatedRows: 1,
    };
  };

  /**
   * Finds the one-based row index of a value in a local sheet column.
   *
   * Args:
   * @param {string} spreadsheetId - Ignored local spreadsheet ID kept for Sheets compatibility.
   * @param {string} sheetName - Local sheet name to search.
   * @param {string} column - Column name to search, such as "A".
   * @param {string} value - Cell value to match exactly.
   *
   * Returns:
   * @returns {Promise<number|null>} One-based row index when found; null when no matching value exists.
   */
  const findRowByValue = async (spreadsheetId, sheetName, column, value) => {
    const rows = await getSheetRows(sheetName);
    const columnIndex = getColumnIndex(column);
    const rowIndex = rows.findIndex((row) => row[columnIndex] === value);

    return rowIndex === -1 ? null : rowIndex + 1;
  };

  return {
    appendToSheet,
    ensureSheet,
    findRowByValue,
    getSheetValues,
    getSpreadsheetId,
    initializeAuth,
    updateSheet,
  };
};
