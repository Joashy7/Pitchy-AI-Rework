import {
  durationToSeconds,
  formatDate,
  hasSheetValue,
  normalizeDuration,
  normalizeUsername,
  toNumber,
  truncateText,
} from './rowFormatters.js';
import {
  NO_SUMMARY_AVAILABLE,
  TEXT_SCORE_ANALYSIS_MESSAGE,
} from '../messages.js';

/**
 * Converts a numeric score into a dashboard status label.
 *
 * Args:
 * @param {number|null} score - Pitch score or null for text-only analysis.
 *
 * Returns:
 * @returns {"TEXT ONLY"|"ELITE"|"IMPROVING"|"ACTION NEEDED"} "TEXT ONLY" for null scores, "ELITE" for scores 90 and above, "IMPROVING" for scores 70 through 89, and "ACTION NEEDED" for lower scores.
 */
const getStatusFromScore = (score) => {
  if (score === null) return 'TEXT ONLY';
  if (score >= 90) return 'ELITE';
  if (score >= 70) return 'IMPROVING';
  return 'ACTION NEEDED';
};

/**
 * Builds a readable dashboard pitch name.
 *
 * Args:
 * @param {string} pitchId - Stored pitch ID.
 * @param {string} timestamp - Stored pitch timestamp.
 * @param {string} transcript - Stored transcript text.
 *
 * Returns:
 * @returns {string} Transcript preview when present, "Pitch from <date>" when only timestamp is present, derived pitch ID label when pitchId exists, or "Recorded Pitch" as fallback.
 */
const getPitchName = (pitchId, timestamp, transcript) => {
  const transcriptPreview = truncateText(transcript, 42);
  if (transcriptPreview) return transcriptPreview;

  if (timestamp) {
    return `Pitch from ${formatDate(timestamp)}`;
  }

  return pitchId ? `Pitch ${pitchId.replace(/^pitch_/i, '').replace(/^PITCH_/, '')}` : 'Recorded Pitch';
};

/**
 * Maps a stored pitch sheet row into a dashboard pitch object.
 *
 * Args:
 * @param {unknown[]} row - Raw pitch row from storage.
 * @param {number} index - Zero-based row index used for fallback IDs.
 *
 * Returns:
 * @returns {object} Dashboard pitch object with id, pitchId, user fields, display name, description, date, duration, score, score_analysis_available, score_analysis_message, status, transcript, improvedPitch, feedback, and score fields; status is one of "TEXT ONLY", "ELITE", "IMPROVING", or "ACTION NEEDED".
 */
export const mapPitchRowForDashboard = (row, index) => {
  const userName = String(row[0] || '').trim();
  const userId = String(row[1] || '').trim();
  const pitchId = String(row[2] || `ROW_${index + 1}`).trim();
  const timestamp = String(row[3] || '').trim();
  const transcript = String(row[4] || '').trim();
  const improvedPitch = String(row[5] || '').trim();
  const hasScore = hasSheetValue(row[6]);
  const score = hasScore ? toNumber(row[6]) : null;
  const summary = String(row[7] || '').trim();
  const duration = normalizeDuration(row[12]);

  return {
    id: pitchId,
    pitchId,
    userName,
    userId,
    name: getPitchName(pitchId, timestamp, transcript),
    description: truncateText(summary || transcript || improvedPitch || NO_SUMMARY_AVAILABLE),
    date: formatDate(timestamp),
    timestamp,
    persona: 'AI Pitch Coach',
    duration,
    score,
    score_analysis_available: hasScore,
    score_analysis_message: hasScore
      ? ''
      : TEXT_SCORE_ANALYSIS_MESSAGE,
    status: getStatusFromScore(score),
    transcript,
    improvedPitch,
    summary_feedback: summary,
    clarity: hasSheetValue(row[8]) ? toNumber(row[8]) : null,
    persuasiveness: hasSheetValue(row[9]) ? toNumber(row[9]) : null,
    confidence: hasSheetValue(row[10]) ? toNumber(row[10]) : null,
    narrative_flow: hasSheetValue(row[11]) ? toNumber(row[11]) : null,
    overall_score: score,
  };
};

/**
 * Filters dashboard pitches for a specific user or anonymous viewer.
 *
 * Args:
 * @param {object[]} pitches - Dashboard pitch objects to filter.
 * @param {object} [user] - User filter containing userId and/or username.
 *
 * Returns:
 * @returns {object[]} Pitches matching userId or username when provided; otherwise only anonymous pitches with no userId and no userName.
 */
export const filterPitchesForUser = (pitches, user = {}) => {
  const userId = String(user.userId || '').trim();
  const username = normalizeUsername(user.username).toLowerCase();

  if (userId || username) {
    return pitches.filter((pitch) => {
      const pitchUserId = String(pitch.userId || '').trim();
      const pitchUserName = normalizeUsername(pitch.userName).toLowerCase();

      return (
        (userId && pitchUserId === userId) ||
        (username && pitchUserName === username)
      );
    });
  }

  return pitches.filter((pitch) => !pitch.userId && !pitch.userName);
};

/**
 * Builds dashboard aggregate statistics from visible pitches.
 *
 * Args:
 * @param {object[]} pitches - Dashboard pitches visible to the current user.
 * @param {object} [options] - Stats options.
 * @param {Function|number} [options.now] - Current timestamp provider or fixed timestamp.
 *
 * Returns:
 * @returns {object} Stats object with totalPitches, avgScore, totalRecordingTime, newThisWeek, scoreBadge ("Top 5%", "Strong", or "Building"), improvementRate, and improvementLabel ("Improving", "Needs Focus", or "Steady").
 */
export const buildDashboardStats = (pitches, { now = Date.now } = {}) => {
  const currentTime = typeof now === 'function' ? now() : now;
  const totalPitches = pitches.length;
  const scoredPitches = pitches.filter((pitch) => pitch.score_analysis_available);
  const totalScore = scoredPitches.reduce((sum, pitch) => sum + pitch.score, 0);
  const avgScore = scoredPitches.length ? Math.round(totalScore / scoredPitches.length) : 0;
  const totalSeconds = pitches.reduce(
    (sum, pitch) => sum + durationToSeconds(pitch.duration),
    0
  );
  const oneWeekAgo = currentTime - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = pitches.filter((pitch) => {
    const timestamp = Date.parse(pitch.timestamp);
    return Number.isFinite(timestamp) && timestamp >= oneWeekAgo;
  }).length;
  const chronologicalPitches = [...pitches].sort(
    (a, b) => Date.parse(a.timestamp || 0) - Date.parse(b.timestamp || 0)
  );
  const chronologicalScoredPitches = chronologicalPitches.filter(
    (pitch) => pitch.score_analysis_available
  );
  const firstScore = chronologicalScoredPitches[0]?.score || 0;
  const latestScore = chronologicalScoredPitches[chronologicalScoredPitches.length - 1]?.score || 0;
  const scoreChange = chronologicalScoredPitches.length > 1 ? latestScore - firstScore : 0;

  return {
    totalPitches,
    avgScore,
    totalRecordingTime: (totalSeconds / 3600).toFixed(1),
    newThisWeek,
    scoreBadge: avgScore >= 90 ? 'Top 5%' : avgScore >= 75 ? 'Strong' : 'Building',
    improvementRate: `${scoreChange >= 0 ? '+' : ''}${scoreChange}%`,
    improvementLabel: scoreChange > 0 ? 'Improving' : scoreChange < 0 ? 'Needs Focus' : 'Steady',
  };
};
