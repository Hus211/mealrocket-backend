/**
 * Async handler function to eliminate try-catch blocks in route handlers
 * @param {Function} fn - Express route handler function
 * @returns {Function} - Enhanced route handler with error handling
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
  
  module.exports = asyncHandler;