import { analyzeAudioPitch } from "../../lib/api";
import { saveAnalysisResult } from "../../utils/analysisResults";
import { getAuthenticatedUser, refreshPitchSession } from "../../utils/auth";

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
