const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error(`${error.message} - stack: ${error.stack}`);
  } else {
    console.warn(error.message);
  }

  return res.status(statusCode).json({
    error: error.message || "Internal server error",
    code: error.code || "INTERNAL_SERVER_ERROR",
    details: error.details || {},
  });
};

export { errorHandler };