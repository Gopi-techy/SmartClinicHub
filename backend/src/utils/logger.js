const winston = require('winston');
const path = require('path');

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'smartclinic-backend' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),

    // Combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),

    // Console output
    new winston.transports.Console({
      format: consoleFormat
    })
  ],

  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      format: fileFormat
    })
  ],

  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      format: fileFormat
    })
  ]
});

// Production-specific logging
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'production.log'),
    level: 'warn',
    format: fileFormat
  }));
}

// Development-specific logging
if (process.env.NODE_ENV === 'development') {
  logger.level = 'debug';
}

// Custom log methods for specific use cases
logger.audit = (action, userId, details) => {
  logger.info('AUDIT', {
    action,
    userId,
    details,
    timestamp: new Date().toISOString()
  });
};

logger.security = (event, details) => {
  logger.warn('SECURITY', {
    event,
    details,
    timestamp: new Date().toISOString()
  });
};

logger.emergency = (event, details) => {
  logger.error('EMERGENCY', {
    event,
    details,
    timestamp: new Date().toISOString()
  });
};

module.exports = logger;
