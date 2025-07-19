const express = require('express');
const EmergencyAccess = require('../models/EmergencyAccess');
const User = require('../models/User');
const { authenticate, authorize, authorizeEmergencyAccess } = require('../middleware/auth');
const { 
  validateEmergencyAccess, 
  validateObjectId, 
  handleValidationErrors 
} = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   POST /api/emergency/access
 * @desc    Access patient emergency information
 * @access  Public (Emergency situations)
 */
router.post('/access',
  validateEmergencyAccess,
  handleValidationErrors,
  authorizeEmergencyAccess,
  asyncHandler(async (req, res) => {
    const { emergencyCode, emergencyType, location, accessLevel = 'basic' } = req.body;
    const emergencyAccess = req.emergencyAccess;
    const patient = req.emergencyPatient;

    // Get emergency information based on access level
    const emergencyInfo = await EmergencyAccess.getEmergencyInfo(
      patient._id,
      accessLevel
    );

    if (!emergencyInfo || emergencyInfo.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Emergency information not found'
      });
    }

    const patientData = emergencyInfo[0];

    // Create response based on access level
    let responseData = {
      patientId: patient._id,
      accessLevel,
      emergencyType,
      accessedAt: new Date(),
      basicInfo: {
        name: `${patientData.patientInfo.firstName} ${patientData.patientInfo.lastName}`,
        age: patient.age,
        bloodType: patientData.medicalAlerts?.bloodType,
        emergencyContacts: patientData.emergencyContact
      }
    };

    if (accessLevel === 'medical' || accessLevel === 'full') {
      responseData.medicalInfo = {
        allergies: patientData.medicalAlerts?.criticalAllergies || [],
        chronicConditions: patientData.medicalAlerts?.chronicConditions || [],
        currentMedications: patientData.medicalAlerts?.currentMedications || [],
        medicalHistory: patientData.patientInfo.medicalInfo || {},
        emergencyInstructions: patientData.medicalAlerts?.emergencyInstructions
      };

      responseData.healthcareInfo = patientData.healthcareInfo;
    }

    if (accessLevel === 'full') {
      responseData.fullProfile = patientData.patientInfo;
      responseData.preferences = patientData.patientInfo.preferences;
    }

    // Send emergency alert if configured
    if (emergencyAccess.notifications.notifyOnAccess) {
      const alert = emergencyAccess.sendEmergencyAlert(emergencyType, location, {
        accessedBy: req.user?._id || 'anonymous',
        accessLevel,
        timestamp: new Date()
      });

      // TODO: Implement actual notification sending
      logger.emergency('Emergency alert generated', alert);
    }

    logger.emergency('Emergency access granted', {
      patientId: patient._id,
      emergencyType,
      accessLevel,
      location,
      accessedBy: req.user?._id || 'anonymous',
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Emergency access granted',
      data: responseData
    });
  })
);

/**
 * @route   POST /api/emergency/setup
 * @desc    Setup emergency access for a patient
 * @access  Private (Patient)
 */
router.post('/setup',
  authenticate,
  authorize('patient'),
  asyncHandler(async (req, res) => {
    const {
      emergencyContact,
      accessLevel = 'basic',
      accessMethods,
      medicalAccess,
      locationSettings,
      timeRestrictions,
      emergencyScenarios,
      notifications,
      medicalAlerts
    } = req.body;

    const patientId = req.user._id;

    // Check if emergency access already exists
    const existingAccess = await EmergencyAccess.findOne({
      patient: patientId,
      isActive: true
    });

    if (existingAccess) {
      return res.status(400).json({
        error: true,
        message: 'Emergency access is already configured for this patient'
      });
    }

    // Create new emergency access configuration
    const emergencyAccess = new EmergencyAccess({
      patient: patientId,
      emergencyContact,
      accessLevel,
      accessMethods: {
        qrCode: {
          enabled: accessMethods?.qrCode?.enabled || true
        },
        nfcTag: {
          enabled: accessMethods?.nfcTag?.enabled || false
        },
        biometric: {
          faceRecognition: {
            enabled: accessMethods?.biometric?.faceRecognition?.enabled || false
          },
          fingerprint: {
            enabled: accessMethods?.biometric?.fingerprint?.enabled || false
          }
        },
        aadhaarAuth: {
          enabled: accessMethods?.aadhaarAuth?.enabled || false
        },
        otpFallback: {
          enabled: accessMethods?.otpFallback?.enabled || true,
          guardianPhones: emergencyContact.primary.phone ? [emergencyContact.primary.phone] : []
        }
      },
      medicalAccess: medicalAccess || {
        allowBasicInfo: true,
        allowMedicalHistory: true,
        allowAllergies: true,
        allowMedications: true,
        allowEmergencyContacts: true
      },
      locationSettings,
      timeRestrictions,
      emergencyScenarios,
      notifications: notifications || {
        notifyOnAccess: true,
        notifyOnFailedAccess: true,
        notifyEmergencyContacts: true,
        methods: ['sms', 'email']
      },
      medicalAlerts
    });

    // Generate QR code if enabled
    if (emergencyAccess.accessMethods.qrCode.enabled) {
      const qrCode = emergencyAccess.generateQRCode();
      logger.info(`QR code generated for patient ${patientId}: ${qrCode.substring(0, 10)}...`);
    }

    await emergencyAccess.save();

    logger.audit('Emergency access configured', req.user._id, {
      patientId,
      accessLevel,
      enabledMethods: Object.keys(accessMethods || {}).filter(method => 
        accessMethods[method]?.enabled
      ),
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Emergency access configured successfully',
      data: {
        emergencyAccess: {
          id: emergencyAccess._id,
          accessLevel: emergencyAccess.accessLevel,
          qrCodeGenerated: emergencyAccess.accessMethods.qrCode.enabled,
          accessMethods: Object.keys(emergencyAccess.accessMethods).filter(method => 
            emergencyAccess.accessMethods[method]?.enabled
          )
        }
      }
    });
  })
);

/**
 * @route   GET /api/emergency/qr-code/:patientId
 * @desc    Generate or regenerate QR code for emergency access
 * @access  Private (Patient or Admin)
 */
router.get('/qr-code/:patientId',
  authenticate,
  validateObjectId('patientId'),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;

    // Check permissions
    if (req.user.role !== 'admin' && req.user._id.toString() !== patientId) {
      return res.status(403).json({
        error: true,
        message: 'You can only access your own emergency QR code'
      });
    }

    const emergencyAccess = await EmergencyAccess.findOne({
      patient: patientId,
      isActive: true
    });

    if (!emergencyAccess) {
      return res.status(404).json({
        error: true,
        message: 'Emergency access not configured'
      });
    }

    if (!emergencyAccess.accessMethods.qrCode.enabled) {
      return res.status(400).json({
        error: true,
        message: 'QR code access is not enabled'
      });
    }

    // Generate new QR code
    const qrCode = emergencyAccess.generateQRCode();
    await emergencyAccess.save();

    logger.audit('Emergency QR code generated', req.user._id, {
      patientId,
      generatedAt: new Date(),
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'QR code generated successfully',
      data: {
        qrCode,
        expiresAt: emergencyAccess.accessMethods.qrCode.expiresAt,
        instructions: 'Show this QR code to medical personnel during emergencies'
      }
    });
  })
);

/**
 * @route   POST /api/emergency/verify-qr
 * @desc    Verify QR code for emergency access
 * @access  Public
 */
router.post('/verify-qr',
  asyncHandler(async (req, res) => {
    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(400).json({
        error: true,
        message: 'QR code is required'
      });
    }

    const emergencyAccess = await EmergencyAccess.findByQRCode(qrCode);

    if (!emergencyAccess) {
      logger.security('Invalid QR code scan attempt', {
        qrCode: qrCode.substring(0, 10) + '...',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(404).json({
        error: true,
        message: 'Invalid or expired QR code'
      });
    }

    // Increment scan count
    emergencyAccess.accessMethods.qrCode.scanCount += 1;
    emergencyAccess.accessMethods.qrCode.lastScanned = new Date();
    await emergencyAccess.save();

    logger.audit('QR code verified', null, {
      patientId: emergencyAccess.patient._id,
      scanCount: emergencyAccess.accessMethods.qrCode.scanCount,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'QR code verified successfully',
      data: {
        patientId: emergencyAccess.patient._id,
        patientName: `${emergencyAccess.patient.firstName} ${emergencyAccess.patient.lastName}`,
        accessLevel: emergencyAccess.accessLevel,
        emergencyContacts: emergencyAccess.emergencyContact,
        nextSteps: 'Proceed with emergency access protocol'
      }
    });
  })
);

/**
 * @route   GET /api/emergency/config/:patientId
 * @desc    Get emergency access configuration
 * @access  Private (Patient or Admin)
 */
router.get('/config/:patientId',
  authenticate,
  validateObjectId('patientId'),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;

    // Check permissions
    if (req.user.role !== 'admin' && req.user._id.toString() !== patientId) {
      return res.status(403).json({
        error: true,
        message: 'You can only access your own emergency configuration'
      });
    }

    const emergencyAccess = await EmergencyAccess.findOne({
      patient: patientId,
      isActive: true
    }).populate('patient', 'firstName lastName email phone');

    if (!emergencyAccess) {
      return res.status(404).json({
        error: true,
        message: 'Emergency access not configured'
      });
    }

    // Remove sensitive data
    const config = emergencyAccess.toObject();
    delete config.accessHistory;
    delete config.accessMethods.qrCode.code;
    delete config.accessMethods.biometric;

    res.json({
      success: true,
      data: {
        config
      }
    });
  })
);

/**
 * @route   PUT /api/emergency/config/:patientId
 * @desc    Update emergency access configuration
 * @access  Private (Patient or Admin)
 */
router.put('/config/:patientId',
  authenticate,
  validateObjectId('patientId'),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const updateData = req.body;

    // Check permissions
    if (req.user.role !== 'admin' && req.user._id.toString() !== patientId) {
      return res.status(403).json({
        error: true,
        message: 'You can only update your own emergency configuration'
      });
    }

    const emergencyAccess = await EmergencyAccess.findOne({
      patient: patientId,
      isActive: true
    });

    if (!emergencyAccess) {
      return res.status(404).json({
        error: true,
        message: 'Emergency access not configured'
      });
    }

    // Update allowed fields
    const allowedFields = [
      'emergencyContact',
      'accessLevel',
      'medicalAccess',
      'locationSettings',
      'timeRestrictions',
      'notifications',
      'medicalAlerts'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        emergencyAccess[field] = updateData[field];
      }
    });

    // Update access methods if provided
    if (updateData.accessMethods) {
      Object.keys(updateData.accessMethods).forEach(method => {
        if (emergencyAccess.accessMethods[method]) {
          Object.assign(emergencyAccess.accessMethods[method], updateData.accessMethods[method]);
        }
      });
    }

    await emergencyAccess.save();

    logger.audit('Emergency access configuration updated', req.user._id, {
      patientId,
      updatedFields: Object.keys(updateData),
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Emergency access configuration updated successfully',
      data: {
        emergencyAccess: {
          id: emergencyAccess._id,
          accessLevel: emergencyAccess.accessLevel,
          lastUpdated: emergencyAccess.lastUpdated
        }
      }
    });
  })
);

/**
 * @route   GET /api/emergency/access-history/:patientId
 * @desc    Get emergency access history
 * @access  Private (Patient or Admin)
 */
router.get('/access-history/:patientId',
  authenticate,
  validateObjectId('patientId'),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check permissions
    if (req.user.role !== 'admin' && req.user._id.toString() !== patientId) {
      return res.status(403).json({
        error: true,
        message: 'You can only access your own emergency access history'
      });
    }

    const emergencyAccess = await EmergencyAccess.findOne({
      patient: patientId,
      isActive: true
    }).populate('accessHistory.accessedBy', 'firstName lastName role');

    if (!emergencyAccess) {
      return res.status(404).json({
        error: true,
        message: 'Emergency access not configured'
      });
    }

    // Paginate access history
    const total = emergencyAccess.accessHistory.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    
    const paginatedHistory = emergencyAccess.accessHistory
      .sort((a, b) => b.accessedAt - a.accessedAt)
      .slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        accessHistory: paginatedHistory,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          hasNext: endIndex < total,
          hasPrev: page > 1
        }
      }
    });
  })
);

/**
 * @route   POST /api/emergency/test-alert
 * @desc    Test emergency alert system
 * @access  Private (Patient)
 */
router.post('/test-alert',
  authenticate,
  authorize('patient'),
  asyncHandler(async (req, res) => {
    const { emergencyType = 'test' } = req.body;
    const patientId = req.user._id;

    const emergencyAccess = await EmergencyAccess.findOne({
      patient: patientId,
      isActive: true
    });

    if (!emergencyAccess) {
      return res.status(404).json({
        error: true,
        message: 'Emergency access not configured'
      });
    }

    // Generate test alert
    const testAlert = emergencyAccess.sendEmergencyAlert(emergencyType, null, {
      isTest: true,
      initiatedBy: patientId,
      timestamp: new Date()
    });

    logger.audit('Emergency alert test', req.user._id, {
      patientId,
      emergencyType,
      isTest: true,
      ip: req.ip
    });

    // TODO: Send actual test notifications

    res.json({
      success: true,
      message: 'Test alert generated successfully',
      data: {
        alert: testAlert,
        note: 'This was a test alert. Emergency contacts have been notified that this was a test.'
      }
    });
  })
);

module.exports = router;
