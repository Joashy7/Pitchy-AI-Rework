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

export const toText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;

  const text = String(value).trim();
  return text || fallback;
};

export const formatDuration = (durationSeconds = 0) => {
  const totalSeconds = Math.max(0, Math.round(Number(durationSeconds) || 0));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const parseScore = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;

  return Math.min(100, Math.max(0, Math.round(parsed)));
};

const getTranscriptWords = (transcript) => (
  toText(transcript)
    .toLowerCase()
    .match(/[a-z0-9']+/g) || []
);

export const cleanTranscriptFallback = (transcript) => {
  const cleaned = toText(transcript).replace(/\s+/g, ' ');
  if (!cleaned) return '';

  const capitalized = `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}`;
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
};

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

const buildLowContentAnalysis = (transcript, durationSeconds) => {
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

const normalizeFeedbackItems = (items) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => ({
      timestamp: toText(item?.timestamp, '00:00'),
      quote: toText(item?.quote),
      explanation: toText(item?.explanation),
    }))
    .filter((item) => item.quote || item.explanation);
};

const normalizeChanges = (changes) => {
  if (!Array.isArray(changes)) return [];

  return changes
    .map((change) => ({
      area: toText(change?.area),
      original: toText(change?.original),
      improved: toText(change?.improved),
      reason: toText(change?.reason),
    }))
    .filter((change) => change.area || change.original || change.improved || change.reason);
};

export const normalizeAnalysis = (analysis = {}, transcript = '', durationSeconds = 0) => {
  const sourceTranscript = toText(transcript, analysis.transcript || '');

  if (sourceTranscript && isLowContentTranscript(sourceTranscript)) {
    const lowContentAnalysis = buildLowContentAnalysis(sourceTranscript, durationSeconds);
    return {
      ...lowContentAnalysis,
      duration: toText(analysis.duration, lowContentAnalysis.duration),
    };
  }

  const clarity = parseScore(analysis.clarity) ?? 0;
  const persuasiveness = parseScore(analysis.persuasiveness) ?? 0;
  const confidence = parseScore(analysis.confidence) ?? 0;
  const narrativeFlow = parseScore(analysis.narrative_flow) ?? 0;
  const scoreValues = [clarity, persuasiveness, confidence, narrativeFlow].filter(
    (score) => score > 0
  );
  const fallbackOverall = scoreValues.length
    ? Math.round(scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length)
    : 0;

  return {
    clarity,
    persuasiveness,
    confidence,
    narrative_flow: narrativeFlow,
    overall_score: parseScore(analysis.overall_score) ?? fallbackOverall,
    summary_feedback: toText(analysis.summary_feedback, 'No summary available.'),
    strong_points: normalizeFeedbackItems(analysis.strong_points),
    needs_focus: normalizeFeedbackItems(analysis.needs_focus),
    duration: toText(analysis.duration, formatDuration(durationSeconds)),
    improved_transcript: toText(analysis.improved_transcript),
    changes_made: normalizeChanges(analysis.changes_made),
    transcript: sourceTranscript,
  };
};

export function generateImprovementSuggestions(analysis) {
  const normalizedAnalysis = normalizeAnalysis(analysis);

  return {
    overall_score: normalizedAnalysis.overall_score,
    summary_feedback: normalizedAnalysis.summary_feedback,
    strong_points: normalizedAnalysis.strong_points,
    needs_focus: normalizedAnalysis.needs_focus,
    score_breakdown: {
      clarity: normalizedAnalysis.clarity,
      persuasiveness: normalizedAnalysis.persuasiveness,
      confidence: normalizedAnalysis.confidence,
      narrative_flow: normalizedAnalysis.narrative_flow,
    },
    generated_at: new Date().toISOString(),
  };
}
