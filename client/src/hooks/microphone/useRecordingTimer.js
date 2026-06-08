import { useCallback, useRef, useState } from "react";

/**
 * Formats recording elapsed seconds as mm:ss.
 *
 * Args:
 * @param {number} seconds - Elapsed recording time in seconds.
 *
 * Returns:
 * @returns {string} Time string formatted as "mm:ss".
 */
export const formatRecordingTime = (seconds) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
};

/**
 * Tracks recording elapsed time for the microphone UI.
 *
 * Args:
 * None.
 *
 * Returns:
 * @returns {object} Timer state and controls with timeElapsed, formatTime, startTimer, and stopTimer.
 */
export const useRecordingTimer = () => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const timerIntervalRef = useRef(null);

  const startTimer = useCallback(() => {
    setTimeElapsed(0);
    timerIntervalRef.current = setInterval(() => {
      setTimeElapsed((previousTime) => previousTime + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (!timerIntervalRef.current) return;

    clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
  }, []);

  return {
    timeElapsed,
    formatTime: formatRecordingTime,
    startTimer,
    stopTimer,
  };
};
