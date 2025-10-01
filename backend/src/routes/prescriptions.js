const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const prescriptionController = require('../controllers/prescriptionController');

// Middleware to check if user is a doctor
const isDoctor = (req, res, next) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Only doctors can perform this action.' 
    });
  }
  next();
};

// Create a new prescription (only doctors)
router.post(
  '/',
  auth,
  isDoctor,
  [
    body('patient').notEmpty().withMessage('Patient ID is required'),
    body('diagnosis').optional(),
    body('medications').isArray().withMessage('Medications must be an array'),
    body('medications.*.name').notEmpty().withMessage('Medication name is required'),
    body('medications.*.strength').notEmpty().withMessage('Medication strength is required'),
    body('medications.*.dosage').notEmpty().withMessage('Dosage is required'),
    body('medications.*.frequency').notEmpty().withMessage('Frequency is required'),
    body('medications.*.durationValue').isNumeric().withMessage('Duration value must be a number'),
    body('medications.*.durationUnit').isIn(['days', 'weeks', 'months']).withMessage('Duration unit must be days, weeks, or months'),
    body('medications.*.instructions').notEmpty().withMessage('Instructions are required'),
    body('medications.*.quantity').isNumeric().withMessage('Quantity must be a number'),
    body('medications.*.quantityUnit').notEmpty().withMessage('Quantity unit is required'),
  ],
  prescriptionController.createPrescription
);

// Get all prescriptions (admin only)
router.get('/all', auth, (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'doctor') {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  next();
}, prescriptionController.getAllPrescriptions);

// Get prescription by ID
router.get('/:id', auth, prescriptionController.getPrescriptionById);

// Get prescriptions for a specific patient
router.get('/patient/:patientId', auth, prescriptionController.getPatientPrescriptions);

// Get prescriptions written by a specific doctor
router.get('/doctor/:doctorId', auth, prescriptionController.getDoctorPrescriptions);

// Update a prescription (only the doctor who created it or admin)
router.put('/:id', auth, prescriptionController.updatePrescription);

// Cancel a prescription
router.put('/:id/cancel', auth, prescriptionController.cancelPrescription);

// Verify a prescription using verification code
router.get('/verify/:code', prescriptionController.verifyPrescription);

module.exports = router;