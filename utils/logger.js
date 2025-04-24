const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Log file paths
const accessLogPath = path.join(logsDir, 'access.log');
const errorLogPath = path.join(logsDir, 'error.log');

/**
 * Log levels
 */
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

/**
 * Format the current date and time for logging
 * @returns {String} Formatted date and time
 */
const getTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Format a log message with timestamp, level, and additional info
 * @param {String} level - Log level
 * @param {String} message - Log message
 * @param {Object} meta - Additional metadata
 * @returns {String} Formatted log message
 */
const formatLogMessage = (level, message, meta = {}) => {
  return `[${getTimestamp()}] [${level}] ${message} ${
    Object.keys(meta).length ? JSON.stringify(meta) : ''
  }\n`;
};

/**
 * Write a message to the specified log file
 * @param {String} filePath - Path to log file
 * @param {String} message - Message to log
 */
const writeToLogFile = (filePath, message) => {
  fs.appendFile(filePath, message, (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });
};

/**
 * Log an error message
 * @param {String} message - Error message
 * @param {Object} meta - Additional metadata
 */
const error = (message, meta = {}) => {
  const logMessage = formatLogMessage(LOG_LEVELS.ERROR, message, meta);
  
  console.error(logMessage);
  writeToLogFile(errorLogPath, logMessage);
};

/**
 * Log a warning message
 * @param {String} message - Warning message
 * @param {Object} meta - Additional metadata
 */
const warn = (message, meta = {}) => {
  const logMessage = formatLogMessage(LOG_LEVELS.WARN, message, meta);
  
  console.warn(logMessage);
  writeToLogFile(errorLogPath, logMessage);
};

/**
 * Log an info message
 * @param {String} message - Info message
 * @param {Object} meta - Additional metadata
 */
const info = (message, meta = {}) => {
  const logMessage = formatLogMessage(LOG_LEVELS.INFO, message, meta);
  
  console.log(logMessage);
  writeToLogFile(accessLogPath, logMessage);
};

/**
 * Log a debug message (only in development)
 * @param {String} message - Debug message
 * @param {Object} meta - Additional metadata
 */
const debug = (message, meta = {}) => {
  // Only log debug messages in development
  if (process.env.NODE_ENV !== 'production') {
    const logMessage = formatLogMessage(LOG_LEVELS.DEBUG, message, meta);
    
    console.log(logMessage);
    writeToLogFile(accessLogPath, logMessage);
  }
};

/**
 * Log HTTP request information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Number} responseTime - Response time in milliseconds
 */
const httpRequest = (req, res, responseTime) => {
  const meta = {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.headers['user-agent']
  };

  // Add user ID if authenticated
  if (req.user && req.user._id) {
    meta.userId = req.user._id.toString();
  }

  info(`HTTP ${req.method} ${req.originalUrl || req.url}`, meta);
};

module.exports = {
  error,
  warn,
  info,
  debug,
  httpRequest
};