export const createEngineError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const getErrorStatusCode = (error = {}) => error.statusCode || 500;
