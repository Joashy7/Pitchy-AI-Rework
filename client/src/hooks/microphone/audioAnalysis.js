import { analyzeAudioPitch } from "../../lib/api";
import { saveAnalysisResult } from "../../utils/analysisResults";
import { getAuthenticatedUser, refreshPitchSession } from "../../utils/auth";

/**
 * Uploads recorded audio for analysis and stores the returned result.
 *
 * Args:
 * @param {Blob} audioBlob - Recorded microphone audio blob.
 *
 * Returns:
 * @returns {Promise<object>} Audio analysis response from the backend after it is saved to localStorage; rejects when upload or analysis fails.
 */
export const analyzeRecordedAudio = async (audioBlob) => {
  const formData = new FormData();
  const currentUser = getAuthenticatedUser() || {};

  formData.append("file", audioBlob, "recording.webm");
  formData.append("userId", currentUser.userId || "");
  formData.append("username", currentUser.username || "");

  const data = await analyzeAudioPitch(formData);

  saveAnalysisResult(data);
  refreshPitchSession();

  return data;
};
