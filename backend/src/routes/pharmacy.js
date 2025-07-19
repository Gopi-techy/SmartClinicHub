const express = require('express');
const QRCode = require('qrcode');
const User = require('../models/User');
const Prescription = require('../models/Prescription');
const { authenticate, authorize, rateLimitSensitive } = require('../middleware/auth');
const { 
  validateObjectId, 
  handleValidationErrors 
} = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const crypto = require('crypto');

const router = express.Router();

/**
 * @route   GET /api/pharmacy/prescriptions
 * @desc    Get prescriptions for pharmacy processing
 * @access  Private (Pharmacy)
 */
router.get('/prescriptions',
  authenticate,
  authorize('pharmacy'),
  asyncHandler(async (req, res) => {
    const { 
      status = 'pending',
      priority,
      page = 1,
      limit = 20,
      search,
      dateFrom,
      dateTo
    } = req.query;

    const query = { 
      'pharmacy.pharmacyId': req.user._id,
      status: status !== 'all' ? status : { $exists: true }
    };

    if (priority) query.priority = priority;
    if (dateFrom || dateTo) {
      query.prescribedDate = {};
      if (dateFrom) query.prescribedDate.$gte = new Date(dateFrom);
      if (dateTo) query.prescribedDate.$lte = new Date(dateTo);
    }

    if (search) {
      query.$or = [
        { 'medications.medication': { $regex: search, $options: 'i' } },
        { prescriptionNumber: { $regex: search, $options: 'i' } },
        { 'patient.firstName': { $regex: search, $options: 'i' } },
        { 'patient.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { prescribedDate: -1 },
      populate: [
        {
          path: 'patient',
          select: 'firstName lastName phone email dateOfBirth insuranceInfo'
        },
        {
          path: 'doctor',
          select: 'firstName lastName licenseNumber specialization'
        }
      ]
    };

    const prescriptions = await Prescription.paginate(query, options);

    res.json({
      success: true,
      message: 'Prescriptions retrieved successfully',
      data: {
        prescriptions: prescriptions.docs,
        pagination: {
          currentPage: prescriptions.page,
          totalPages: prescriptions.totalPages,
          totalItems: prescriptions.totalDocs,
          hasNextPage: prescriptions.hasNextPage,
          hasPrevPage: prescriptions.hasPrevPage
        }
      }
    });
  })
);

/**
 * @route   GET /api/pharmacy/prescription/:id
 * @desc    Get specific prescription details
 * @access  Private (Pharmacy)
 */
router.get('/prescription/:id',
  authenticate,
  authorize('pharmacy'),
  validateObjectId('id'),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const prescription = await Prescription.findOne({
      _id: req.params.id,
      'pharmacy.pharmacyId': req.user._id
    })
    .populate('patient', 'firstName lastName phone email dateOfBirth insuranceInfo medicalInfo')
    .populate('doctor', 'firstName lastName licenseNumber specialization contactInfo');

    if (!prescription) {
      return res.status(404).json({
        error: true,
        message: 'Prescription not found or not assigned to this pharmacy'
      });
    }

    res.json({
      success: true,
      message: 'Prescription details retrieved',
      data: { prescription }
    });
  })
);

/**
 * @route   POST /api/pharmacy/verify-qr
 * @desc    Verify prescription QR code
 * @access  Private (Pharmacy)
 */
router.post('/verify-qr',
  authenticate,
  authorize('pharmacy'),
  rateLimitSensitive(100, 60 * 60 * 1000), // 100 verifications per hour
  asyncHandler(async (req, res) => {
    const { qrCode, verificationMethod = 'qr' } = req.body;

    if (!qrCode) {
      return res.status(400).json({
        error: true,
        message: 'QR code is required'
      });
    }

    try {
      // Decrypt QR code data
      const decryptedData = JSON.parse(qrCode);
      const { prescriptionId, hash, timestamp } = decryptedData;

      // Find prescription
      const prescription = await Prescription.findById(prescriptionId)
        .populate('patient', 'firstName lastName phone dateOfBirth')
        .populate('doctor', 'firstName lastName licenseNumber');

      if (!prescription) {
        return res.status(404).json({
          error: true,
          message: 'Prescription not found',
          verification: { status: 'invalid', reason: 'Prescription not found' }
        });
      }

      // Verify hash
      const expectedHash = crypto
        .createHash('sha256')
        .update(`${prescriptionId}_${prescription.prescriptionNumber}_${timestamp}`)
        .digest('hex');

      if (hash !== expectedHash) {
        logger.security('Invalid prescription QR hash attempted', {
          prescriptionId,
          providedHash: hash,
          expectedHash,
          pharmacyId: req.user._id,
          ip: req.ip
        });

        return res.status(400).json({
          error: true,
          message: 'Invalid QR code',
          verification: { status: 'invalid', reason: 'QR code tampered or invalid' }
        });
      }

      // Check if prescription is dispensable
      const verificationResult = {
        status: 'valid',
        prescriptionId: prescription._id,
        prescriptionNumber: prescription.prescriptionNumber,
        patient: {
          name: `${prescription.patient.firstName} ${prescription.patient.lastName}`,
          phone: prescription.patient.phone,
          dateOfBirth: prescription.patient.dateOfBirth
        },
        doctor: {
          name: `${prescription.doctor.firstName} ${prescription.doctor.lastName}`,
          license: prescription.doctor.licenseNumber
        },
        medications: prescription.medications,
        status: prescription.status,
        canDispense: prescription.status === 'pending',
        warnings: [],
        notes: []
      };

      // Add warnings/notes
      if (prescription.status === 'dispensed') {
        verificationResult.warnings.push('Prescription already dispensed');
        verificationResult.canDispense = false;
      }

      if (prescription.status === 'cancelled') {
        verificationResult.warnings.push('Prescription has been cancelled');
        verificationResult.canDispense = false;
      }

      if (prescription.expiryDate && new Date() > prescription.expiryDate) {
        verificationResult.warnings.push('Prescription has expired');
        verificationResult.canDispense = false;
      }

      // Check refills
      prescription.medications.forEach((med, index) => {
        if (med.refillsRemaining <= 0 && med.refillsDispensed > 0) {
          verificationResult.warnings.push(`No refills remaining for ${med.medication}`);
        }
      });

      // Log verification
      logger.audit('Prescription QR verified', req.user._id, {
        prescriptionId,
        status: verificationResult.status,
        canDispense: verificationResult.canDispense,
        verificationMethod,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'QR code verified successfully',
        data: { verification: verificationResult }
      });

    } catch (error) {
      logger.error('QR verification error:', error);
      res.status(400).json({
        error: true,
        message: 'Invalid QR code format',
        verification: { status: 'invalid', reason: 'QR code format error' }
      });
    }
  })
);

/**
 * @route   POST /api/pharmacy/dispense/:id
 * @desc    Dispense prescription
 * @access  Private (Pharmacy)
 */
router.post('/dispense/:id',
  authenticate,
  authorize('pharmacy'),
  validateObjectId('id'),
  handleValidationErrors,
  rateLimitSensitive(50, 60 * 60 * 1000), // 50 dispensing actions per hour
  asyncHandler(async (req, res) => {
    const { 
      medicationsDispensed,
      pharmacistNotes,
      patientCounseling,
      substitutions = [],
      partialDispensing = false 
    } = req.body;

    const prescription = await Prescription.findOne({
      _id: req.params.id,
      'pharmacy.pharmacyId': req.user._id,
      status: { $in: ['pending', 'partially_dispensed'] }
    }).populate('patient', 'firstName lastName phone email');

    if (!prescription) {
      return res.status(404).json({
        error: true,
        message: 'Prescription not found or cannot be dispensed'
      });
    }

    // Validate medications dispensed
    if (!medicationsDispensed || medicationsDispensed.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'Medications dispensed information is required'
      });
    }

    // Update prescription with dispensing information
    prescription.medications.forEach((med, index) => {
      const dispensedInfo = medicationsDispensed.find(d => d.medicationIndex === index);
      if (dispensedInfo) {
        med.quantityDispensed = (med.quantityDispensed || 0) + dispensedInfo.quantityDispensed;
        med.refillsDispensed = (med.refillsDispensed || 0) + (dispensedInfo.isRefill ? 1 : 0);
        med.refillsRemaining = Math.max(0, med.refillsAllowed - med.refillsDispensed);
        med.lastDispensedDate = new Date();
        
        if (dispensedInfo.substitution) {
          med.substitutions = med.substitutions || [];
          med.substitutions.push({
            originalMedication: med.medication,
            substitutedWith: dispensedInfo.substitution.medication,
            reason: dispensedInfo.substitution.reason,
            pharmacistApproval: req.user._id,
            date: new Date()
          });
        }
      }
    });

    // Determine new status
    const allMedicationsDispensed = prescription.medications.every(med => 
      med.quantityDispensed >= med.quantity
    );

    prescription.status = partialDispensing || !allMedicationsDispensed 
      ? 'partially_dispensed' 
      : 'dispensed';

    prescription.pharmacy.dispensedDate = new Date();
    prescription.pharmacy.pharmacistId = req.user._id;
    prescription.pharmacy.pharmacistNotes = pharmacistNotes;

    // Add dispensing record
    prescription.dispensingHistory = prescription.dispensingHistory || [];
    prescription.dispensingHistory.push({
      pharmacistId: req.user._id,
      dispensedDate: new Date(),
      medicationsDispensed: medicationsDispensed.map(med => ({
        medicationIndex: med.medicationIndex,
        medication: prescription.medications[med.medicationIndex].medication,
        quantityDispensed: med.quantityDispensed,
        batchNumber: med.batchNumber,
        expiryDate: med.expiryDate,
        manufacturer: med.manufacturer,
        substitution: med.substitution
      })),
      notes: pharmacistNotes,
      patientCounseling: patientCounseling || {
        provided: false,
        notes: ''
      }
    });

    await prescription.save();

    // Generate dispensing receipt
    const receipt = {
      receiptNumber: `RX_${Date.now()}_${prescription._id.toString().slice(-6)}`,
      prescriptionNumber: prescription.prescriptionNumber,
      patient: {
        name: `${prescription.patient.firstName} ${prescription.patient.lastName}`,
        phone: prescription.patient.phone
      },
      pharmacy: {
        name: req.user.pharmacyInfo?.pharmacyName || req.user.firstName,
        license: req.user.pharmacyInfo?.licenseNumber,
        address: req.user.pharmacyInfo?.address
      },
      pharmacist: {
        name: `${req.user.firstName} ${req.user.lastName}`,
        license: req.user.pharmacyInfo?.pharmacistLicense
      },
      dispensedMedications: medicationsDispensed.map((med, idx) => {
        const originalMed = prescription.medications[med.medicationIndex];
        return {
          medication: originalMed.medication,
          strength: originalMed.strength,
          quantity: med.quantityDispensed,
          directions: originalMed.directions,
          batchNumber: med.batchNumber,
          expiryDate: med.expiryDate,
          substitution: med.substitution
        };
      }),
      dispensedDate: new Date(),
      totalCost: medicationsDispensed.reduce((sum, med) => sum + (med.cost || 0), 0),
      counselingProvided: patientCounseling?.provided || false
    };

    // Log dispensing action
    logger.audit('Prescription dispensed', req.user._id, {
      prescriptionId: prescription._id,
      prescriptionNumber: prescription.prescriptionNumber,
      patientId: prescription.patient._id,
      medicationsCount: medicationsDispensed.length,
      totalQuantity: medicationsDispensed.reduce((sum, med) => sum + med.quantityDispensed, 0),
      partialDispensing,
      receiptNumber: receipt.receiptNumber,
      ip: req.ip
    });

    res.json({
      success: true,
      message: `Prescription ${partialDispensing ? 'partially ' : ''}dispensed successfully`,
      data: {
        prescription: {
          _id: prescription._id,
          prescriptionNumber: prescription.prescriptionNumber,
          status: prescription.status,
          medications: prescription.medications
        },
        receipt,
        nextSteps: prescription.status === 'partially_dispensed' 
          ? ['Complete remaining medications when available']
          : ['Prescription fully dispensed', 'Provide patient counseling if required']
      }
    });
  })
);

/**
 * @route   POST /api/pharmacy/inventory/check
 * @desc    Check medication inventory
 * @access  Private (Pharmacy)
 */
router.post('/inventory/check',
  authenticate,
  authorize('pharmacy'),
  asyncHandler(async (req, res) => {
    const { medications } = req.body;

    if (!medications || medications.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'Medications list is required'
      });
    }

    // Mock inventory system - in real implementation, this would connect to pharmacy inventory
    const inventoryCheck = medications.map(med => {
      const available = Math.floor(Math.random() * 100) + 1; // Mock availability
      const inStock = available >= med.quantity;
      
      return {
        medication: med.medication,
        strength: med.strength,
        requestedQuantity: med.quantity,
        availableQuantity: available,
        inStock,
        estimatedRestockDate: inStock ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        alternativeOptions: inStock ? [] : [
          {
            medication: `Generic ${med.medication}`,
            strength: med.strength,
            available: Math.floor(Math.random() * 50) + 10,
            costDifference: -15
          }
        ]
      };
    });

    const allInStock = inventoryCheck.every(item => item.inStock);
    const partiallyAvailable = inventoryCheck.some(item => item.inStock && item.availableQuantity < item.requestedQuantity);

    res.json({
      success: true,
      message: 'Inventory check completed',
      data: {
        inventoryStatus: {
          allInStock,
          partiallyAvailable,
          outOfStock: inventoryCheck.filter(item => !item.inStock),
          requiresOrdering: inventoryCheck.filter(item => !item.inStock).length
        },
        medications: inventoryCheck,
        recommendations: allInStock 
          ? ['All medications available for dispensing']
          : ['Some medications need to be ordered', 'Consider alternative options for out-of-stock items']
      }
    });
  })
);

/**
 * @route   GET /api/pharmacy/reports/dispensing
 * @desc    Generate dispensing reports
 * @access  Private (Pharmacy)
 */
router.get('/reports/dispensing',
  authenticate,
  authorize('pharmacy'),
  asyncHandler(async (req, res) => {
    const { 
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      endDate = new Date(),
      reportType = 'summary' 
    } = req.query;

    const matchStage = {
      'pharmacy.pharmacyId': req.user._id,
      'pharmacy.dispensedDate': {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      status: { $in: ['dispensed', 'partially_dispensed'] }
    };

    const dispensingStats = await Prescription.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalPrescriptions: { $sum: 1 },
          totalMedications: { $sum: { $size: '$medications' } },
          averageProcessingTime: { $avg: { 
            $divide: [
              { $subtract: ['$pharmacy.dispensedDate', '$prescribedDate'] },
              1000 * 60 * 60 // Convert to hours
            ]
          }},
          prescriptionsByStatus: {
            $push: '$status'
          }
        }
      }
    ]);

    // Top medications dispensed
    const topMedications = await Prescription.aggregate([
      { $match: matchStage },
      { $unwind: '$medications' },
      {
        $group: {
          _id: '$medications.medication',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$medications.quantityDispensed' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Daily dispensing volume
    const dailyVolume = await Prescription.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$pharmacy.dispensedDate'
            }
          },
          prescriptions: { $sum: 1 },
          medications: { $sum: { $size: '$medications' } }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const report = {
      reportPeriod: {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      },
      summary: dispensingStats[0] || {
        totalPrescriptions: 0,
        totalMedications: 0,
        averageProcessingTime: 0
      },
      topMedications,
      dailyVolume,
      generatedAt: new Date(),
      generatedBy: req.user._id
    };

    // Log report generation
    logger.audit('Dispensing report generated', req.user._id, {
      reportType,
      period: { startDate, endDate },
      totalPrescriptions: report.summary.totalPrescriptions,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Dispensing report generated',
      data: { report }
    });
  })
);

/**
 * @route   POST /api/pharmacy/patient-counseling/:prescriptionId
 * @desc    Record patient counseling session
 * @access  Private (Pharmacy)
 */
router.post('/patient-counseling/:prescriptionId',
  authenticate,
  authorize('pharmacy'),
  validateObjectId('prescriptionId'),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { prescriptionId } = req.params;
    const {
      counselingNotes,
      topicsCovered = [],
      patientUnderstanding,
      followUpRequired,
      additionalRecommendations
    } = req.body;

    const prescription = await Prescription.findOne({
      _id: prescriptionId,
      'pharmacy.pharmacyId': req.user._id
    }).populate('patient', 'firstName lastName phone');

    if (!prescription) {
      return res.status(404).json({
        error: true,
        message: 'Prescription not found or not accessible'
      });
    }

    const counselingRecord = {
      pharmacistId: req.user._id,
      sessionDate: new Date(),
      counselingNotes,
      topicsCovered,
      patientUnderstanding: patientUnderstanding || 'good',
      followUpRequired: followUpRequired || false,
      additionalRecommendations: additionalRecommendations || [],
      sessionDuration: req.body.sessionDuration || 5 // minutes
    };

    prescription.counselingSessions = prescription.counselingSessions || [];
    prescription.counselingSessions.push(counselingRecord);

    await prescription.save();

    // Log counseling session
    logger.audit('Patient counseling recorded', req.user._id, {
      prescriptionId,
      patientId: prescription.patient._id,
      sessionDuration: counselingRecord.sessionDuration,
      topicsCount: topicsCovered.length,
      followUpRequired,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Patient counseling session recorded',
      data: {
        counselingRecord,
        prescriptionNumber: prescription.prescriptionNumber,
        patientName: `${prescription.patient.firstName} ${prescription.patient.lastName}`,
        nextSteps: followUpRequired 
          ? ['Schedule follow-up consultation', 'Monitor patient progress']
          : ['Counseling completed successfully']
      }
    });
  })
);

/**
 * @route   POST /api/pharmacy/refill-request/:prescriptionId
 * @desc    Process refill request
 * @access  Private (Pharmacy)
 */
router.post('/refill-request/:prescriptionId',
  authenticate,
  authorize('pharmacy'),
  validateObjectId('prescriptionId'),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { prescriptionId } = req.params;
    const { 
      medicationsToRefill,
      pharmacistNotes,
      patientContactVerified = false 
    } = req.body;

    const prescription = await Prescription.findOne({
      _id: prescriptionId,
      'pharmacy.pharmacyId': req.user._id
    }).populate('patient', 'firstName lastName phone')
      .populate('doctor', 'firstName lastName contactInfo');

    if (!prescription) {
      return res.status(404).json({
        error: true,
        message: 'Prescription not found or not accessible'
      });
    }

    if (!patientContactVerified) {
      return res.status(400).json({
        error: true,
        message: 'Patient contact verification is required for refill requests'
      });
    }

    const refillValidation = {
      eligible: [],
      ineligible: [],
      requiresApproval: []
    };

    prescription.medications.forEach((med, index) => {
      if (medicationsToRefill.includes(index)) {
        if (med.refillsRemaining > 0) {
          refillValidation.eligible.push({
            index,
            medication: med.medication,
            refillsRemaining: med.refillsRemaining
          });
        } else if (med.refillsAllowed > 0) {
          refillValidation.requiresApproval.push({
            index,
            medication: med.medication,
            reason: 'No refills remaining - requires doctor approval'
          });
        } else {
          refillValidation.ineligible.push({
            index,
            medication: med.medication,
            reason: 'No refills allowed'
          });
        }
      }
    });

    // Create refill request record
    const refillRequest = {
      requestId: `REF_${Date.now()}_${prescriptionId.slice(-6)}`,
      pharmacistId: req.user._id,
      requestDate: new Date(),
      medicationsRequested: medicationsToRefill,
      eligibleMedications: refillValidation.eligible,
      requiresApproval: refillValidation.requiresApproval,
      ineligibleMedications: refillValidation.ineligible,
      pharmacistNotes,
      status: refillValidation.requiresApproval.length > 0 ? 'pending_approval' : 'approved'
    };

    prescription.refillRequests = prescription.refillRequests || [];
    prescription.refillRequests.push(refillRequest);

    await prescription.save();

    // Log refill request
    logger.audit('Refill request processed', req.user._id, {
      prescriptionId,
      requestId: refillRequest.requestId,
      eligibleCount: refillValidation.eligible.length,
      requiresApproval: refillValidation.requiresApproval.length,
      patientId: prescription.patient._id,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Refill request processed',
      data: {
        refillRequest,
        prescriptionNumber: prescription.prescriptionNumber,
        validation: refillValidation,
        nextSteps: refillValidation.requiresApproval.length > 0
          ? [`Contact doctor for approval: ${prescription.doctor.contactInfo?.phone}`, 'Process eligible medications immediately']
          : ['All requested medications eligible for refill', 'Proceed with dispensing']
      }
    });
  })
);

module.exports = router;
