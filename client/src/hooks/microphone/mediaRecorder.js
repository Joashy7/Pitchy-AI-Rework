export const stopStreamTracks = (stream) => {
  stream?.getTracks().forEach((track) => track.stop());
};

export const createAudioBlob = (audioChunks) => (
  new Blob(audioChunks, { type: "audio/webm" })
);

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
