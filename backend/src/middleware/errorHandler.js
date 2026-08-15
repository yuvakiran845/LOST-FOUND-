// Global error handler middleware
// Express calls this when next(error) is called anywhere in the app
const errorHandler = (err, req, res, next) => {
  // Log the error stack in development for debugging
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
