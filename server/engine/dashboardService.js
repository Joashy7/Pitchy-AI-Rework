import * as defaultStorage from '../storage.js';

/**
 * Creates the dashboard service that delegates dashboard loading to storage.
 *
 * Args:
 * @param {object} [options] - Dashboard service dependencies.
 * @param {object} [options.storageClient] - Storage facade with getDashboardData.
 *
 * Returns:
 * @returns {object} Dashboard service with getDashboardData, which resolves to success true with pitches and stats or success false with error, empty pitches, and empty stats.
 */
export const createDashboardService = ({
  storageClient = defaultStorage,
} = {}) => ({
  getDashboardData: async (user = {}) => storageClient.getDashboardData(user),
});

const defaultDashboardService = createDashboardService();

/**
 * Loads dashboard data through the default dashboard service.
 *
 * Args:
 * @param {...unknown} args - Arguments forwarded to the default dashboard service getDashboardData function.
 *
 * Returns:
 * @returns {Promise<object>} Dashboard result with success true, pitches, and stats; or success false with error, empty pitches, and empty stats.
 */
export const getDashboardData = (...args) => (
  defaultDashboardService.getDashboardData(...args)
);
