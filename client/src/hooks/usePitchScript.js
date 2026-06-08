import { useMemo, useState } from "react";

const AVERAGE_WORDS_PER_MINUTE = 130;

/**
 * Counts spoken words in pitch script text.
 *
 * Args:
 * @param {string} text - Script text to count.
 *
 * Returns:
 * @returns {number} Number of non-empty whitespace-delimited words.
 */
const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length;

/**
 * Estimates speaking time for a word count.
 *
 * Args:
 * @param {number} wordCount - Number of words in the script.
 *
 * Returns:
 * @returns {string} Estimated speaking duration formatted as "m:ss".
 */
const estimateSpeakingTime = (wordCount) => {
  const totalSeconds = Math.round((wordCount / AVERAGE_WORDS_PER_MINUTE) * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

/**
 * Tracks typed pitch script text, word count, and estimated speaking time.
 *
 * Args:
 * None.
 *
 * Returns:
 * @returns {object} Script state and setters with scriptText, setScriptText, wordCount, and estimatedTime.
 */
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
