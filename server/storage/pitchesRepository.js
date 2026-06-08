import * as defaultSheetsClient from './googleSheetsClient.js';
import {
  PITCHES_SHEET_NAME,
  PITCH_HEADERS,
} from './schema.js';
import {
  isHeaderValue,
  normalizeIdentifierPart,
  normalizeUsername,
} from './rowFormatters.js';
import { logError } from '../logger.js';

/**
 * Checks whether a row looks like a stored pitch data row.
 *
 * Args:
 * @param {unknown[]} row - Raw row from the pitches sheet.
 *
 * Returns:
 * @returns {boolean} True when the row has a pitch ID or transcript and is not a header row; false for headers or empty rows.
 */
export const isPitchRow = (row) => {
  const pitchId = String(row[2] || '').trim();
  const transcript = String(row[4] || '').trim();

  if (
    isHeaderValue(row[2], 'pitch_id') ||
    isHeaderValue(row[4], 'transcribed_pitch')
  ) {
    return false;
  }

  return Boolean(pitchId || transcript);
};

/**
 * Filters raw sheet rows down to pitch data rows.
 *
 * Args:
 * @param {unknown[][]} rows - Raw rows from the pitches sheet.
 *
 * Returns:
 * @returns {unknown[][]} Rows that pass isPitchRow.
 */
const getPitchDataRows = (rows) => rows.filter(isPitchRow);

/**
 * Builds the pitch ID prefix for a username.
 *
 * Args:
 * @param {unknown} username - Username used to build the pitch prefix.
 *
 * Returns:
 * @returns {string} "pitch_<username_slug>" for signed-in users, or "pitch" for anonymous pitches.
 */
export const buildPitchPrefix = (username) => {
  const usernameSlug = normalizeIdentifierPart(username);
  return usernameSlug ? `pitch_${usernameSlug}` : 'pitch';
};

/**
 * Creates the repository that reads and writes pitch rows.
 *
 * Args:
 * @param {object} [options] - Pitch repository dependencies.
 * @param {object} [options.sheetsClient] - Sheets-compatible client used for storage.
 * @param {Function|string} [options.now] - Timestamp provider or fixed timestamp for saved pitches.
 * @param {object} [options.logger] - Logger with logError function.
 *
 * Returns:
 * @returns {object} Pitch repository with savePitch, getPitchRows, and isPitchRow; savePitch returns success true with pitchId/timestamp/result or success false with error.
 */
export const createPitchesRepository = ({
  sheetsClient = defaultSheetsClient,
  now = () => new Date().toISOString(),
  logger = { logError },
} = {}) => {
  const getTimestamp = typeof now === 'function' ? now : () => now;

  /**
   * Calculates the next pitch ID for a user or anonymous pitch.
   *
   * Args:
   * @param {string} spreadsheetId - Spreadsheet ID used to read existing pitch rows.
   * @param {unknown} username - Username used to scope pitch ID sequencing.
   *
   * Returns:
   * @returns {Promise<string>} Next pitch ID using "pitch_username_0" style for users or "pitch_0" style for anonymous pitches.
   */
  const getNextPitchId = async (spreadsheetId, username) => {
    const rows = await sheetsClient.getSheetValues(spreadsheetId, `${PITCHES_SHEET_NAME}!A:M`);
    const pitchRows = getPitchDataRows(rows);
    const normalizedUsername = normalizeUsername(username).toLowerCase();
    const pitchPrefix = buildPitchPrefix(username);
    const userPitchRows = pitchRows.filter((row) => (
      normalizedUsername
        ? normalizeUsername(row[0]).toLowerCase() === normalizedUsername
        : !normalizeUsername(row[0])
    ));
    const matchingNumericIds = userPitchRows
      .map((row) => String(row[2] || '').trim().match(new RegExp(`^${pitchPrefix}_(\\d+)$`, 'i')))
      .filter(Boolean)
      .map((match) => Number(match[1]))
      .filter(Number.isFinite);
    const nextNumber = matchingNumericIds.length
      ? Math.max(...matchingNumericIds) + 1
      : userPitchRows.length;

    return `${pitchPrefix}_${nextNumber}`;
  };

  /**
   * Saves a pitch row.
   *
   * Args:
   * @param {object} pitchData - Pitch fields to store.
   *
   * Returns:
   * @returns {Promise<object>} Result with success true, pitchId, timestamp, and result; or success false with error when auth, sheet setup, ID generation, or append fails.
   */
  const savePitch = async (pitchData) => {
    try {
      await sheetsClient.initializeAuth();
      const spreadsheetId = sheetsClient.getSpreadsheetId();
      await sheetsClient.ensureSheet(spreadsheetId, PITCHES_SHEET_NAME, PITCH_HEADERS);

      const {
        user_name = '',
        user_id = '',
        transcribed_pitch = '',
        analysis_score = 0,
        improvement_suggestion_text = '',
        clarity_score = 0,
        persuasiveness_score = 0,
        confidence_score = 0,
        narrative_flow_score = 0,
        duration = '',
      } = pitchData;
      const improvedPitch =
        pitchData.improved_pitch ??
        pitchData.improvedPitch ??
        '';
      const userName = user_name || pitchData.username || '';
      const userId = user_id || pitchData.userId || '';
      const timestamp = getTimestamp();
      const pitchId = await getNextPitchId(spreadsheetId, userName);
      const row = [
        userName,
        userId,
        pitchId,
        timestamp,
        transcribed_pitch,
        improvedPitch,
        analysis_score,
        improvement_suggestion_text,
        clarity_score,
        persuasiveness_score,
        confidence_score,
        narrative_flow_score,
        duration,
      ];
      const result = await sheetsClient.appendToSheet(
        spreadsheetId,
        `${PITCHES_SHEET_NAME}!A:M`,
        row
      );

      return {
        success: true,
        pitchId,
        timestamp,
        result,
      };
    } catch (error) {
      logger.logError('Error saving pitch:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  /**
   * Reads all raw pitch rows.
   *
   * Args:
   * None.
   *
   * Returns:
   * @returns {Promise<unknown[][]>} Raw rows from the pitch sheet after auth and sheet/header initialization.
   */
  const getPitchRows = async () => {
    await sheetsClient.initializeAuth();
    const spreadsheetId = sheetsClient.getSpreadsheetId();
    await sheetsClient.ensureSheet(spreadsheetId, PITCHES_SHEET_NAME, PITCH_HEADERS);

    return sheetsClient.getSheetValues(spreadsheetId, `${PITCHES_SHEET_NAME}!A:M`);
  };

  return {
    getPitchRows,
    isPitchRow,
    savePitch,
  };
};

const defaultPitchesRepository = createPitchesRepository();

/**
 * Saves a pitch through the default pitches repository.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default savePitch function.
 *
 * Returns:
 * @returns {Promise<object>} Save result with success true, pitchId such as "pitch_username_0" or "pitch_0", timestamp, and result; or success false with error.
 */
export const savePitch = (...args) => (
  defaultPitchesRepository.savePitch(...args)
);

/**
 * Reads pitch rows through the default pitches repository.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default getPitchRows function.
 *
 * Returns:
 * @returns {Promise<unknown[][]>} Raw pitch sheet rows after auth and sheet/header initialization.
 */
export const getPitchRows = (...args) => (
  defaultPitchesRepository.getPitchRows(...args)
);
