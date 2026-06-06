const errorMiddleware = (err, req, res, next) => {
  console.error("Error caught by middleware:", err);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // Check if we are in development or production
  // For now, keep it simple
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

export default errorMiddleware;
