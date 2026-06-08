import { useCallback, useRef, useState } from "react";

import { analyzeRecordedAudio } from "./microphone/audioAnalysis";
import { COULD_NOT_CONNECT_TO_SERVER } from "../constants/messages";
import {
  createAudioBlob,
  createPitchMediaRecorder,
  stopStreamTracks,
} from "./microphone/mediaRecorder";
import {
  getRecordingErrorMessage,
  getUnsupportedRecordingMessage,
} from "./microphone/recordingErrors";
import { useRecordingTimer } from "./microphone/useRecordingTimer";
import { useWaveformVisualizer } from "./microphone/useWaveformVisualizer";
import { logError, logWarn } from "../utils/logger";

export function useMicrophone({ onAnalysisComplete, onError } = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const {
    timeElapsed,
    formatTime,
    startTimer,
    stopTimer,
  } = useRecordingTimer();
  const {
    canvasRef,
    startWaveform,
    stopWaveform,
  } = useWaveformVisualizer();

  const cleanupRecording = useCallback(() => {
    stopTimer();
    stopWaveform();
    stopStreamTracks(streamRef.current);
    streamRef.current = null;
    mediaRecorderRef.current = null;
    setIsRecording(false);
  }, [stopTimer, stopWaveform]);

  const sendAudio = useCallback(
    async (audioBlob) => {
      setIsAnalyzing(true);

      try {
        const data = await analyzeRecordedAudio(audioBlob);
        onAnalysisComplete?.(data);
      } catch (error) {
        logError("sendAudio error:", error);
        onError?.(error.message || COULD_NOT_CONNECT_TO_SERVER);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [onAnalysisComplete, onError]
  );

  const startRecording = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        onError?.(getUnsupportedRecordingMessage());
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = createPitchMediaRecorder(stream, {
        onChunk: (audioChunk) => {
          audioChunksRef.current.push(audioChunk);
        },
        onStop: async () => {
          const audioBlob = createAudioBlob(audioChunksRef.current);

          cleanupRecording();
          await sendAudio(audioBlob);
        },
        onError: (event) => {
          logError("MediaRecorder error:", event.error);
        },
      });

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250);
      setIsRecording(true);
      startTimer();

      requestAnimationFrame(() => {
        try {
          startWaveform(stream);
        } catch (waveformError) {
          logWarn("Waveform visualization unavailable:", waveformError);
        }
      });
    } catch (error) {
      logError("Recording start error:", error);
      cleanupRecording();
      onError?.(getRecordingErrorMessage(error));
    }
  }, [
    cleanupRecording,
    onError,
    sendAudio,
    startTimer,
    startWaveform,
  ]);

  const stopRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  }, []);

  return {
    isRecording,
    timeElapsed,
    isAnalyzing,
    formatTime,
    startRecording,
    stopRecording,
    canvasRef,
  };
}
