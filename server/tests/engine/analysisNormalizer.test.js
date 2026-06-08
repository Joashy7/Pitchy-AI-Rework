import assert from 'node:assert/strict';

import {
  cleanTranscriptFallback,
  formatDuration,
  generateImprovementSuggestions,
  isLowContentTranscript,
  normalizeAnalysis,
  toText,
} from '../../engine/analysisNormalizer.js';
import { loggedTest } from '../helpers/loggedTest.js';

const LOCATION = 'server/engine/analysisNormalizer.js';

loggedTest('normalizeAnalysis - missing Gemini fields', LOCATION, () => {
  const analysis = normalizeAnalysis({}, 'Our product helps founders pitch better.', 75);

  assert.equal(analysis.overall_score, 0);
  assert.equal(analysis.summary_feedback, 'No summary available.');
  assert.equal(analysis.duration, '1:15');
  assert.deepEqual(analysis.strong_points, []);
  assert.deepEqual(analysis.needs_focus, []);
});

loggedTest('normalizeAnalysis - score clamping', LOCATION, () => {
  const analysis = normalizeAnalysis({
    clarity: 120,
    persuasiveness: -10,
    confidence: 88.7,
    narrative_flow: '70',
  }, 'Our product helps founders pitch better.', 10);

  assert.equal(analysis.clarity, 100);
  assert.equal(analysis.persuasiveness, 0);
  assert.equal(analysis.confidence, 89);
  assert.equal(analysis.narrative_flow, 70);
  assert.equal(analysis.overall_score, 86);
});

loggedTest('normalizeAnalysis - low-content transcript', LOCATION, () => {
  const analysis = normalizeAnalysis({}, 'testing testing', 2);

  assert.equal(isLowContentTranscript('testing testing'), true);
  assert.equal(analysis.improved_transcript, 'Testing testing.');
  assert.equal(analysis.overall_score, 5);
  assert.equal(analysis.changes_made[0].reason, 'Cleaned capitalization and punctuation without adding pitch content.');
});

loggedTest('normalizeAnalysis - feedback regions', LOCATION, () => {
  const analysis = normalizeAnalysis({
    strong_points: [{ timestamp: '', quote: 'Hook', explanation: 'Clear start' }],
    needs_focus: [{ timestamp: '00:12', quote: '', explanation: 'Make the ask clearer' }],
    changes_made: [{ area: 'clarity', original: 'old', improved: 'new', reason: 'cleaner' }],
    modification_regions: [{
      timestamp: '00:05',
      section: 'Opening',
      original: 'old',
      issue: 'vague',
      suggestedEdit: 'new',
      reason: 'specific',
    }],
  }, 'Our product helps founders pitch better.', 30);

  assert.equal(analysis.strong_points[0].timestamp, '00:00');
  assert.equal(analysis.needs_focus[0].explanation, 'Make the ask clearer');
  assert.equal(analysis.changes_made[0].improved, 'new');
  assert.equal(analysis.modification_regions[0].suggested_edit, 'new');
});

loggedTest('generateImprovementSuggestions - text-only scores', LOCATION, () => {
  const suggestions = generateImprovementSuggestions({
    clarity: 80,
    persuasiveness: 70,
    confidence: 90,
    narrative_flow: 60,
    overall_score: 75,
    summary_feedback: 'Good',
    score_analysis_available: false,
    score_analysis_message: 'Text only',
  }, {
    now: () => '2026-01-01T00:00:00.000Z',
  });

  assert.equal(suggestions.overall_score, null);
  assert.equal(suggestions.score_breakdown.clarity, null);
  assert.equal(suggestions.generated_at, '2026-01-01T00:00:00.000Z');
});

loggedTest('toText, formatDuration, cleanTranscriptFallback - utility helpers', LOCATION, () => {
  assert.equal(toText(null, 'fallback'), 'fallback');
  assert.equal(formatDuration(65), '1:05');
  assert.equal(cleanTranscriptFallback('hello world'), 'Hello world.');
});
