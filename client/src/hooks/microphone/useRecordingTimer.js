import { useCallback, useRef, useState } from "react";

export const formatRecordingTime = (seconds) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
};

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
