import {
  buildDashboardStats,
  filterPitchesForUser,
  mapPitchRowForDashboard,
} from './dashboardMapper.js';
import * as defaultPitchesRepository from './pitchesRepository.js';
import { logError } from '../logger.js';

/**
 * Creates the dashboard repository that maps stored pitch rows into dashboard data.
 *
 * Args:
 * @param {object} [options] - Dashboard repository dependencies.
 * @param {object} [options.pitchesRepository] - Pitch repository with getPitchRows and isPitchRow.
 * @param {Function|number} [options.now] - Current timestamp provider or fixed timestamp for stats.
 * @param {object} [options.logger] - Logger with logError function.
 *
 * Returns:
 * @returns {object} Dashboard repository with getDashboardData, returning success true with pitches/stats or success false with error, empty pitches, and empty stats.
 */
export const createDashboardRepository = ({
  pitchesRepository = defaultPitchesRepository,
  now = Date.now,
  logger = { logError },
} = {}) => {
  /**
   * Loads dashboard pitches and stats for a user.
   *
   * Args:
   * @param {object} [user] - User filter with userId and/or username; empty object returns anonymous pitches.
   *
   * Returns:
   * @returns {Promise<object>} Success true with filtered pitches and stats; or success false with error, empty pitches, and empty stats when loading fails.
   */
  const getDashboardData = async (user = {}) => {
    try {
      const rows = await pitchesRepository.getPitchRows();
      const allPitches = rows
        .filter(pitchesRepository.isPitchRow)
        .map(mapPitchRowForDashboard)
        .sort((a, b) => Date.parse(b.timestamp || 0) - Date.parse(a.timestamp || 0));
      const pitches = filterPitchesForUser(allPitches, user);

      return {
        success: true,
        pitches,
        stats: buildDashboardStats(pitches, { now }),
      };
    } catch (error) {
      logger.logError('Error loading dashboard data:', error.message);
      return {
        success: false,
        error: error.message,
        pitches: [],
        stats: buildDashboardStats([], { now }),
      };
    }
  };

  return {
    getDashboardData,
  };
};

const defaultDashboardRepository = createDashboardRepository();

/**
 * Loads dashboard data through the default dashboard repository.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default getDashboardData function.
 *
 * Returns:
 * @returns {Promise<object>} Dashboard result with success true, pitches, and stats; or success false with error, empty pitches, and empty stats.
 */
export const getDashboardData = (...args) => (
  defaultDashboardRepository.getDashboardData(...args)
);
