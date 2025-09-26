const { body, param, query, validationResult } = require('express-validator');
const User = require('../models/User');

/**
 * User registration validation
 */
const validateUserRegistration = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),

  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .custom(async (email) => {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('Email is already registered');
      }
      return true;
    }),

  body('phone')
    .matches(/^[+]?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number (digits only, 2-15 characters)')
    .custom(async (phone) => {
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        throw new Error('Phone number is already registered');
      }
      return true;
    }),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  body('role')
    .optional()
    .isIn(['patient', 'doctor', 'admin', 'pharmacy'])
    .withMessage('Invalid role specified'),

  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth')
    .custom((value) => {
      const today = new Date();
      const birthDate = new Date(value);
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13 || age > 120) {
        throw new Error('Age must be between 13 and 120 years');
      }
      return true;
    }),

  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Invalid gender specified')
];

/**
 * User login validation
 */
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * User profile update validation
 */
const validateUserUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),

  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),

  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),

  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Invalid gender specified')
];

/**
 * Password change validation
 */
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    })
];

/**
 * Appointment booking validation
 */
const validateAppointmentBooking = [
  body('doctorId')
    .isMongoId()
    .withMessage('Invalid doctor ID')
    .custom(async (doctorId) => {
      const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true });
      if (!doctor) {
        throw new Error('Doctor not found or inactive');
      }
      return true;
    }),

  body('appointmentDate')
    .isISO8601()
    .withMessage('Please provide a valid appointment date')
    .custom((value) => {
      const appointmentDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (appointmentDate < today) {
        throw new Error('Appointment date cannot be in the past');
      }
      
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 90); // 90 days in advance
      
      if (appointmentDate > maxDate) {
        throw new Error('Appointments can only be booked up to 90 days in advance');
      }
      
      return true;
    }),

  body('startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid start time in HH:MM format'),

  body('endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid end time in HH:MM format')
    .custom((value, { req }) => {
      const startTime = req.body.startTime;
      if (startTime && value <= startTime) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),

  body('type')
    .optional()
    .isIn(['consultation', 'follow-up', 'emergency', 'routine-checkup', 'lab-review', 'vaccination'])
    .withMessage('Invalid appointment type'),

  body('mode')
    .optional()
    .isIn(['online', 'in-person', 'hybrid'])
    .withMessage('Invalid appointment mode'),

  body('symptoms')
    .optional()
    .isArray()
    .withMessage('Symptoms must be an array'),

  body('urgencyLevel')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid urgency level')
];

/**
 * Prescription validation
 */
const validatePrescription = [
  body('patientId')
    .isMongoId()
    .withMessage('Invalid patient ID'),

  body('medications')
    .isArray({ min: 1 })
    .withMessage('At least one medication is required'),

  body('medications.*.name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Medication name must be between 2 and 100 characters'),

  body('medications.*.strength')
    .trim()
    .notEmpty()
    .withMessage('Medication strength is required'),

  body('medications.*.dosage')
    .trim()
    .notEmpty()
    .withMessage('Medication dosage is required'),

  body('medications.*.frequency')
    .isIn(['once_daily', 'twice_daily', 'thrice_daily', 'four_times_daily', 
           'every_4_hours', 'every_6_hours', 'every_8_hours', 'every_12_hours',
           'as_needed', 'before_meals', 'after_meals', 'at_bedtime', 'custom'])
    .withMessage('Invalid medication frequency'),

  body('medications.*.duration.value')
    .isInt({ min: 1, max: 365 })
    .withMessage('Duration value must be between 1 and 365'),

  body('medications.*.duration.unit')
    .isIn(['days', 'weeks', 'months'])
    .withMessage('Invalid duration unit'),

  body('medications.*.quantity.prescribed')
    .isInt({ min: 1 })
    .withMessage('Prescribed quantity must be a positive integer'),

  body('diagnosis.primary')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Primary diagnosis must be between 5 and 200 characters')
];

/**
 * Emergency access validation
 */
const validateEmergencyAccess = [
  body('emergencyCode')
    .notEmpty()
    .withMessage('Emergency code is required')
    .isLength({ min: 6 })
    .withMessage('Emergency code must be at least 6 characters'),

  body('emergencyType')
    .isIn(['cardiac_arrest', 'stroke', 'severe_bleeding', 'breathing_difficulty', 
           'allergic_reaction', 'diabetic_emergency', 'seizure', 'trauma', 'poisoning', 'other'])
    .withMessage('Invalid emergency type'),

  body('location')
    .optional()
    .isObject()
    .withMessage('Location must be an object'),

  body('location.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),

  body('location.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),

  body('accessLevel')
    .optional()
    .isIn(['basic', 'medical', 'full'])
    .withMessage('Invalid access level')
];

/**
 * File upload validation
 */
const validateFileUpload = [
  body('fileType')
    .optional()
    .isIn(['image', 'document', 'medical_report', 'prescription', 'lab_result'])
    .withMessage('Invalid file type'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

/**
 * Search validation
 */
const validateSearch = [
  query('query')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sortBy')
    .optional()
    .isIn(['name', 'date', 'rating', 'fee', 'price', 'distance'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

/**
 * Doctor availability validation
 */
const validateDoctorAvailability = [
  body('availableSlots')
    .isArray()
    .withMessage('Available slots must be an array'),

  body('availableSlots.*.day')
    .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Invalid day'),

  body('availableSlots.*.startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid start time format'),

  body('availableSlots.*.endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid end time format')
];

/**
 * MongoDB ObjectId validation
 */
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`)
];

/**
 * Date range validation
 */
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (req.query.startDate && value <= req.query.startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
];

/**
 * Phone number validation
 */
const validatePhoneNumber = [
  body('phone')
    .matches(/^[+]?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number')
];

/**
 * Email validation
 */
const validateEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));
    
    return res.status(400).json({
      error: true,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validatePasswordChange,
  validateAppointmentBooking,
  validatePrescription,
  validateEmergencyAccess,
  validateFileUpload,
  validateSearch,
  validateDoctorAvailability,
  validateObjectId,
  validateDateRange,
  validatePhoneNumber,
  validateEmail,
  handleValidationErrors
};
