import dotenv from 'dotenv';

import * as storage from '../storage.js';
import {
  analyzeWithGemini,
  generateImprovedPitch,
} from './engine/analysisClient.js';
import {
  formatDuration,
  generateImprovementSuggestions,
  normalizeAnalysis,
  toText,
} from './engine/analysisNormalizer.js';
import { createEngineError, getErrorStatusCode } from './engine/errors.js';
import {
  generateTextToSpeechAudio,
  transcribeWithElevenLabs,
} from './engine/speechClient.js';

dotenv.config();

export { getErrorStatusCode };
export {
  analyzeWithGemini,
  generateImprovedPitch,
  generateImprovementSuggestions,
  normalizeAnalysis,
  formatDuration,
  transcribeWithElevenLabs,
};

export async function initializeEngine() {
  await storage.initializeAuth();
  console.log('Storage system initialized successfully');
}

export async function getDashboardData() {
  return storage.getDashboardData();
}

export async function analyzePitchFile(file) {
  if (!file) {
    throw createEngineError('No audio file uploaded', 400);
  }

  console.log('Analyze workflow started');

  const sttData = await transcribeWithElevenLabs(file);
  const transcript = sttData.text || 'No transcript returned';
  const durationSeconds = sttData.audio_duration_secs || 0;

  console.log('Transcript ready for analysis:');
  console.log(transcript);

  const analysis = await analyzeWithGemini(transcript, durationSeconds);
  const improvementSuggestions = generateImprovementSuggestions(analysis);
  const improvedPitch = analysis.improved_transcript || '';
  const pitchData = {
    transcribed_pitch: transcript,
    improvedPitch,
    analysis_score: analysis.overall_score,
    improvement_suggestion_text: analysis.summary_feedback,
    clarity_score: analysis.clarity,
    persuasiveness_score: analysis.persuasiveness,
    confidence_score: analysis.confidence,
    narrative_flow_score: analysis.narrative_flow,
    duration: analysis.duration || formatDuration(durationSeconds),
  };

  const storageResult = await storage.savePitch(pitchData);
  console.log('Storage result:', storageResult);

  return {
    transcript,
    ...analysis,
    improvedPitch,
    improvementSuggestions,
    storageResult,
  };
}

export async function generatePitchAudio(transcript) {
  const text = toText(transcript);
  if (!text) {
    throw createEngineError('Transcript is required', 400);
  }

  return generateTextToSpeechAudio(text);
}

export async function improvePitch(transcript, analysis) {
  if (!transcript || !analysis) {
    throw createEngineError('Transcript and analysis are required', 400);
  }

  return {
    improvedPitch: await generateImprovedPitch(transcript, analysis),
  };
}

export async function saveImprovedPitch(pitchId, improvedPitch) {
  if (!pitchId || !improvedPitch) {
    throw createEngineError('pitchId and improvedPitch are required', 400);
  }

  const result = await storage.saveImprovedPitch(pitchId, improvedPitch);

  return {
    success: result.success,
    message: result.success ? 'Improved pitch saved' : result.error,
  };
}

export default {
  initializeEngine,
  getDashboardData,
  analyzePitchFile,
  generatePitchAudio,
  improvePitch,
  saveImprovedPitch,
  transcribeWithElevenLabs,
  analyzeWithGemini,
  generateImprovedPitch,
  generateImprovementSuggestions,
  normalizeAnalysis,
  formatDuration,
  getErrorStatusCode,
};
