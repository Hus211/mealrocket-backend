const { validationResult } = require('express-validator');

/**
 * Middleware to validate request data using express-validator
 * @param {Array} validations - Array of validation rules
 * @returns {Function} Middleware function
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Execute all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format errors for response
    const formattedErrors = errors.array().reduce((acc, error) => {
      if (!acc[error.param]) {
        acc[error.param] = [];
      }
      acc[error.param].push(error.msg);
      return acc;
    }, {});

    // Return validation errors
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  };
};

module.exports = { validate };