import dotenv from 'dotenv';

import {
  createGoogleSheetsClient,
} from './storage/googleSheetsClient.js';
import {
  createLocalSheetsClient,
} from './storage/localSheetsClient.js';
import {
  createPitchesRepository,
} from './storage/pitchesRepository.js';
import {
  createUsersRepository,
} from './storage/usersRepository.js';
import {
  createDashboardRepository,
} from './storage/dashboardRepository.js';

dotenv.config({ quiet: true });

const LOCAL_STORAGE_MODES = new Set(['demo', 'local', 'mock']);

/**
 * Reads and normalizes the configured storage mode.
 *
 * Args:
 * @param {object} [env] - Environment-like object that may include STORAGE_MODE.
 *
 * Returns:
 * @returns {string} Normalized storage mode string; returns "" when STORAGE_MODE is missing.
 */
export const getStorageMode = (env = process.env) => (
  String(env.STORAGE_MODE || '').trim().toLowerCase()
);

/**
 * Checks whether the configured storage mode should use local demo storage.
 *
 * Args:
 * @param {object} [env] - Environment-like object that may include STORAGE_MODE.
 *
 * Returns:
 * @returns {boolean} True for "demo", "local", or "mock"; false for "google", "", or any other value.
 */
export const isLocalStorageMode = (env = process.env) => (
  LOCAL_STORAGE_MODES.has(getStorageMode(env))
);

/**
 * Creates the Sheets-compatible client for the configured storage mode.
 *
 * Args:
 * @param {object} [options] - Client selection options.
 * @param {object} [options.env] - Environment-like object used to read STORAGE_MODE and Google Sheets settings.
 * @param {string} [options.localStoragePath] - Optional local JSON file path for demo storage.
 * @param {object} [options.logger] - Logger passed to the selected storage client.
 *
 * Returns:
 * @returns {object} Local Sheets-compatible client for "demo", "local", or "mock"; Google Sheets client for every other mode.
 */
export const createSheetsClientForMode = ({
  env = process.env,
  localStoragePath = env.LOCAL_STORAGE_PATH,
  logger,
} = {}) => (
  isLocalStorageMode(env)
    ? createLocalSheetsClient({ logger, storagePath: localStoragePath })
    : createGoogleSheetsClient({ env, logger })
);

/**
 * Creates the storage facade used by the engine.
 *
 * Args:
 * @param {object} [options] - Storage construction options.
 * @param {object} [options.logger] - Logger passed to storage repositories and clients.
 * @param {Function|string} [options.now] - Timestamp provider or fixed timestamp used by repositories.
 * @param {object} [options.sheetsClient] - Sheets-compatible client used for persistence.
 *
 * Returns:
 * @returns {object} Storage facade with initializeAuth, savePitch, createUser, findUserByUsername, updateUserLastLogin, and getDashboardData.
 */
export const createStorage = ({
  logger,
  now,
  sheetsClient = createSheetsClientForMode({ logger }),
} = {}) => {
  const pitchesRepository = createPitchesRepository({
    sheetsClient,
    now,
    logger,
  });
  const usersRepository = createUsersRepository({
    sheetsClient,
    now,
    logger,
  });
  const dashboardRepository = createDashboardRepository({
    pitchesRepository,
    now,
    logger,
  });

  return {
    createUser: usersRepository.createUser,
    findUserByUsername: usersRepository.findUserByUsername,
    getDashboardData: dashboardRepository.getDashboardData,
    initializeAuth: sheetsClient.initializeAuth,
    savePitch: pitchesRepository.savePitch,
    updateUserLastLogin: usersRepository.updateUserLastLogin,
  };
};

const defaultStorage = createStorage();

/**
 * Initializes the default storage client.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default storage initializeAuth function.
 *
 * Returns:
 * @returns {Promise<unknown>} Initialization result from Google Sheets auth or local demo storage.
 */
export const initializeAuth = (...args) => defaultStorage.initializeAuth(...args);

/**
 * Saves a pitch through the default storage facade.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default storage savePitch function.
 *
 * Returns:
 * @returns {Promise<object>} Save result with success true, pitchId, timestamp, and result; or success false with error when persistence fails.
 */
export const savePitch = (...args) => defaultStorage.savePitch(...args);

/**
 * Creates a user through the default storage facade.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default storage createUser function.
 *
 * Returns:
 * @returns {Promise<object>} Create user result with success true and user; or success false with error such as "Username already exists".
 */
export const createUser = (...args) => defaultStorage.createUser(...args);

/**
 * Finds a user by username through the default storage facade.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default storage findUserByUsername function.
 *
 * Returns:
 * @returns {Promise<object|null>} User object when found; null when no matching username exists.
 */
export const findUserByUsername = (...args) => (
  defaultStorage.findUserByUsername(...args)
);

/**
 * Updates a user's last login timestamp through the default storage facade.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default storage updateUserLastLogin function.
 *
 * Returns:
 * @returns {Promise<object>} Update result with success true and lastLoginAt; or success false with error when the user cannot be found or updated.
 */
export const updateUserLastLogin = (...args) => (
  defaultStorage.updateUserLastLogin(...args)
);

/**
 * Loads dashboard data through the default storage facade.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default storage getDashboardData function.
 *
 * Returns:
 * @returns {Promise<object>} Dashboard result with success true, pitches, and stats; or success false with error, empty pitches, and empty stats.
 */
export const getDashboardData = (...args) => (
  defaultStorage.getDashboardData(...args)
);
