import assert from 'node:assert/strict';

import { buildAnalysisPrompt } from '../../engine/prompts.js';
import { loggedTest } from '../helpers/loggedTest.js';

const LOCATION = 'server/engine/prompts.js';

loggedTest('buildAnalysisPrompt - injects transcript and duration', LOCATION, () => {
  const prompt = buildAnalysisPrompt('Our product helps founders practice pitches.', 42);

  assert.match(prompt, /Total speech duration in seconds: 42/);
  assert.match(prompt, /Transcript:\nOur product helps founders practice pitches\./);
});

loggedTest('buildAnalysisPrompt - strict JSON instructions', LOCATION, () => {
  const prompt = buildAnalysisPrompt('Pitch transcript.', 12);

  assert.match(prompt, /Return ONLY valid JSON/);
  assert.match(prompt, /Return EXACTLY this shape/);
  assert.match(prompt, /"improved_transcript": ""/);
  assert.match(prompt, /"modification_regions": \[/);
});

loggedTest('buildAnalysisPrompt - low-content guardrails', LOCATION, () => {
  const prompt = buildAnalysisPrompt('testing testing', 2);

  assert.match(prompt, /If the transcript is just a microphone test/);
  assert.match(prompt, /do not create a pitch/);
  assert.match(prompt, /Do NOT turn a short test phrase/);
  assert.match(prompt, /testing testing/);
});
