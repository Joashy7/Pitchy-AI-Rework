import { clearAnalysisResult } from "./analysisResults";

const AUTH_STORAGE_KEY = "pitchyUser";
const AUTH_DURATION_MS = 60 * 60 * 1000;
export const AUTH_CHECK_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Creates a browser session token.
 *
 * Args:
 * None.
 *
 * Returns:
 * @returns {string} Random UUID when available, otherwise a generated hexadecimal token.
 */
const createSessionToken = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();

  const values = new Uint32Array(4);
  globalThis.crypto.getRandomValues(values);
  return Array.from(values, (value) => value.toString(16)).join("-");
};

/**
 * Reads the current auth state from localStorage.
 *
 * Args:
 * None.
 *
 * Returns:
 * @returns {object|null} Parsed auth state when present and valid; null when missing or malformed.
 */
const getAuthState = () => {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
};

/**
 * Converts a user object into an expiring browser auth state.
 *
 * Args:
 * @param {object} user - User object from the backend or existing auth state.
 *
 * Returns:
 * @returns {object} Auth state with user fields, token, and expiresAt timestamp.
 */
const toAuthState = (user) => ({
  ...user,
  token: user.token || createSessionToken(),
  expiresAt: Date.now() + AUTH_DURATION_MS,
});

/**
 * Saves a user session to localStorage.
 *
 * Args:
 * @param {object} user - User object with userId, username, and optional token.
 *
 * Returns:
 * @returns {object} Saved auth state with token and expiresAt timestamp.
 */
export const saveAuthUser = (user) => {
  const authState = toAuthState(user);
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
  return authState;
};

/**
 * Logs out the current browser user and clears stored analysis data.
 *
 * Args:
 * None.
 *
 * Returns:
 * @returns {void} Does not return a value.
 */
export const logoutUser = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  clearAnalysisResult();
};

/**
 * Checks whether any auth state is stored in the browser.
 *
 * Args:
 * None.
 *
 * Returns:
 * @returns {boolean} True when the auth storage key exists; false otherwise.
 */
export const hasStoredAuthUser = () => Boolean(localStorage.getItem(AUTH_STORAGE_KEY));

/**
 * Loads the authenticated browser user if the local session is still valid.
 *
 * Args:
 * None.
 *
 * Returns:
 * @returns {object|null} Auth state when username or userId exists and the session has not expired; null when missing, malformed, or expired.
 */
export const getAuthenticatedUser = () => {
  const authState = getAuthState();

  if (!authState?.username && !authState?.userId) return null;

  if (!authState.expiresAt) {
    return saveAuthUser(authState);
  }

  if (Date.now() > authState.expiresAt) {
    logoutUser();
    return null;
  }

  return authState;
};

/**
 * Refreshes the browser session after a new pitch action.
 *
 * Args:
 * None.
 *
 * Returns:
 * @returns {object|null} Refreshed auth state with lastPitchAt when a user is logged in; null when no valid user session exists.
 */
export const refreshPitchSession = () => {
  const authState = getAuthenticatedUser();
  if (!authState) return null;

  return saveAuthUser({
    ...authState,
    lastPitchAt: Date.now(),
  });
};
