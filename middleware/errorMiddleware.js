/**
 * Handle 404 errors for routes that don't exist
 */
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
  };
  
  /**
   * Global error handler for all errors thrown in the application
   */
  const errorHandler = (err, req, res, next) => {
    // If status code is 200, set it to 500 (Server Error)
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    // Set status code
    res.status(statusCode);
    
    // Send error response
    res.json({
      success: false,
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
  };
  
  module.exports = { notFound, errorHandler };