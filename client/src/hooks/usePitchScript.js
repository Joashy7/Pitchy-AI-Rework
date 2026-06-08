import { useMemo, useState } from "react";

const AVERAGE_WORDS_PER_MINUTE = 130;

const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length;

const estimateSpeakingTime = (wordCount) => {
  const totalSeconds = Math.round((wordCount / AVERAGE_WORDS_PER_MINUTE) * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const usePitchScript = () => {
  const [scriptText, setScriptText] = useState("");
  const wordCount = useMemo(() => countWords(scriptText), [scriptText]);
  const estimatedTime = useMemo(() => estimateSpeakingTime(wordCount), [wordCount]);

  return {
    scriptText,
    setScriptText,
    wordCount,
    estimatedTime,
  };
};
