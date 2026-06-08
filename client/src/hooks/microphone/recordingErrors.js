export const getRecordingErrorMessage = (error) => {
  if (error?.name === "NotAllowedError") {
    return "Microphone permission denied. Please allow microphone access in your browser settings.";
  }

  if (error?.name === "NotFoundError") {
    return "No microphone found. Please connect a microphone and try again.";
  }

  if (error?.name === "NotReadableError") {
    return "Microphone is in use by another application. Please close other apps using your microphone.";
  }

  return "Could not access microphone";
};

export const getUnsupportedRecordingMessage = () => (
  "Your browser does not support audio recording. Please use Chrome, Firefox, Edge, or Safari."
);
