/**
 * Centralized error-handling middleware.
 * Formats errors to match client's ApiErrorResponse expectation:
 * { error: string, statusCode?: number, isRateLimit?: boolean, resetAt?: string }
 */
export const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const message = err.message || 'An unexpected internal server error occurred.';

  res.status(statusCode).json({
    error: message,
    statusCode,
    ...(err.isRateLimit ? { isRateLimit: true, resetAt: err.resetAt } : {}),
  });
};

/**
 * 404 Not Found fallback handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: `Resource not found: ${req.method} ${req.originalUrl}`,
    statusCode: 404,
  });
};
