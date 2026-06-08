import { FAILED_DASHBOARD_DATA } from "../constants/messages";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

/**
 * Parses a backend JSON response and throws for non-OK responses.
 *
 * Args:
 * @param {Response} response - Fetch response returned by the backend.
 *
 * Returns:
 * @returns {Promise<object>} Parsed JSON response body; throws Error with backend error text or "Request failed" when response.ok is false.
 */
const parseJsonResponse = async (response) => {
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || "Request failed");
  }

  return result;
};

/**
 * Sends a JSON POST request to the backend API.
 *
 * Args:
 * @param {string} path - Backend route path beginning with "/".
 * @param {object} payload - JSON-serializable request body.
 *
 * Returns:
 * @returns {Promise<object>} Parsed backend response; throws when the request fails or returns a non-OK status.
 */
const postJson = async (path, payload) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse(response);
};

/**
 * Loads dashboard data from the backend.
 *
 * Args:
 * @param {URLSearchParams} [queryParams] - Optional user-scoped dashboard query parameters.
 *
 * Returns:
 * @returns {Promise<object>} Dashboard result with success, pitches, and stats; throws when the backend returns an error or success false.
 */
export const getDashboardData = async (queryParams = new URLSearchParams()) => {
  const queryString = queryParams.toString();
  const response = await fetch(
    `${API_BASE_URL}/dashboard-data${queryString ? `?${queryString}` : ""}`
  );
  const result = await parseJsonResponse(response);

  if (!result.success) {
    throw new Error(result.error || FAILED_DASHBOARD_DATA);
  }

  return result;
};

/**
 * Logs in an existing user.
 *
 * Args:
 * @param {object} credentials - Login credentials.
 * @param {string} credentials.username - Username entered by the user.
 * @param {string} credentials.password - Password entered by the user.
 *
 * Returns:
 * @returns {Promise<object>} Login response with success and user fields; throws when login fails.
 */
export const login = (credentials) => postJson("/login", credentials);

/**
 * Creates a new user account.
 *
 * Args:
 * @param {object} credentials - Signup credentials.
 * @param {string} credentials.username - Username entered by the user.
 * @param {string} credentials.password - Password entered by the user.
 *
 * Returns:
 * @returns {Promise<object>} Signup response with success and user fields; throws when signup fails.
 */
export const signup = (credentials) => postJson("/signup", credentials);

/**
 * Sends typed pitch text for AI analysis.
 *
 * Args:
 * @param {object} payload - Text analysis payload.
 * @param {string} payload.transcript - Typed pitch transcript.
 * @param {string} [payload.userId] - Optional authenticated user ID.
 * @param {string} [payload.username] - Optional authenticated username.
 *
 * Returns:
 * @returns {Promise<object>} Text analysis response with score_analysis_available false, improved pitch text, suggestions, and storageResult.
 */
export const analyzeTextPitch = (payload) => postJson("/analyze-text", payload);

/**
 * Requests text-to-speech audio for a transcript.
 *
 * Args:
 * @param {string} transcript - Transcript text to convert to generated audio.
 *
 * Returns:
 * @returns {Promise<object>} Audio response containing audioUrl; throws when generation fails.
 */
export const generatePitchAudio = (transcript) => (
  postJson("/generate-pitch-audio", { transcript })
);

/**
 * Sends recorded pitch audio for transcription and AI analysis.
 *
 * Args:
 * @param {FormData} formData - Multipart form data containing file, userId, and username fields.
 *
 * Returns:
 * @returns {Promise<object>} Audio analysis response with transcript, scores, feedback, improved pitch text, suggestions, and storageResult.
 */
export const analyzeAudioPitch = async (formData) => {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    body: formData,
  });

  return parseJsonResponse(response);
};
