import { useState } from "react";

import { COULD_NOT_GENERATE_PITCH_AUDIO } from "../constants/messages";
import { generatePitchAudio } from "../lib/api";
import { logError } from "../utils/logger";

/**
 * Manages text-to-speech generation and playback for pitch transcripts.
 *
 * Args:
 * @param {object} [options] - Hook options.
 * @param {Function} [options.onError] - Called with user-facing error text when audio generation fails.
 *
 * Returns:
 * @returns {object} Audio generation state and controls with isGeneratingAudio and playPitchAudio.
 */
export const usePitchAudio = ({ onError } = {}) => {
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  const playPitchAudio = async (transcript) => {
    if (!transcript) return;

    setIsGeneratingAudio(true);
    try {
      const result = await generatePitchAudio(transcript);

      if (result.audioUrl) {
        const audio = new Audio(result.audioUrl);
        audio.play();
      }
    } catch (error) {
      logError("TTS error:", error);
      onError?.(error.message || COULD_NOT_GENERATE_PITCH_AUDIO);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  return {
    isGeneratingAudio,
    playPitchAudio,
  };
};
