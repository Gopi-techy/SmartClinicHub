const express = require('express');
const {
  bookAppointment,
  getAppointments,
  updateAppointmentStatus,
  getAppointmentById,
  getDoctorPatients,
  getAllPatients,
  cancelAppointment,
  getAvailableSlots,
  getAppointmentStats
} = require('../controllers/appointmentController');

const { authenticate, authorize } = require('../middleware/auth');
const { 
  validateAppointmentBooking, 
  validateObjectId, 
  validateSearch,
  handleValidationErrors 
} = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @route   POST /api/appointments/book
 * @desc    Book a new appointment
 * @access  Private (Patient)
 */
router.post('/book',
  authenticate,
  authorize('patient'),
  validateAppointmentBooking,
  handleValidationErrors,
  asyncHandler(bookAppointment)
);

/**
 * @route   GET /api/appointments
 * @desc    Get appointments for a user
 * @access  Private
 */
router.get('/',
  authenticate,
  validateSearch,
  handleValidationErrors,
  asyncHandler(getAppointments)
);

/**
 * @route   GET /api/appointments/doctor/all-patients
 * @desc    Get all registered patients in the system
 * @access  Private (Doctor)
 */
router.get('/doctor/all-patients',
  authenticate,
  authorize('doctor'),
  asyncHandler(getAllPatients)
);

/**
 * @route   GET /api/appointments/doctor/patients
 * @desc    Get all appointments for a doctor
 * @access  Private (Doctor)
 */
router.get('/doctor/patients',
  authenticate,
  authorize('doctor'),
  asyncHandler(getDoctorPatients)
);

/**
 * @route   GET /api/appointments/stats
 * @desc    Get appointment statistics for dashboard
 * @access  Private
 */
router.get('/stats',
  authenticate,
  asyncHandler(getAppointmentStats)
);

/**
 * @route   GET /api/appointments/doctor/:doctorId/slots/:date
 * @desc    Get available time slots for a doctor on a specific date
 * @access  Private
 */
router.get('/doctor/:doctorId/slots/:date',
  authenticate,
  asyncHandler(getAvailableSlots)
);

/**
 * @route   GET /api/appointments/:id
 * @desc    Get appointment by ID
 * @access  Private
 */
router.get('/:id',
  authenticate,
  validateObjectId,
  handleValidationErrors,
  asyncHandler(getAppointmentById)
);

/**
 * @route   PUT /api/appointments/:id/status
 * @desc    Update appointment status
 * @access  Private
 */
router.put('/:id/status',
  authenticate,
  validateObjectId,
  handleValidationErrors,
  asyncHandler(updateAppointmentStatus)
);

/**
 * @route   DELETE /api/appointments/:id
 * @desc    Cancel appointment
 * @access  Private
 */
router.delete('/:id',
  authenticate,
  validateObjectId,
  handleValidationErrors,
  asyncHandler(cancelAppointment)
);

module.exports = router;
