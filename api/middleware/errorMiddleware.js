// Not Found middleware
export const notFound = (req, res, next) => {
  const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global Error Handler
export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false, // explicitly say request failed
    statusCode,     // helpful for frontend
    error: {
      message: err.message,
      // stack trace only in dev (helps debugging, hides in prod)
      stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    },
  });
};
