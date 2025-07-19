const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

const { authenticate, authorize } = require('../middleware/auth');
const { 
  validateUserRegistration, 
  validateUserLogin, 
  validatePasswordChange,
  validateEmail,
  handleValidationErrors 
} = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', 
  validateUserRegistration,
  handleValidationErrors,
  asyncHandler(register)
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', 
  validateUserLogin,
  handleValidationErrors,
  asyncHandler(login)
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', 
  authenticate,
  asyncHandler(logout)
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', 
  authenticate,
  asyncHandler(getMe)
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Forgot password
 * @access  Public
 */
router.post('/forgot-password', 
  validateEmail,
  handleValidationErrors,
  asyncHandler(forgotPassword)
);

/**
 * @route   PUT /api/auth/reset-password/:token
 * @desc    Reset password
 * @access  Public
 */
router.put('/reset-password/:token', 
  validatePasswordChange,
  handleValidationErrors,
  asyncHandler(resetPassword)
);

module.exports = router;
