import { GoogleGenerativeAI } from '@google/generative-ai';

import {
  cleanTranscriptFallback,
  isLowContentTranscript,
  normalizeAnalysis,
} from './analysisNormalizer.js';
import {
  buildAnalysisPrompt,
  buildImprovedPitchPrompt,
} from './prompts.js';
import { withRetries, withTimeout } from './retry.js';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_TIMEOUT_MS = 45000;

let genAI;

const getGeminiModel = () => {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  return genAI.getGenerativeModel({ model: GEMINI_MODEL });
};

const cleanGeminiJsonText = (text) => {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');

  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    return cleaned.slice(jsonStart, jsonEnd + 1);
  }

  return cleaned;
};

const parseGeminiJson = (text) => {
  const cleaned = cleanGeminiJsonText(text);

  try {
    return JSON.parse(cleaned);
  } catch (parseError) {
    console.error('Gemini JSON parse error:', parseError.message);
    console.error('Cleaned Gemini text:', cleaned);
    throw new Error('Gemini returned invalid JSON');
  }
};

const generateGeminiText = async (prompt, label) => withRetries(
  async () => {
    const result = await withTimeout(
      getGeminiModel().generateContent(prompt),
      label,
      GEMINI_TIMEOUT_MS
    );

    return result.response.text().trim();
  },
  label,
  2
);

export async function analyzeWithGemini(transcript, durationSeconds) {
  console.log('Gemini analysis started');

  const text = await generateGeminiText(
    buildAnalysisPrompt(transcript, durationSeconds),
    'Gemini analysis'
  );

  console.log('Raw Gemini response:');
  console.log(text);

  return normalizeAnalysis(parseGeminiJson(text), transcript, durationSeconds);
}

export async function generateImprovedPitch(transcript, analysis) {
  console.log('Generating improved pitch');

  if (isLowContentTranscript(transcript)) {
    console.log('Low-content transcript detected; returning cleaned transcript');
    return cleanTranscriptFallback(transcript);
  }

  const improvedPitch = await generateGeminiText(
    buildImprovedPitchPrompt(transcript, analysis),
    'Gemini improved pitch'
  );

  console.log('Improved pitch generated');
  return improvedPitch.trim();
}
