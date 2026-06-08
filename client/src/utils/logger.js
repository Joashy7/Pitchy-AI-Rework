const isClientLoggingEnabled =
  import.meta.env?.DEV || import.meta.env?.VITE_PITCHY_DEBUG === "true";

export const logError = (...args) => {
  if (isClientLoggingEnabled) {
    console.error(...args);
  }
};

export const logWarn = (...args) => {
  if (isClientLoggingEnabled) {
    console.warn(...args);
  }
};
