import { useEffect, useState } from "react";

import { getDashboardData } from "../lib/api";
import { FAILED_DASHBOARD_DATA } from "../constants/messages";
import { getAuthenticatedUser } from "../utils/auth";
import { logError } from "../utils/logger";

export const DEFAULT_DASHBOARD_STATS = {
  totalPitches: 0,
  avgScore: 0,
  totalRecordingTime: "0.0",
  newThisWeek: 0,
  scoreBadge: "Building",
  improvementRate: "+0%",
  improvementLabel: "Steady",
};

const buildDashboardQuery = () => {
  const currentUser = getAuthenticatedUser();
  const queryParams = new URLSearchParams();

  if (currentUser?.userId) {
    queryParams.set("userId", currentUser.userId);
  }

  if (currentUser?.username) {
    queryParams.set("username", currentUser.username);
  }

  return queryParams;
};

/**
 * Loads and exposes dashboard pitch history and aggregate stats.
 *
 * Args:
 * None.
 *
 * Returns:
 * @returns {object} Dashboard state with pitchData, dashboardStats, isLoading, and error.
 */
export const useDashboardData = () => {
  const [pitchData, setPitchData] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(DEFAULT_DASHBOARD_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadDashboardData = async () => {
      try {
        const result = await getDashboardData(buildDashboardQuery());

        if (isActive) {
          setPitchData(Array.isArray(result.pitches) ? result.pitches : []);
          setDashboardStats({
            ...DEFAULT_DASHBOARD_STATS,
            ...(result.stats || {}),
          });
          setError("");
        }
      } catch (loadError) {
        logError("Dashboard data error:", loadError);

        if (isActive) {
          setError(loadError.message || FAILED_DASHBOARD_DATA);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isActive = false;
    };
  }, []);

  return {
    pitchData,
    dashboardStats,
    isLoading,
    error,
  };
};
