import * as defaultStorage from '../storage.js';

import {
  hashPassword,
  toPublicUser,
  validateCredentials,
  verifyPassword,
} from './auth.js';
import { createEngineError } from './errors.js';

/**
 * Creates the user service used for signup and login.
 *
 * Args:
 * @param {object} [options] - User service dependencies.
 * @param {object} [options.storageClient] - Storage facade with createUser, findUserByUsername, and updateUserLastLogin.
 * @param {Function} [options.hashPasswordFn] - Password hashing function.
 * @param {Function} [options.validateCredentialsFn] - Credential validation function.
 * @param {Function} [options.verifyPasswordFn] - Password verification function.
 *
 * Returns:
 * @returns {object} User service with signUpUser and loginUser; signup returns success true with public user or throws status 409 for "Username already exists"; login returns success true with public user or throws status 401 for "Invalid username or password".
 */
export const createUserService = ({
  storageClient = defaultStorage,
  hashPasswordFn = hashPassword,
  validateCredentialsFn = validateCredentials,
  verifyPasswordFn = verifyPassword,
} = {}) => {
  /**
   * Creates a user account.
   *
   * Args:
   * @param {object} credentials - Signup credentials with username and password.
   *
   * Returns:
   * @returns {Promise<{success: boolean, user: object}>} Success response with public user; rejects with status 400 for invalid credentials, status 409 for "Username already exists", or status 500 for storage failures.
   */
  const signUpUser = async (credentials) => {
    const { username, password } = validateCredentialsFn(credentials);
    const passwordHash = hashPasswordFn(password);
    const result = await storageClient.createUser({ username, passwordHash });

    if (!result.success) {
      const statusCode = result.error === 'Username already exists' ? 409 : 500;
      throw createEngineError(result.error || 'Failed to create user', statusCode);
    }

    return {
      success: true,
      user: toPublicUser(result.user),
    };
  };

  /**
   * Logs in an existing user.
   *
   * Args:
   * @param {object} credentials - Login credentials with username and password.
   *
   * Returns:
   * @returns {Promise<{success: boolean, user: object}>} Success response with public user; rejects with status 400 for invalid credentials or status 401 for "Invalid username or password".
   */
  const loginUser = async (credentials) => {
    const { username, password } = validateCredentialsFn(credentials);
    const user = await storageClient.findUserByUsername(username);

    if (!user || !verifyPasswordFn(password, user.passwordHash)) {
      throw createEngineError('Invalid username or password', 401);
    }

    await storageClient.updateUserLastLogin(user.userId);

    return {
      success: true,
      user: toPublicUser(user),
    };
  };

  return {
    loginUser,
    signUpUser,
  };
};

const defaultUserService = createUserService();

/**
 * Creates a user through the default user service.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default signUpUser function.
 *
 * Returns:
 * @returns {Promise<object>} Signup result with success true and public user; rejects with status-coded validation, duplicate username, or storage errors.
 */
export const signUpUser = (...args) => defaultUserService.signUpUser(...args);

/**
 * Logs in a user through the default user service.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default loginUser function.
 *
 * Returns:
 * @returns {Promise<object>} Login result with success true and public user; rejects with status 401 for invalid credentials.
 */
export const loginUser = (...args) => defaultUserService.loginUser(...args);
