import assert from 'node:assert/strict';

import { formatDuration } from '../../engine/analysis/duration.js';
import {
  normalizeChanges,
  normalizeFeedbackItems,
  normalizeModificationRegions,
} from '../../engine/analysis/feedback.js';
import { generateImprovementSuggestions } from '../../engine/analysis/improvementSuggestions.js';
import {
  buildLowContentAnalysis,
  isLowContentTranscript,
} from '../../engine/analysis/lowContent.js';
import { normalizeScores } from '../../engine/analysis/scores.js';
import {
  cleanTranscriptFallback,
  getTranscriptWords,
  toText,
} from '../../engine/analysis/text.js';
import { loggedTest } from '../helpers/loggedTest.js';

const DURATION_LOCATION = 'server/engine/analysis/duration.js';
const FEEDBACK_LOCATION = 'server/engine/analysis/feedback.js';
const IMPROVEMENT_LOCATION = 'server/engine/analysis/improvementSuggestions.js';
const LOW_CONTENT_LOCATION = 'server/engine/analysis/lowContent.js';
const SCORES_LOCATION = 'server/engine/analysis/scores.js';
const TEXT_LOCATION = 'server/engine/analysis/text.js';

loggedTest('normalizeScores - fallback average', SCORES_LOCATION, () => {
  assert.deepEqual(
    normalizeScores({
      clarity: '90.4',
      persuasiveness: -20,
      confidence: 'not-a-score',
      narrative_flow: 150,
    }),
    {
      clarity: 90,
      persuasiveness: 0,
      confidence: 0,
      narrative_flow: 100,
      overall_score: 95,
    }
  );
});

loggedTest('normalizeScores - explicit overall score', SCORES_LOCATION, () => {
  assert.equal(normalizeScores({ overall_score: 0 }).overall_score, 0);
  assert.equal(normalizeScores({ overall_score: 101 }).overall_score, 100);
});

loggedTest('normalizeFeedbackItems - trims and filters entries', FEEDBACK_LOCATION, () => {
  assert.deepEqual(
    normalizeFeedbackItems([
      { timestamp: '', quote: '  Hook  ', explanation: ' Clear start ' },
      { timestamp: '00:02', quote: '', explanation: '' },
      null,
    ]),
    [
      {
        timestamp: '00:00',
        quote: 'Hook',
        explanation: 'Clear start',
      },
    ]
  );
});

loggedTest('normalizeChanges - sparse entries', FEEDBACK_LOCATION, () => {
  assert.deepEqual(
    normalizeChanges([
      { area: 'clarity', original: '', improved: 'Cleaner ask', reason: '' },
      { area: '', original: '', improved: '', reason: '' },
    ]),
    [
      {
        area: 'clarity',
        original: '',
        improved: 'Cleaner ask',
        reason: '',
      },
    ]
  );
});

loggedTest('normalizeModificationRegions - suggestedEdit alias', FEEDBACK_LOCATION, () => {
  assert.deepEqual(
    normalizeModificationRegions([
      { timestamp: '', section: 'Opening', suggestedEdit: 'Lead with the problem.' },
      { section: '', issue: '', suggested_edit: '', reason: '' },
    ]),
    [
      {
        timestamp: '00:00',
        section: 'Opening',
        original: '',
        issue: '',
        suggested_edit: 'Lead with the problem.',
        reason: '',
      },
    ]
  );
});

loggedTest('generateImprovementSuggestions - score availability', IMPROVEMENT_LOCATION, () => {
  const suggestions = generateImprovementSuggestions(
    {
      score_analysis_available: false,
      score_analysis_message: 'Text-based analysis does not provide score analysis.',
    },
    {
      overall_score: 88,
      clarity: 90,
      persuasiveness: 87,
      confidence: 86,
      narrative_flow: 89,
      summary_feedback: 'Sharper ask.',
      strong_points: ['Clear problem.'],
      needs_focus: ['Add proof.'],
      modification_regions: [],
      changes_made: [],
    },
    { now: () => '2026-01-01T00:00:00.000Z' }
  );

  assert.equal(suggestions.overall_score, null);
  assert.equal(suggestions.score_breakdown.clarity, null);
  assert.equal(suggestions.score_analysis_available, false);
  assert.equal(suggestions.summary_feedback, 'Sharper ask.');
  assert.equal(suggestions.generated_at, '2026-01-01T00:00:00.000Z');
});

loggedTest('isLowContentTranscript - pitch signal words', LOW_CONTENT_LOCATION, () => {
  assert.equal(isLowContentTranscript('testing testing'), true);
  assert.equal(isLowContentTranscript('product helps'), false);
});

loggedTest('buildLowContentAnalysis - empty transcript', LOW_CONTENT_LOCATION, () => {
  const analysis = buildLowContentAnalysis('', 12);

  assert.equal(analysis.overall_score, 0);
  assert.equal(analysis.improved_transcript, '');
  assert.deepEqual(analysis.changes_made, []);
  assert.equal(analysis.duration, '0:12');
});

loggedTest('formatDuration - boundary values', DURATION_LOCATION, () => {
  assert.equal(formatDuration(-5), '0:00');
  assert.equal(formatDuration(125.6), '2:06');
  assert.equal(formatDuration('bad input'), '0:00');
});

loggedTest('toText, getTranscriptWords, cleanTranscriptFallback - transcript text', TEXT_LOCATION, () => {
  assert.equal(toText(null, 'fallback'), 'fallback');
  assert.deepEqual(getTranscriptWords("Hello, founder's pitch!"), ['hello', "founder's", 'pitch']);
  assert.equal(cleanTranscriptFallback('  hello   world  '), 'Hello world.');
});
