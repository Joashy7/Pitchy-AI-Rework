/**
 * Stops all tracks in a media stream.
 *
 * Args:
 * @param {MediaStream|null|undefined} stream - Active microphone stream to stop.
 *
 * Returns:
 * @returns {void} Does not return a value.
 */
export const stopStreamTracks = (stream) => {
  stream?.getTracks().forEach((track) => track.stop());
};

/**
 * Builds the recorded audio Blob from MediaRecorder chunks.
 *
 * Args:
 * @param {BlobPart[]} audioChunks - Audio data chunks emitted by MediaRecorder.
 *
 * Returns:
 * @returns {Blob} WebM audio blob ready to upload for analysis.
 */
export const createAudioBlob = (audioChunks) => (
  new Blob(audioChunks, { type: "audio/webm" })
);

/**
 * Creates and wires the MediaRecorder used for pitch recording.
 *
 * Args:
 * @param {MediaStream} stream - Microphone stream to record.
 * @param {object} handlers - MediaRecorder event handlers.
 * @param {Function} handlers.onChunk - Called with each non-empty audio chunk.
 * @param {Function} handlers.onStop - Called when recording stops.
 * @param {Function} handlers.onError - Called when the recorder emits an error.
 *
 * Returns:
 * @returns {MediaRecorder} Configured MediaRecorder instance.
 */
export const createPitchMediaRecorder = (
  stream,
  {
    onChunk,
    onStop,
    onError,
  }
) => {
  const mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      onChunk(event.data);
    }
  };

  mediaRecorder.onstop = onStop;
  mediaRecorder.onerror = onError;

  return mediaRecorder;
};
