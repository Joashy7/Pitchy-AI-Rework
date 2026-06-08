import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

import { createEngineError } from './errors.js';

const PASSWORD_KEY_LENGTH = 64;
const MIN_PASSWORD_LENGTH = 6;
const HEX_PATTERN = /^[0-9a-f]+$/i;

/**
 * Converts credential input into trimmed text.
 *
 * Args:
 * @param {unknown} value - Raw credential value to normalize.
 *
 * Returns:
 * @returns {string} Trimmed string value; returns "" for null, undefined, or other empty values.
 */
const normalizeCredentialText = (value) => String(value || '').trim();

/**
 * Validates and normalizes login or signup credentials.
 *
 * Args:
 * @param {object} [credentials] - Raw credentials object.
 * @param {unknown} [credentials.username] - Username value to trim and validate.
 * @param {unknown} [credentials.password] - Password value to validate.
 *
 * Returns:
 * @returns {{username: string, password: string}} Normalized credentials when valid; throws status 400 errors for "Username is required", "Password is required", or "Password must be at least 6 characters".
 */
export const validateCredentials = ({ username, password } = {}) => {
  const normalizedUsername = normalizeCredentialText(username);
  const normalizedPassword = String(password || '');

  if (!normalizedUsername) {
    throw createEngineError('Username is required', 400);
  }

  if (!normalizedPassword) {
    throw createEngineError('Password is required', 400);
  }

  if (normalizedPassword.length < MIN_PASSWORD_LENGTH) {
    throw createEngineError('Password must be at least 6 characters', 400);
  }

  return {
    username: normalizedUsername,
    password: normalizedPassword,
  };
};

/**
 * Hashes a plaintext password with scrypt and a salt.
 *
 * Args:
 * @param {string} password - Plaintext password to hash.
 * @param {object} [options] - Hashing options.
 * @param {string} [options.salt] - Optional salt for deterministic tests or custom hashing.
 *
 * Returns:
 * @returns {string} Stored password hash formatted as "salt:hash".
 */
export const hashPassword = (password, { salt = randomBytes(16).toString('hex') } = {}) => {
  const hash = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString('hex');

  return `${salt}:${hash}`;
};

/**
 * Verifies a plaintext password against a stored scrypt hash.
 *
 * Args:
 * @param {string} password - Plaintext password to verify.
 * @param {string} storedHash - Stored hash formatted as "salt:hash".
 *
 * Returns:
 * @returns {boolean} True when the password matches; false for missing hashes, malformed hashes, invalid hex, empty buffers, mismatches, or verification errors.
 */
export const verifyPassword = (password, storedHash) => {
  const [salt, hash] = String(storedHash || '').split(':');

  if (!salt || !hash) return false;
  if (hash.length % 2 !== 0 || !HEX_PATTERN.test(hash)) return false;

  try {
    const storedBuffer = Buffer.from(hash, 'hex');
    if (!storedBuffer.length) return false;

    const passwordBuffer = scryptSync(password, salt, storedBuffer.length);

    return timingSafeEqual(storedBuffer, passwordBuffer);
  } catch {
    return false;
  }
};

/**
 * Converts a stored user object into a public user object.
 *
 * Args:
 * @param {object} [user] - Stored user object that may include private fields.
 *
 * Returns:
 * @returns {{userId: string|undefined, username: string|undefined}} Public user object containing only userId and username.
 */
export const toPublicUser = (user = {}) => ({
  userId: user.userId,
  username: user.username,
});
