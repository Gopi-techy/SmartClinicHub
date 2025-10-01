const Prescription = require('../models/Prescription');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { validationResult } = require('express-validator');

// Create a new prescription
exports.createPrescription = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Check if doctor exists
    const doctor = await User.findById(req.body.doctor);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID provided.'
      });
    }

    // Check if patient exists
    const patient = await User.findById(req.body.patient);
    if (!patient) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID provided.'
      });
    }

    // Check if appointment exists if provided
    if (req.body.appointment) {
      const appointment = await Appointment.findById(req.body.appointment);
      if (!appointment) {
        return res.status(400).json({
          success: false,
          message: 'Invalid appointment ID provided.'
        });
      }
    }

    // Create a simplified prescription object
    const prescriptionData = {
      patient: req.body.patient,
      doctor: req.body.doctor,
      appointment: req.body.appointment || null,
      
      // Basic diagnosis info
      diagnosis: {
        primary: req.body.diagnosis || 'General consultation',
        secondary: req.body.secondaryDiagnosis || []
      },
      
      // Medications array
      medications: req.body.medications.map(med => ({
        name: med.name,
        strength: med.strength,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: {
          value: med.durationValue,
          unit: med.durationUnit
        },
        route: med.route || 'oral',
        instructions: med.instructions,
        quantity: {
          prescribed: med.quantity,
          unit: med.quantityUnit
        },
        refills: {
          allowed: med.refills || 0,
          remaining: med.refills || 0
        }
      })),
      
      // Set validity period
      validUntil: req.body.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
      
      // Special instructions
      specialInstructions: {
        patientInstructions: req.body.specialInstructions || ''
      },
      
      // Set created by user
      createdBy: req.user.id,
      lastModifiedBy: req.user.id
    };

    const prescription = new Prescription(prescriptionData);

    // Generate QR code and verification code
    prescription.generateQRCode();

    // Save the prescription
    await prescription.save();

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: {
        prescriptionId: prescription._id,
        prescriptionNumber: prescription.prescriptionNumber
      }
    });
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all prescriptions
exports.getAllPrescriptions = async (req, res) => {
  try {
    // Apply filters
    const filter = { isDeleted: false };
    
    // Filter by patient if specified
    if (req.query.patient) {
      filter.patient = req.query.patient;
    }
    
    // Filter by doctor if specified
    if (req.query.doctor) {
      filter.doctor = req.query.doctor;
    }
    
    // Filter by status if specified
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Execute query with pagination
    const prescriptions = await Prescription.find(filter)
      .populate('patient', 'firstName lastName')
      .populate('doctor', 'firstName lastName professionalInfo.specialization')
      .skip(skip)
      .limit(limit)
      .sort({ prescribedDate: -1 });
    
    // Get total count for pagination
    const total = await Prescription.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: prescriptions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get prescription by ID
exports.getPrescriptionById = async (req, res) => {
  try {
    const prescriptionId = req.params.id;
    
    const prescription = await Prescription.findById(prescriptionId)
      .populate('patient', 'firstName lastName dateOfBirth email phone gender address')
      .populate('doctor', 'firstName lastName professionalInfo')
      .populate('appointment')
      .populate('createdBy', 'firstName lastName');
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }
    
    // Check if user has access to this prescription
    const user = req.user;
    
    // Allow access if user is the doctor who created it, the patient it's for,
    // or an admin/pharmacist
    const isDoctor = user.id === prescription.doctor._id.toString();
    const isPatient = user.id === prescription.patient._id.toString();
    const isAdmin = user.role === 'admin';
    const isPharmacist = user.role === 'pharmacist';
    
    if (!isDoctor && !isPatient && !isAdmin && !isPharmacist) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this prescription'
      });
    }
    
    // Add audit entry for viewing
    prescription.auditTrail.push({
      action: 'viewed',
      performedBy: user.id,
      timestamp: new Date(),
      details: `Viewed by ${user.role}`
    });
    
    await prescription.save();
    
    res.status(200).json({
      success: true,
      data: prescription
    });
  } catch (error) {
    console.error('Error getting prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get prescriptions for a specific patient
exports.getPatientPrescriptions = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    
    // Verify the patient exists
    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    // Check permissions
    const user = req.user;
    const isPatient = user.id === patientId;
    const isDoctor = user.role === 'doctor';
    const isAdmin = user.role === 'admin';
    
    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view these prescriptions'
      });
    }
    
    // Apply filters
    const filter = {
      patient: patientId,
      isDeleted: false
    };
    
    // Filter by status if specified
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Execute query with pagination
    const prescriptions = await Prescription.find(filter)
      .populate('doctor', 'firstName lastName professionalInfo.specialization')
      .skip(skip)
      .limit(limit)
      .sort({ prescribedDate: -1 });
    
    // Get total count for pagination
    const total = await Prescription.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: prescriptions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting patient prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get prescriptions written by a specific doctor
exports.getDoctorPrescriptions = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    
    // Verify the doctor exists
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    // Check permissions
    const user = req.user;
    const isThisDoctor = user.id === doctorId;
    const isAdmin = user.role === 'admin';
    
    if (!isThisDoctor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view these prescriptions'
      });
    }
    
    // Apply filters
    const filter = {
      doctor: doctorId,
      isDeleted: false
    };
    
    // Filter by status if specified
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Execute query with pagination
    const prescriptions = await Prescription.find(filter)
      .populate('patient', 'firstName lastName')
      .skip(skip)
      .limit(limit)
      .sort({ prescribedDate: -1 });
    
    // Get total count for pagination
    const total = await Prescription.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: prescriptions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting doctor prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update a prescription
exports.updatePrescription = async (req, res) => {
  try {
    const prescriptionId = req.params.id;
    
    // Find the prescription
    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }
    
    // Check permissions (only the doctor who created it or admin can update)
    const user = req.user;
    const isCreatingDoctor = user.id === prescription.doctor.toString();
    const isAdmin = user.role === 'admin';
    
    if (!isCreatingDoctor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this prescription'
      });
    }
    
    // Only allow updates if prescription status is 'active'
    if (prescription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update prescription that has already been filled, cancelled, or expired'
      });
    }
    
    // Fields that can be updated
    const updateFields = [
      'medications', 'diagnosis', 'validUntil', 'specialInstructions'
    ];
    
    // Update only allowed fields
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        // For medications, we need to handle the array specially
        if (field === 'medications') {
          prescription.medications = req.body.medications.map(med => ({
            name: med.name,
            strength: med.strength,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: {
              value: med.durationValue,
              unit: med.durationUnit
            },
            route: med.route || 'oral',
            instructions: med.instructions,
            quantity: {
              prescribed: med.quantity,
              unit: med.quantityUnit
            },
            refills: {
              allowed: med.refills || 0,
              remaining: med.refills || 0
            }
          }));
        }
        // For diagnosis, we need to handle the nested object
        else if (field === 'diagnosis') {
          prescription.diagnosis.primary = req.body.diagnosis || prescription.diagnosis.primary;
          if (req.body.secondaryDiagnosis) {
            prescription.diagnosis.secondary = req.body.secondaryDiagnosis;
          }
        }
        // For special instructions
        else if (field === 'specialInstructions') {
          prescription.specialInstructions.patientInstructions = req.body.specialInstructions || 
            prescription.specialInstructions.patientInstructions;
        }
        // For other fields, direct assignment
        else {
          prescription[field] = req.body[field];
        }
      }
    });
    
    // Update last modified fields
    prescription.lastModifiedBy = user.id;
    
    // Add audit entry
    prescription.auditTrail.push({
      action: 'modified',
      performedBy: user.id,
      timestamp: new Date(),
      details: 'Prescription updated'
    });
    
    // Save changes
    await prescription.save();
    
    res.status(200).json({
      success: true,
      message: 'Prescription updated successfully',
      data: {
        prescriptionId: prescription._id,
        prescriptionNumber: prescription.prescriptionNumber
      }
    });
  } catch (error) {
    console.error('Error updating prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Cancel a prescription
exports.cancelPrescription = async (req, res) => {
  try {
    const prescriptionId = req.params.id;
    
    // Find the prescription
    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }
    
    // Check permissions (doctor who created it, patient it's for, or admin)
    const user = req.user;
    const isCreatingDoctor = user.id === prescription.doctor.toString();
    const isPatient = user.id === prescription.patient.toString();
    const isAdmin = user.role === 'admin';
    
    if (!isCreatingDoctor && !isPatient && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to cancel this prescription'
      });
    }
    
    // Only allow cancellation if prescription status is 'active'
    if (prescription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel prescription that has already been filled or expired'
      });
    }
    
    // Update status to cancelled
    prescription.status = 'cancelled';
    
    // Add reason if provided
    const reason = req.body.reason || `Cancelled by ${user.role}`;
    
    // Add audit entry
    prescription.auditTrail.push({
      action: 'cancelled',
      performedBy: user.id,
      timestamp: new Date(),
      details: reason
    });
    
    // Save changes
    await prescription.save();
    
    res.status(200).json({
      success: true,
      message: 'Prescription cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get prescription by verification code
exports.verifyPrescription = async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Verification code is required'
      });
    }
    
    const prescription = await Prescription.findByVerificationCode(code);
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Invalid verification code or prescription not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        prescriptionId: prescription._id,
        prescriptionNumber: prescription.prescriptionNumber,
        patient: prescription.patient,
        doctor: prescription.doctor,
        status: prescription.status,
        isExpired: prescription.isExpired
      }
    });
  } catch (error) {
    console.error('Error verifying prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};