import { clearAnalysisResult } from "./analysisResults";

const AUTH_STORAGE_KEY = "pitchyUser";
const AUTH_DURATION_MS = 60 * 60 * 1000;
export const AUTH_CHECK_INTERVAL_MS = 5 * 60 * 1000;

const createSessionToken = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();

  const values = new Uint32Array(4);
  globalThis.crypto.getRandomValues(values);
  return Array.from(values, (value) => value.toString(16)).join("-");
};

const getAuthState = () => {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
};

const toAuthState = (user) => ({
  ...user,
  token: user.token || createSessionToken(),
  expiresAt: Date.now() + AUTH_DURATION_MS,
});

export const saveAuthUser = (user) => {
  const authState = toAuthState(user);
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
  return authState;
};

export const logoutUser = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  clearAnalysisResult();
};

export const hasStoredAuthUser = () => Boolean(localStorage.getItem(AUTH_STORAGE_KEY));

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

export const refreshPitchSession = () => {
  const authState = getAuthenticatedUser();
  if (!authState) return null;

  return saveAuthUser({
    ...authState,
    lastPitchAt: Date.now(),
  });
};
