const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const HealthRecord = require('../models/HealthRecord');
const MedicalHistory = require('../models/MedicalHistory');
const Notification = require('../models/Notification');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Patient Dashboard Controller
 * Handles all patient dashboard related operations
 */

// Get dashboard overview
const getDashboardOverview = async (req, res) => {
  try {
    // Get authenticated patient ID
    const patientId = req.user.id;

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

    // Get recent health records
    const recentHealthRecords = await HealthRecord.find({
      patient: patientId
    })
    .sort({ recordDate: -1 })
    .limit(5)
    .populate('recordedBy', 'firstName lastName')
    .lean();

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

    // Get unread notifications count
    const unreadNotifications = await Notification.countDocuments({
      recipient: patientId,
      read: false
    });

    // Get latest vital signs
    const latestVitals = await HealthRecord.findOne({
      patient: patientId,
      recordType: 'vital-signs',
      'vitalSigns.0': { $exists: true }
    })
    .sort({ recordDate: -1 })
    .select('vitalSigns recordDate')
    .lean();

    // Get medical alerts
    const medicalHistory = await MedicalHistory.findOne({ patient: patientId })
      .select('allergies conditions')
      .lean();

    const criticalAlerts = [];
    if (medicalHistory) {
      // Check for critical allergies
      const criticalAllergies = medicalHistory.allergies?.filter(
        allergy => allergy.severity === 'severe' && allergy.status === 'active'
      ) || [];
      
      criticalAlerts.push(...criticalAllergies.map(allergy => ({
        type: 'allergy',
        message: `Severe allergy to ${allergy.allergen}`,
        severity: 'critical'
      })));

      // Check for active chronic conditions
      const chronicConditions = medicalHistory.conditions?.filter(
        condition => condition.status === 'active' && condition.severity === 'severe'
      ) || [];

      criticalAlerts.push(...chronicConditions.map(condition => ({
        type: 'condition',
        message: `Active condition: ${condition.name}`,
        severity: 'high'
      })));
    }

    // Calculate health score (dynamic algorithm based on real data)
    let healthScore = null; // Start with null for new patients
    
    if (latestVitals?.vitalSigns?.length > 0 || medicalHistory) {
      healthScore = 100; // Base score for patients with data
      
      if (latestVitals?.vitalSigns?.length > 0) {
        const vitals = latestVitals.vitalSigns[0];
        
        // Adjust based on vital signs
        if (vitals.bloodPressure?.systolic > 140 || vitals.bloodPressure?.diastolic > 90) {
          healthScore -= 15;
        } else if (vitals.bloodPressure?.systolic > 130 || vitals.bloodPressure?.diastolic > 80) {
          healthScore -= 5;
        }
        
        if (vitals.heartRate < 60 || vitals.heartRate > 100) {
          healthScore -= 8;
        }
        
        if (vitals.temperature > 99.5) {
          healthScore -= 12;
        }
        
        if (vitals.oxygenSaturation && vitals.oxygenSaturation < 95) {
          healthScore -= 20;
        }
      }

      // Adjust for chronic conditions and allergies
      if (medicalHistory) {
        const activeConditions = medicalHistory.conditions?.filter(c => c.status === 'active') || [];
        const severeAllergies = medicalHistory.allergies?.filter(a => a.severity === 'severe' && a.status === 'active') || [];
        
        healthScore -= activeConditions.length * 8;
        healthScore -= severeAllergies.length * 5;
      }
      
      // Adjust for critical alerts
      healthScore -= criticalAlerts.length * 10;
      
      // Ensure score is between 0 and 100
      healthScore = Math.max(0, Math.min(100, healthScore));
    }

    res.json({
      success: true,
      data: {
        overview: {
          upcomingAppointments: upcomingAppointments.length,
          recentHealthRecords: recentHealthRecords.length,
          activePrescriptions: activePrescriptions.length,
          unreadNotifications,
          healthScore: healthScore // Can be null for new patients
        },
        upcomingAppointments,
        recentHealthRecords: recentHealthRecords.slice(0, 3),
        activePrescriptions: activePrescriptions.slice(0, 3),
        latestVitals: latestVitals?.vitalSigns?.[0] || null,
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

// Get patient appointments with filtering
const getPatientAppointments = async (req, res) => {
  try {
    const patientId = req.user.id;
    const {
      page = 1,
      limit = 10,
      status = 'all',
      dateRange = 'all',
      doctorId
    } = req.query;

    const query = { patient: patientId };

    // Filter by status
    if (status !== 'all') {
      query.status = status;
    }

    // Filter by date range
    const now = new Date();
    switch (dateRange) {
      case 'upcoming':
        query.appointmentDate = { $gte: now };
        break;
      case 'past':
        query.appointmentDate = { $lt: now };
        break;
      case 'thisWeek':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        query.appointmentDate = { $gte: weekStart, $lte: weekEnd };
        break;
      case 'thisMonth':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        query.appointmentDate = { $gte: monthStart, $lte: monthEnd };
        break;
    }

    // Filter by doctor
    if (doctorId) {
      query.doctor = doctorId;
    }

    const appointments = await Appointment.find(query)
      .sort({ appointmentDate: dateRange === 'past' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('doctor', 'firstName lastName professionalInfo.specialization contactInfo.phone')
      .lean();

    const total = await Appointment.countDocuments(query);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments'
    });
  }
};

// Get patient health records
const getHealthRecords = async (req, res) => {
  try {
    const patientId = req.user.id;
    const {
      page = 1,
      limit = 10,
      type = 'all',
      dateFrom,
      dateTo
    } = req.query;

    const query = { patient: patientId };

    // Filter by record type
    if (type !== 'all') {
      query.recordType = type;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      query.recordDate = {};
      if (dateFrom) query.recordDate.$gte = new Date(dateFrom);
      if (dateTo) query.recordDate.$lte = new Date(dateTo);
    }

    const records = await HealthRecord.find(query)
      .sort({ recordDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('recordedBy', 'firstName lastName professionalInfo.specialization')
      .populate('relatedAppointment', 'appointmentDate type')
      .lean();

    const total = await HealthRecord.countDocuments(query);

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get health records error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health records'
    });
  }
};

// Get detailed health record
const getHealthRecordDetails = async (req, res) => {
  try {
    const { recordId } = req.params;
    const patientId = req.user.id;

    const record = await HealthRecord.findOne({
      _id: recordId,
      patient: patientId
    })
    .populate('recordedBy', 'firstName lastName professionalInfo.specialization contactInfo')
    .populate('relatedAppointment', 'appointmentDate type doctor')
    .lean();

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Health record not found'
      });
    }

    res.json({
      success: true,
      data: record
    });

  } catch (error) {
    console.error('Get health record details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health record details'
    });
  }
};

// Get patient prescriptions
const getPrescriptions = async (req, res) => {
  try {
    const patientId = req.user.id;
    const {
      page = 1,
      limit = 10,
      status = 'all',
      medication
    } = req.query;

    const query = { patient: patientId };

    // Filter by status
    if (status !== 'all') {
      query.status = status;
    }

    // Search by medication
    if (medication) {
      query['medications.name'] = { $regex: medication, $options: 'i' };
    }

    const prescriptions = await Prescription.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('prescribedBy', 'firstName lastName professionalInfo.specialization')
      .populate('relatedAppointment', 'appointmentDate type')
      .lean();

    const total = await Prescription.countDocuments(query);

    res.json({
      success: true,
      data: {
        prescriptions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prescriptions'
    });
  }
};

// Get medical history
const getMedicalHistory = async (req, res) => {
  try {
    const patientId = req.user.id;

    const medicalHistory = await MedicalHistory.findOne({ patient: patientId })
      .populate('patient', 'firstName lastName dateOfBirth demographics.gender')
      .lean();

    if (!medicalHistory) {
      return res.json({
        success: true,
        data: {
          patient: patientId,
          allergies: [],
          conditions: [],
          medications: [],
          surgeries: [],
          familyHistory: [],
          lifestyle: {},
          immunizations: [],
          emergencyContacts: [],
          insurance: {}
        }
      });
    }

    res.json({
      success: true,
      data: medicalHistory
    });

  } catch (error) {
    console.error('Get medical history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medical history'
    });
  }
};

// Get patient notifications
const getNotifications = async (req, res) => {
  try {
    const patientId = req.user.id;
    const {
      page = 1,
      limit = 20,
      type,
      status,
      priority
    } = req.query;

    const query = { recipient: patientId };
    
    if (type) query.type = type;
    if (status) query.read = status === 'read';
    if (priority) query.priority = priority;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Notification.countDocuments(query);

    const result = {
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

// Mark notification as read
const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const patientId = req.user.id;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: patientId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await Notification.findByIdAndUpdate(notificationId, { 
      read: true, 
      readAt: new Date() 
    });

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

// Get vital signs trend
const getVitalSignsTrend = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { 
      type = 'bloodPressure', // bloodPressure, heartRate, temperature, weight
      period = '30', // days
      limit = 50 
    } = req.query;

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parseInt(period));

    const records = await HealthRecord.find({
      patient: patientId,
      recordType: 'vital-signs',
      recordDate: { $gte: dateFrom },
      'vitalSigns.0': { $exists: true }
    })
    .sort({ recordDate: 1 })
    .limit(parseInt(limit))
    .select('vitalSigns recordDate')
    .lean();

    // Extract trend data
    const trendData = records.map(record => {
      const vital = record.vitalSigns[0];
      let value = null;

      switch (type) {
        case 'bloodPressure':
          value = vital.bloodPressure ? {
            systolic: vital.bloodPressure.systolic,
            diastolic: vital.bloodPressure.diastolic
          } : null;
          break;
        case 'heartRate':
          value = vital.heartRate;
          break;
        case 'temperature':
          value = vital.temperature;
          break;
        case 'weight':
          value = vital.weight;
          break;
        case 'height':
          value = vital.height;
          break;
      }

      return {
        date: record.recordDate,
        value
      };
    }).filter(item => item.value !== null);

    res.json({
      success: true,
      data: {
        type,
        period: parseInt(period),
        trend: trendData
      }
    });

  } catch (error) {
    console.error('Get vitals trend error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vital signs trend'
    });
  }
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
