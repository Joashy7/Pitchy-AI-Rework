import { FAILED_DASHBOARD_DATA } from "../constants/messages";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const parseJsonResponse = async (response) => {
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || "Request failed");
  }

  return result;
};

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

export const login = (credentials) => postJson("/login", credentials);

export const signup = (credentials) => postJson("/signup", credentials);

export const analyzeTextPitch = (payload) => postJson("/analyze-text", payload);

export const generatePitchAudio = (transcript) => (
  postJson("/generate-pitch-audio", { transcript })
);

export const analyzeAudioPitch = async (formData) => {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    body: formData,
  });

  return parseJsonResponse(response);
};
