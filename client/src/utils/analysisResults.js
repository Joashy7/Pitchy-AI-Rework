import {
  ERROR_LOADING_ANALYSIS_DATA,
  NO_ANALYSIS_DATA_FOUND,
} from "../constants/messages";
import { logError } from "./logger";

const ANALYSIS_STORAGE_KEY = "pitchPalResults";

export const readStoredAnalysis = () => {
  const raw = localStorage.getItem(ANALYSIS_STORAGE_KEY);

  if (!raw) {
    return {
      data: null,
      error: NO_ANALYSIS_DATA_FOUND,
    };
  }

  try {
    return {
      data: JSON.parse(raw),
      error: "",
    };
  } catch (error) {
    logError("Failed to parse analysis data:", error);
    return {
      data: null,
      error: ERROR_LOADING_ANALYSIS_DATA,
    };
  }
};

export const saveAnalysisResult = (analysisResult) => {
  localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(analysisResult));
};

export const clearAnalysisResult = () => {
  localStorage.removeItem(ANALYSIS_STORAGE_KEY);
};

export const toStoredAnalysis = (pitch) => ({
  transcript: pitch.transcript,
  improvedPitch: pitch.improvedPitch,
  improved_transcript: pitch.improvedPitch,
  overall_score: pitch.overall_score,
  score_analysis_available: pitch.score_analysis_available,
  score_analysis_message: pitch.score_analysis_message,
  analysis_mode: pitch.score_analysis_available ? "audio" : "text",
  summary_feedback: pitch.summary_feedback,
  clarity: pitch.clarity,
  persuasiveness: pitch.persuasiveness,
  confidence: pitch.confidence,
  narrative_flow: pitch.narrative_flow,
  strong_points: pitch.strong_points,
  needs_focus: pitch.needs_focus,
  modification_regions: pitch.modification_regions,
  changes_made: pitch.changes_made,
});
