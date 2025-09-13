/**
 * Patient Dashboard Controller - Gradually adding back functionality
 */

// Test model imports one by one
const User = require('../models/User');
console.log('✅ User model imported successfully');
const Appointment = require('../models/Appointment');
console.log('✅ Appointment model imported successfully');
const Prescription = require('../models/Prescription');
console.log('✅ Prescription model imported successfully');
const HealthRecord = require('../models/HealthRecord');
console.log('✅ HealthRecord model imported successfully');
const MedicalHistory = require('../models/MedicalHistory');
console.log('✅ MedicalHistory model imported successfully');
const Notification = require('../models/Notification');
console.log('✅ Notification model imported successfully');
const { validationResult } = require('express-validator');
console.log('✅ Express-validator imported successfully');

// Get dashboard overview with real data
const getDashboardOverview = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Mock patient ID for now (since auth is disabled)
    const patientId = req.user?._id || '507f1f77bcf86cd799439011';

    console.log('📊 Fetching dashboard data for patient:', patientId);

    // Get upcoming appointments
    const upcomingAppointments = await Appointment.find({
      patient: patientId,
      appointmentDate: { $gte: new Date() },
      status: { $in: ['confirmed', 'scheduled'] }
    })
    .sort({ appointmentDate: 1 })
    .limit(3)
    .populate('doctor', 'firstName lastName professionalInfo.specialization')
    .lean();

    console.log('✅ Upcoming appointments fetched:', upcomingAppointments.length);

    // Get recent health records
    const recentHealthRecords = await HealthRecord.find({
      patient: patientId
    })
    .sort({ recordDate: -1 })
    .limit(5)
    .populate('recordedBy', 'firstName lastName')
    .lean();

    console.log('✅ Recent health records fetched:', recentHealthRecords.length);

    // Get active prescriptions
    const activePrescriptions = await Prescription.find({
      patient: patientId,
      status: 'active',
      endDate: { $gte: new Date() }
    })
    .sort({ startDate: -1 })
    .limit(5)
    .populate('prescribedBy', 'firstName lastName')
    .lean();

    console.log('✅ Active prescriptions fetched:', activePrescriptions.length);

    // Get unread notifications
    const unreadNotifications = await Notification.countDocuments({
      recipient: patientId,
      read: false
    });

    console.log('✅ Unread notifications counted:', unreadNotifications);

    // Calculate health score from most recent health record
    let healthScore = null;
    if (recentHealthRecords.length > 0) {
      const latestRecord = recentHealthRecords[0];
      if (latestRecord.vitalSigns && latestRecord.vitalSigns.length > 0) {
        healthScore = await HealthRecord.calculateHealthScore(latestRecord._id);
      }
    }

    console.log('✅ Health score calculated:', healthScore);

    // Get latest vital signs
    let latestVitals = null;
    if (recentHealthRecords.length > 0) {
      const recordWithVitals = recentHealthRecords.find(record => 
        record.vitalSigns && record.vitalSigns.length > 0
      );
      if (recordWithVitals) {
        latestVitals = recordWithVitals.vitalSigns[recordWithVitals.vitalSigns.length - 1];
      }
    }

    console.log('✅ Latest vitals extracted:', !!latestVitals);

    // Get critical alerts from medical history
    const medicalHistory = await MedicalHistory.findOne({ patient: patientId }).lean();
    let criticalAlerts = [];
    
    if (medicalHistory) {
      // Check for critical allergies
      const criticalAllergies = medicalHistory.allergies?.filter(allergy => 
        allergy.severity === 'severe' || allergy.severity === 'life-threatening'
      ) || [];
      
      criticalAlerts = criticalAllergies.map(allergy => ({
        type: 'critical-allergy',
        message: `Critical allergy: ${allergy.allergen} (${allergy.severity})`,
        severity: 'high',
        date: allergy.diagnosedDate
      }));

      // Check for high-risk conditions
      const highRiskConditions = medicalHistory.conditions?.filter(condition =>
        ['diabetes', 'hypertension', 'heart disease', 'stroke'].includes(condition.name.toLowerCase())
      ) || [];

      const conditionAlerts = highRiskConditions.map(condition => ({
        type: 'high-risk-condition',
        message: `Monitor: ${condition.name} (${condition.status})`,
        severity: 'medium',
        date: condition.diagnosedDate
      }));

      criticalAlerts = criticalAlerts.concat(conditionAlerts);
    }

    console.log('✅ Critical alerts generated:', criticalAlerts.length);

    res.json({
      success: true,
      data: {
        overview: {
          upcomingAppointments: upcomingAppointments.length,
          recentHealthRecords: recentHealthRecords.length,
          activePrescriptions: activePrescriptions.length,
          unreadNotifications,
          healthScore
        },
        upcomingAppointments,
        recentHealthRecords: recentHealthRecords.slice(0, 3),
        activePrescriptions: activePrescriptions.slice(0, 3),
        latestVitals,
        criticalAlerts: criticalAlerts.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard overview'
    });
  }
};

// Simple placeholder functions
const getPatientAppointments = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const patientId = req.user?._id || '507f1f77bcf86cd799439011';
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;

    console.log('📅 Fetching appointments for patient:', patientId);

    // Build filter query
    const filter = { patient: patientId };
    
    if (status) {
      filter.status = status;
    }
    
    if (startDate || endDate) {
      filter.appointmentDate = {};
      if (startDate) filter.appointmentDate.$gte = new Date(startDate);
      if (endDate) filter.appointmentDate.$lte = new Date(endDate);
    }

    // Get appointments with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [appointments, totalCount] = await Promise.all([
      Appointment.find(filter)
        .populate('doctor', 'firstName lastName specialization')
        .populate('patient', 'firstName lastName')
        .sort({ appointmentDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Appointment.countDocuments(filter)
    ]);

    console.log('✅ Appointments fetched:', appointments.length, 'of', totalCount);

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      totalCount,
      hasNext: skip + appointments.length < totalCount,
      hasPrev: parseInt(page) > 1
    };

    res.json({
      success: true,
      data: {
        appointments,
        pagination
      }
    });

  } catch (error) {
    console.error('❌ Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message
    });
  }
};

const getHealthRecords = (req, res) => {
  res.json({ success: true, data: { records: [], pagination: {} } });
};

const getHealthRecordDetails = (req, res) => {
  res.json({ success: true, data: null });
};

const getPrescriptions = (req, res) => {
  res.json({ success: true, data: { prescriptions: [], pagination: {} } });
};

const getMedicalHistory = (req, res) => {
  res.json({ success: true, data: null });
};

const getNotifications = (req, res) => {
  res.json({ success: true, data: { notifications: [], pagination: {} } });
};

const markNotificationRead = (req, res) => {
  res.json({ success: true, message: 'Notification marked as read' });
};

const getVitalSignsTrend = (req, res) => {
  res.json({ success: true, data: { type: 'bloodPressure', period: 30, trend: [] } });
};

module.exports = {
  getDashboardOverview,
  getPatientAppointments,
  getHealthRecords,
  getHealthRecordDetails,
  getPrescriptions,
  getMedicalHistory,
  getNotifications,
  markNotificationRead,
  getVitalSignsTrend
};
