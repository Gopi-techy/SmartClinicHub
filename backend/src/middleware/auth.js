const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * Authentication middleware to verify JWT tokens
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No valid token provided'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Get user from database
    const user = await User.findActiveById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'User not found or inactive'
      });
    }

    // Check if account is locked
    if (user.isAccountLocked) {
      logger.security('Attempt to access locked account', {
        userId: user._id,
        email: user.email,
        ip: req.ip
      });
      
      return res.status(423).json({
        error: 'Account locked',
        message: 'Account is temporarily locked due to security concerns'
      });
    }

    // Update last activity
    user.lastActivity = new Date();
    await user.save({ validateBeforeSave: false });

    // Add user to request object
    req.user = user;
    req.token = token;

    // Log successful authentication
    logger.audit('User authenticated', user._id, {
      email: user.email,
      role: user.role,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    next();
  } catch (error) {
    logger.security('Authentication failed', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Token expired'
      });
    }

    res.status(500).json({
      error: 'Authentication error',
      message: 'Internal server error during authentication'
    });
  }
};

/**
 * Authorization middleware to check user roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate first'
      });
    }

    // Flatten the roles array in case an array is passed as first argument
    const flatRoles = roles.flat();

    if (!flatRoles.includes(req.user.role)) {
      logger.security('Unauthorized access attempt', {
        userId: req.user._id,
        userRole: req.user.role,
        requiredRoles: flatRoles,
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip
      });

      return res.status(403).json({
        error: 'Access forbidden',
        message: 'Insufficient permissions for this action'
      });
    }

    next();
  };
};

/**
 * Check if user owns the resource or has admin privileges
 */
const authorizeOwnershipOrAdmin = (resourceUserField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate first'
      });
    }

    // Admin users can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params.userId || req.body[resourceUserField] || req.query[resourceUserField];
    
    if (!resourceUserId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Resource owner information missing'
      });
    }

    if (req.user._id.toString() !== resourceUserId.toString()) {
      logger.security('Unauthorized resource access attempt', {
        userId: req.user._id,
        targetResourceUser: resourceUserId,
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip
      });

      return res.status(403).json({
        error: 'Access forbidden',
        message: 'You can only access your own resources'
      });
    }

    next();
  };
};

/**
 * Check if user is a doctor with specific patient access
 */
const authorizeDoctorPatientAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate first'
      });
    }

    // Admin users can access any patient data
    if (req.user.role === 'admin') {
      return next();
    }

    // Only doctors and the patient themselves can access patient data
    if (req.user.role !== 'doctor' && req.user.role !== 'patient') {
      return res.status(403).json({
        error: 'Access forbidden',
        message: 'Only doctors and patients can access medical records'
      });
    }

    const patientId = req.params.patientId || req.params.userId || req.body.patientId;

    // If user is the patient themselves
    if (req.user.role === 'patient' && req.user._id.toString() === patientId.toString()) {
      return next();
    }

    // If user is a doctor, check if they have an appointment with this patient
    if (req.user.role === 'doctor') {
      const Appointment = require('../models/Appointment');
      
      const appointment = await Appointment.findOne({
        doctor: req.user._id,
        patient: patientId,
        status: { $in: ['scheduled', 'confirmed', 'in-progress', 'completed'] }
      });

      if (!appointment) {
        logger.security('Unauthorized patient data access attempt', {
          doctorId: req.user._id,
          patientId: patientId,
          endpoint: req.originalUrl,
          ip: req.ip
        });

        return res.status(403).json({
          error: 'Access forbidden',
          message: 'You can only access data for your patients'
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Error in doctor-patient authorization:', error);
    res.status(500).json({
      error: 'Authorization error',
      message: 'Internal server error during authorization'
    });
  }
};

/**
 * Emergency access middleware for critical situations
 */
const authorizeEmergencyAccess = async (req, res, next) => {
  try {
    const { emergencyCode, emergencyType, location } = req.body;

    if (!emergencyCode || !emergencyType) {
      return res.status(400).json({
        error: 'Emergency access denied',
        message: 'Emergency code and type are required'
      });
    }

    const EmergencyAccess = require('../models/EmergencyAccess');
    
    // Find emergency access record by QR code or verification code
    const emergencyAccess = await EmergencyAccess.findOne({
      $or: [
        { 'accessMethods.qrCode.code': emergencyCode },
        { 'ePrescription.verificationCode': emergencyCode }
      ],
      isActive: true
    }).populate('patient');

    if (!emergencyAccess) {
      logger.security('Invalid emergency access attempt', {
        emergencyCode,
        emergencyType,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(401).json({
        error: 'Emergency access denied',
        message: 'Invalid emergency access code'
      });
    }

    // Verify access based on emergency type and location
    try {
      emergencyAccess.verifyAccess('emergency', {
        emergencyType,
        location
      }, location);
    } catch (verificationError) {
      return res.status(403).json({
        error: 'Emergency access denied',
        message: verificationError.message
      });
    }

    // Log emergency access
    await emergencyAccess.logAccess(
      req.user?._id || null,
      'emergency',
      true,
      {
        emergencyType,
        location,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        dataAccessed: ['emergency_info'],
        notes: `Emergency access for ${emergencyType}`
      }
    );

    // Add emergency access info to request
    req.emergencyAccess = emergencyAccess;
    req.emergencyPatient = emergencyAccess.patient;

    logger.emergency('Emergency access granted', {
      patientId: emergencyAccess.patient._id,
      emergencyType,
      accessedBy: req.user?._id || 'anonymous',
      location,
      ip: req.ip
    });

    next();
  } catch (error) {
    logger.error('Error in emergency access authorization:', error);
    res.status(500).json({
      error: 'Emergency access error',
      message: 'Internal server error during emergency access verification'
    });
  }
};

/**
 * Rate limiting for sensitive operations
 */
const rateLimitSensitive = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip + (req.user?._id || '');
    const now = Date.now();

    // Clean up old entries
    for (const [k, v] of attempts.entries()) {
      if (now - v.timestamp > windowMs) {
        attempts.delete(k);
      }
    }

    const userAttempts = attempts.get(key) || { count: 0, timestamp: now };

    if (userAttempts.count >= maxAttempts) {
      logger.security('Rate limit exceeded for sensitive operation', {
        userId: req.user?._id,
        ip: req.ip,
        endpoint: req.originalUrl,
        attempts: userAttempts.count
      });

      return res.status(429).json({
        error: 'Too many attempts',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((windowMs - (now - userAttempts.timestamp)) / 1000)
      });
    }

    userAttempts.count += 1;
    userAttempts.timestamp = now;
    attempts.set(key, userAttempts);

    next();
  };
};

/**
 * Validate API key for external integrations
 */
const validateApiKey = (req, res, next) => {
  const apiKey = req.header('X-API-Key');

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'X-API-Key header is required for this endpoint'
    });
  }

  // In production, this would validate against a database of API keys
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];

  if (!validApiKeys.includes(apiKey)) {
    logger.security('Invalid API key attempt', {
      apiKey: apiKey.substring(0, 8) + '...',
      ip: req.ip,
      endpoint: req.originalUrl
    });

    return res.status(401).json({
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }

  next();
};

module.exports = {
  authenticate,
  authorize,
  authorizeOwnershipOrAdmin,
  authorizeDoctorPatientAccess,
  authorizeEmergencyAccess,
  rateLimitSensitive,
  validateApiKey
};
