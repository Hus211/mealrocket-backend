/**
 * Utility function to standardize API responses
 */

/**
 * Creates a success response object
 * @param {Object} data - The data to include in the response
 * @param {String} message - Optional success message
 * @param {Number} statusCode - HTTP status code
 * @returns {Object} Formatted success response
 */
const successResponse = (data, message = 'Operation successful', statusCode = 200) => {
    return {
      success: true,
      statusCode,
      message,
      data: data || null
    };
  };
  
  /**
   * Creates an error response object
   * @param {String} message - Error message
   * @param {Number} statusCode - HTTP status code
   * @param {Object} errors - Optional detailed error information
   * @returns {Object} Formatted error response
   */
  const errorResponse = (message = 'An error occurred', statusCode = 500, errors = null) => {
    return {
      success: false,
      statusCode,
      message,
      errors: errors || null
    };
  };
  
  module.exports = {
    successResponse,
    errorResponse
  };