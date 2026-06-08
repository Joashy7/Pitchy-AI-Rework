import { formatDuration } from './duration.js';
import {
  cleanTranscriptFallback,
  getTranscriptWords,
  toText,
} from './text.js';

const NON_PITCH_TOKENS = new Set([
  'test',
  'testing',
  'hello',
  'hi',
  'hey',
  'mic',
  'microphone',
  'audio',
  'check',
  'one',
  'two',
  'three',
  'um',
  'uh',
  'ah',
  'hmm',
]);

const PITCH_SIGNAL_WORDS = new Set([
  'app',
  'build',
  'building',
  'business',
  'company',
  'customer',
  'customers',
  'funding',
  'help',
  'helps',
  'idea',
  'invest',
  'investment',
  'market',
  'offer',
  'offering',
  'pitch',
  'platform',
  'problem',
  'product',
  'revenue',
  'sell',
  'selling',
  'service',
  'solution',
  'startup',
  'team',
  'users',
]);

/**
 * Detects whether a transcript lacks enough real pitch content for full analysis.
 *
 * Args:
 * @param {unknown} transcript - Transcript text to tokenize and inspect.
 *
 * Returns:
 * @returns {boolean} True for empty input, microphone tests, filler fragments, repeated non-pitch words, or very short text without pitch signals; false when pitch signal words or enough meaningful words are present.
 */
export const isLowContentTranscript = (transcript) => {
  const words = getTranscriptWords(transcript);
  if (!words.length) return true;

  const hasPitchSignal = words.some((word) => PITCH_SIGNAL_WORDS.has(word));
  const meaningfulWords = words.filter((word) => !NON_PITCH_TOKENS.has(word));
  const uniqueMeaningfulWords = new Set(meaningfulWords);

  if (words.length < 5 && !hasPitchSignal) return true;
  if (!meaningfulWords.length) return true;
  if (uniqueMeaningfulWords.size <= 1 && !hasPitchSignal) return true;

  return false;
};

/**
 * Builds a guarded low-content analysis response.
 *
 * Args:
 * @param {unknown} transcript - Low-content transcript to lightly clean without inventing pitch details.
 * @param {number} durationSeconds - Estimated or recorded speech duration in seconds.
 *
 * Returns:
 * @returns {object} Analysis object with very low scores, summary_feedback explaining insufficient pitch content, empty strong_points and modification_regions, optional cleanup-only changes_made, formatted duration, improved_transcript, and transcript.
 */
export const buildLowContentAnalysis = (transcript, durationSeconds) => {
  const improvedTranscript = cleanTranscriptFallback(transcript);

  return {
    clarity: improvedTranscript ? 10 : 0,
    persuasiveness: 0,
    confidence: 0,
    narrative_flow: 0,
    overall_score: improvedTranscript ? 5 : 0,
    summary_feedback: 'There is not enough pitch content to analyze. Record a complete pitch with a problem, solution, audience, and value proposition.',
    strong_points: [],
    needs_focus: [
      {
        timestamp: '00:00',
        quote: improvedTranscript || 'No usable transcript',
        explanation: 'The recording appears to be a test or fragment rather than a complete pitch.',
      },
    ],
    duration: formatDuration(durationSeconds),
    improved_transcript: improvedTranscript,
    modification_regions: [],
    changes_made: improvedTranscript
      ? [
          {
            area: 'clarity',
            original: toText(transcript),
            improved: improvedTranscript,
            reason: 'Cleaned capitalization and punctuation without adding pitch content.',
          },
        ]
      : [],
    transcript: toText(transcript),
  };
};
