import { toText } from './text.js';

/**
 * Normalizes feedback items from the AI response.
 *
 * Args:
 * @param {unknown} items - Raw feedback item array from the analysis response.
 *
 * Returns:
 * @returns {Array<{timestamp: string, quote: string, explanation: string}>} Normalized feedback items; returns [] for non-arrays and filters out empty items.
 */
export const normalizeFeedbackItems = (items) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => ({
      timestamp: toText(item?.timestamp, '00:00'),
      quote: toText(item?.quote),
      explanation: toText(item?.explanation),
    }))
    .filter((item) => item.quote || item.explanation);
};

/**
 * Normalizes change records from the AI response.
 *
 * Args:
 * @param {unknown} changes - Raw changes_made array from the analysis response.
 *
 * Returns:
 * @returns {Array<{area: string, original: string, improved: string, reason: string}>} Normalized change records; returns [] for non-arrays and filters out empty changes.
 */
export const normalizeChanges = (changes) => {
  if (!Array.isArray(changes)) return [];

  return changes
    .map((change) => ({
      area: toText(change?.area),
      original: toText(change?.original),
      improved: toText(change?.improved),
      reason: toText(change?.reason),
    }))
    .filter((change) => (
      change.area ||
      change.original ||
      change.improved ||
      change.reason
    ));
};

/**
 * Normalizes sentence or section modification regions from the AI response.
 *
 * Args:
 * @param {unknown} regions - Raw modification_regions array from the analysis response.
 *
 * Returns:
 * @returns {Array<{timestamp: string, section: string, original: string, issue: string, suggested_edit: string, reason: string}>} Normalized modification regions; returns [] for non-arrays and filters out empty regions.
 */
export const normalizeModificationRegions = (regions) => {
  if (!Array.isArray(regions)) return [];

  return regions
    .map((region) => ({
      timestamp: toText(region?.timestamp, '00:00'),
      section: toText(region?.section),
      original: toText(region?.original),
      issue: toText(region?.issue),
      suggested_edit: toText(region?.suggested_edit ?? region?.suggestedEdit),
      reason: toText(region?.reason),
    }))
    .filter((region) => (
      region.section ||
      region.original ||
      region.issue ||
      region.suggested_edit ||
      region.reason
    ));
};
