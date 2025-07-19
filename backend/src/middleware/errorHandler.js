const logger = require('../utils/logger');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details
  logger.error(`Error ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?._id,
    body: req.method !== 'GET' ? req.body : undefined
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = {
      message,
      statusCode: 404
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error = {
      message,
      statusCode: 400
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      message,
      statusCode: 400
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = {
      message,
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = {
      message,
      statusCode: 401
    };
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File size is too large';
    error = {
      message,
      statusCode: 400
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = {
      message,
      statusCode: 400
    };
  }

  // Database connection errors
  if (err.name === 'MongoError' || err.name === 'MongooseError') {
    const message = 'Database connection error';
    error = {
      message,
      statusCode: 500
    };
  }

  // External API errors
  if (err.isAxiosError) {
    const message = 'External service error';
    error = {
      message,
      statusCode: 502
    };
  }

  // Rate limiting errors
  if (err.statusCode === 429) {
    const message = 'Too many requests, please try again later';
    error = {
      message,
      statusCode: 429
    };
  }

  // Payment processing errors
  if (err.type === 'StripeCardError' || err.type === 'payment_error') {
    const message = err.message || 'Payment processing failed';
    error = {
      message,
      statusCode: 402
    };
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Security: Don't expose sensitive error details in production
  const errorResponse = {
    error: true,
    message: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: error
    })
  };

  // Log critical errors separately
  if (statusCode >= 500) {
    logger.error('Critical server error', {
      error: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      userId: req.user?._id,
      ip: req.ip
    });
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Handle async errors - wraps async route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Handle 404 errors for non-existent routes
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  
  logger.warn('Route not found', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  next(error);
};

/**
 * Validation error handler for express-validator
 */
const handleValidationErrors = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));
    
    logger.warn('Validation error', {
      errors: errorMessages,
      url: req.originalUrl,
      method: req.method,
      userId: req.user?._id,
      ip: req.ip
    });
    
    return res.status(400).json({
      error: true,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

/**
 * Database error handler
 */
const handleDatabaseError = (err, req, res, next) => {
  // Handle specific MongoDB errors
  if (err.name === 'MongoNetworkError') {
    logger.error('MongoDB network error', {
      error: err.message,
      url: req.originalUrl
    });
    
    return res.status(503).json({
      error: true,
      message: 'Database service temporarily unavailable'
    });
  }
  
  if (err.name === 'MongoTimeoutError') {
    logger.error('MongoDB timeout error', {
      error: err.message,
      url: req.originalUrl
    });
    
    return res.status(504).json({
      error: true,
      message: 'Database operation timed out'
    });
  }
  
  next(err);
};

/**
 * Security error handler
 */
const handleSecurityError = (err, req, res, next) => {
  // Handle authentication/authorization errors
  if (err.name === 'UnauthorizedError' || err.statusCode === 401) {
    logger.security('Unauthorized access attempt', {
      error: err.message,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(401).json({
      error: true,
      message: 'Authentication required'
    });
  }
  
  if (err.statusCode === 403) {
    logger.security('Forbidden access attempt', {
      error: err.message,
      url: req.originalUrl,
      method: req.method,
      userId: req.user?._id,
      ip: req.ip
    });
    
    return res.status(403).json({
      error: true,
      message: 'Access forbidden'
    });
  }
  
  next(err);
};

/**
 * Emergency access error handler
 */
const handleEmergencyError = (err, req, res, next) => {
  if (err.type === 'EmergencyAccessError') {
    logger.emergency('Emergency access error', {
      error: err.message,
      patientId: req.body.patientId,
      emergencyType: req.body.emergencyType,
      ip: req.ip
    });
    
    return res.status(403).json({
      error: true,
      message: 'Emergency access denied',
      details: err.message
    });
  }
  
  next(err);
};

/**
 * File upload error handler
 */
const handleFileUploadError = (err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: true,
      message: 'File size exceeds the maximum allowed limit'
    });
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      error: true,
      message: 'Too many files uploaded'
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: true,
      message: 'Unexpected file field'
    });
  }
  
  next(err);
};

/**
 * Rate limiting error handler
 */
const handleRateLimitError = (err, req, res, next) => {
  if (err.statusCode === 429) {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      userId: req.user?._id
    });
    
    return res.status(429).json({
      error: true,
      message: 'Too many requests, please try again later',
      retryAfter: err.retryAfter || 60
    });
  }
  
  next(err);
};

/**
 * Payment error handler
 */
const handlePaymentError = (err, req, res, next) => {
  if (err.type === 'StripeCardError') {
    return res.status(400).json({
      error: true,
      message: 'Payment failed',
      details: err.message
    });
  }
  
  if (err.type === 'StripeRateLimitError') {
    return res.status(429).json({
      error: true,
      message: 'Payment service rate limit exceeded'
    });
  }
  
  if (err.type === 'StripeConnectionError') {
    return res.status(503).json({
      error: true,
      message: 'Payment service temporarily unavailable'
    });
  }
  
  next(err);
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFound,
  handleValidationErrors,
  handleDatabaseError,
  handleSecurityError,
  handleEmergencyError,
  handleFileUploadError,
  handleRateLimitError,
  handlePaymentError
};
