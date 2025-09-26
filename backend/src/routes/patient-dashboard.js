const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validateObjectId, validateDateRange, validateSearch, handleValidationErrors } = require('../middleware/validation');
const { query } = require('express-validator');
const patientDashboardController = require('../controllers/patientDashboardController');

// Middleware to ensure user is a patient
const ensurePatient = (req, res, next) => {
  if (req.user.role !== 'patient') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Patient role required.'
    });
  }
  next();
};

// Enable authentication for production
router.use(authenticate);
router.use(authorize('patient'));

// Dashboard Overview
// GET /api/patient-dashboard/overview
router.get('/overview', patientDashboardController.getDashboardOverview);

// Appointments Routes
// GET /api/patient-dashboard/appointments
router.get('/appointments', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['confirmed', 'pending', 'completed', 'cancelled', 'all']).withMessage('Invalid status'),
  query('dateRange').optional().isIn(['upcoming', 'past', 'thisWeek', 'thisMonth', 'all']).withMessage('Invalid date range'),
  query('doctorId').optional().isMongoId().withMessage('Invalid doctor ID'),
  handleValidationErrors
], patientDashboardController.getPatientAppointments);

// Health Records Routes
// GET /api/patient-dashboard/health-records
router.get('/health-records', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['vital-signs', 'lab-results', 'imaging', 'diagnosis', 'treatment', 'all']).withMessage('Invalid record type'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid start date format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid end date format'),
  handleValidationErrors
], patientDashboardController.getHealthRecords);

// GET /api/patient-dashboard/health-records/:recordId
router.get('/health-records/:recordId', [
  ...validateObjectId('recordId'),
  handleValidationErrors
], patientDashboardController.getHealthRecordDetails);

// Prescriptions Routes
// GET /api/patient-dashboard/prescriptions
router.get('/prescriptions', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['active', 'completed', 'expired', 'cancelled', 'all']).withMessage('Invalid status'),
  query('medication').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Medication search must be between 2 and 100 characters'),
  handleValidationErrors
], patientDashboardController.getPrescriptions);

// Medical History Route
// GET /api/patient-dashboard/medical-history
router.get('/medical-history', patientDashboardController.getMedicalHistory);

// Notifications Routes
// GET /api/patient-dashboard/notifications
router.get('/notifications', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('type').optional().isIn(['appointment', 'prescription', 'lab_result', 'health_reminder', 'system', 'all']).withMessage('Invalid notification type'),
  query('status').optional().isIn(['read', 'unread', 'all']).withMessage('Invalid status'),
  query('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  handleValidationErrors
], patientDashboardController.getNotifications);

// PUT /api/patient-dashboard/notifications/:notificationId/read
router.put('/notifications/:notificationId/read', [
  ...validateObjectId('notificationId'),
  handleValidationErrors
], patientDashboardController.markNotificationRead);

// Vital Signs Trend Route
// GET /api/patient-dashboard/vital-signs/trend
router.get('/vital-signs/trend', [
  query('type').optional().isIn(['bloodPressure', 'heartRate', 'temperature', 'weight', 'height']).withMessage('Invalid vital sign type'),
  query('period').optional().isInt({ min: 1, max: 365 }).withMessage('Period must be between 1 and 365 days'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
], patientDashboardController.getVitalSignsTrend);

// Health Summary Routes (additional endpoints for comprehensive dashboard)

// GET /api/patient-dashboard/health-summary
router.get('/health-summary', async (req, res) => {
  try {
    const patientId = req.user.id;
    const HealthRecord = require('../models/HealthRecord');
    const MedicalHistory = require('../models/MedicalHistory');

    // Get latest health record with summary
    const latestRecord = await HealthRecord.findOne({
      patient: patientId
    })
    .sort({ recordDate: -1 })
    .lean();

    // Get medical history for risk factors
    const medicalHistory = await MedicalHistory.findOne({ patient: patientId })
      .lean();

    let healthSummary = null;
    if (latestRecord) {
      // Create health summary using model method
      const record = await HealthRecord.findById(latestRecord._id);
      healthSummary = record.generateHealthSummary();
    }

    let riskAssessment = null;
    if (medicalHistory) {
      // Create risk assessment using model method
      const history = await MedicalHistory.findById(medicalHistory._id);
      riskAssessment = history.calculateRiskScore();
    }

    res.json({
      success: true,
      data: {
        healthSummary,
        riskAssessment,
        lastUpdated: latestRecord?.recordDate || null
      }
    });

  } catch (error) {
    console.error('Health summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health summary'
    });
  }
});

// GET /api/patient-dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const patientId = req.user.id;
    const { period = '30' } = req.query; // days

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parseInt(period));

    const Appointment = require('../models/Appointment');
    const HealthRecord = require('../models/HealthRecord');
    const Prescription = require('../models/Prescription');

    // Get appointment statistics
    const appointmentStats = await Appointment.aggregate([
      {
        $match: {
          patient: patientId,
          appointmentDate: { $gte: dateFrom }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get health record statistics
    const recordStats = await HealthRecord.aggregate([
      {
        $match: {
          patient: patientId,
          recordDate: { $gte: dateFrom }
        }
      },
      {
        $group: {
          _id: '$recordType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get prescription statistics
    const prescriptionStats = await Prescription.aggregate([
      {
        $match: {
          patient: patientId,
          createdAt: { $gte: dateFrom }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        period: parseInt(period),
        appointments: appointmentStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        healthRecords: recordStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        prescriptions: prescriptionStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

// Missing routes that frontend expects
// GET /api/patient-dashboard/upcoming-appointments
router.get('/upcoming-appointments', async (req, res) => {
  try {
    const patientId = req.user.id;
    const Appointment = require('../models/Appointment');

    const upcomingAppointments = await Appointment.find({
      patient: patientId,
      appointmentDate: { $gte: new Date() },
      status: { $in: ['confirmed', 'scheduled'] }
    })
    .sort({ appointmentDate: 1 })
    .limit(5)
    .populate('doctor', 'firstName lastName professionalInfo.specialization')
    .lean();

    res.json({
      success: true,
      data: upcomingAppointments
    });

  } catch (error) {
    console.error('Get upcoming appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming appointments'
    });
  }
});

// GET /api/patient-dashboard/health-metrics
router.get('/health-metrics', async (req, res) => {
  try {
    const patientId = req.user.id;
    const HealthRecord = require('../models/HealthRecord');

    // Get latest vital signs
    const latestVitals = await HealthRecord.findOne({
      patient: patientId,
      recordType: 'vital-signs',
      'vitalSigns.0': { $exists: true }
    })
    .sort({ recordDate: -1 })
    .select('vitalSigns recordDate')
    .lean();

    // Get recent trends (last 30 days)
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 30);

    const trends = await HealthRecord.find({
      patient: patientId,
      recordType: 'vital-signs',
      recordDate: { $gte: dateFrom },
      'vitalSigns.0': { $exists: true }
    })
    .sort({ recordDate: 1 })
    .select('vitalSigns recordDate')
    .limit(10)
    .lean();

    const metrics = {
      latestVitals: latestVitals?.vitalSigns?.[0] || null,
      lastRecorded: latestVitals?.recordDate || null,
      trends: trends.map(record => ({
        date: record.recordDate,
        vitals: record.vitalSigns[0]
      }))
    };

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Get health metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health metrics'
    });
  }
});

// GET /api/patient-dashboard/prescription-status
router.get('/prescription-status', async (req, res) => {
  try {
    const patientId = req.user.id;
    const Prescription = require('../models/Prescription');

    const prescriptions = await Prescription.find({
      patient: patientId
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('prescribedBy', 'firstName lastName')
    .lean();

    const statusSummary = {
      active: prescriptions.filter(p => p.status === 'active').length,
      completed: prescriptions.filter(p => p.status === 'completed').length,
      expired: prescriptions.filter(p => p.status === 'expired').length,
      total: prescriptions.length
    };

    const recentPrescriptions = prescriptions.slice(0, 5).map(prescription => ({
      _id: prescription._id,
      medications: prescription.medications,
      status: prescription.status,
      prescribedBy: prescription.prescribedBy,
      startDate: prescription.startDate,
      endDate: prescription.endDate,
      createdAt: prescription.createdAt
    }));

    res.json({
      success: true,
      data: {
        summary: statusSummary,
        recent: recentPrescriptions
      }
    });

  } catch (error) {
    console.error('Get prescription status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prescription status'
    });
  }
});

// GET /api/patient-dashboard/recent-activities
router.get('/recent-activities', async (req, res) => {
  try {
    const patientId = req.user.id;
    const Appointment = require('../models/Appointment');
    const HealthRecord = require('../models/HealthRecord');
    const Prescription = require('../models/Prescription');

    // Get recent appointments
    const recentAppointments = await Appointment.find({
      patient: patientId,
      appointmentDate: { $lte: new Date() }
    })
    .sort({ appointmentDate: -1 })
    .limit(3)
    .populate('doctor', 'firstName lastName')
    .lean();

    // Get recent health records
    const recentRecords = await HealthRecord.find({
      patient: patientId
    })
    .sort({ recordDate: -1 })
    .limit(3)
    .populate('recordedBy', 'firstName lastName')
    .lean();

    // Get recent prescriptions
    const recentPrescriptions = await Prescription.find({
      patient: patientId
    })
    .sort({ createdAt: -1 })
    .limit(3)
    .populate('prescribedBy', 'firstName lastName')
    .lean();

    // Combine and format activities
    const activities = [];

    recentAppointments.forEach(apt => {
      activities.push({
        type: 'appointment',
        title: `Appointment with Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}`,
        description: `${apt.type} appointment - ${apt.status}`,
        date: apt.appointmentDate,
        icon: 'calendar'
      });
    });

    recentRecords.forEach(record => {
      activities.push({
        type: 'health-record',
        title: `${record.recordType.replace('-', ' ')} recorded`,
        description: `Recorded by ${record.recordedBy?.firstName || 'System'} ${record.recordedBy?.lastName || ''}`,
        date: record.recordDate,
        icon: 'file-text'
      });
    });

    recentPrescriptions.forEach(prescription => {
      activities.push({
        type: 'prescription',
        title: 'New prescription issued',
        description: `${prescription.medications.length} medication(s) prescribed by Dr. ${prescription.prescribedBy.firstName} ${prescription.prescribedBy.lastName}`,
        date: prescription.createdAt,
        icon: 'pill'
      });
    });

    // Sort by date (most recent first)
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      data: activities.slice(0, 10) // Return top 10 activities
    });

  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities'
    });
  }
});

module.exports = router;
