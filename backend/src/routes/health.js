const express = require('express');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { authenticate, authorize, rateLimitSensitive } = require('../middleware/auth');
const { 
  validateObjectId, 
  handleValidationErrors 
} = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   POST /api/health/vitals
 * @desc    Record patient vital signs
 * @access  Private (Patient/Doctor)
 */
router.post('/vitals',
  authenticate,
  authorize('patient', 'doctor'),
  asyncHandler(async (req, res) => {
    const {
      patientId,
      vitals,
      recordedBy,
      deviceInfo,
      notes
    } = req.body;

    // Determine target patient
    const targetPatientId = patientId || req.user._id;

    // Check permissions
    if (req.user.role === 'patient' && targetPatientId !== req.user._id.toString()) {
      return res.status(403).json({
        error: true,
        message: 'Cannot record vitals for other patients'
      });
    }

    const patient = await User.findById(targetPatientId);
    if (!patient) {
      return res.status(404).json({
        error: true,
        message: 'Patient not found'
      });
    }

    // Validate vital signs
    const requiredVitals = ['bloodPressure', 'heartRate', 'temperature', 'oxygenSaturation'];
    const providedVitals = Object.keys(vitals);
    
    if (!providedVitals.some(vital => requiredVitals.includes(vital))) {
      return res.status(400).json({
        error: true,
        message: 'At least one vital sign is required'
      });
    }

    // Create vital signs record
    const vitalRecord = {
      timestamp: new Date(),
      vitals,
      recordedBy: recordedBy || req.user._id,
      recordedByRole: req.user.role,
      deviceInfo: deviceInfo || { source: 'manual' },
      notes,
      location: req.body.location,
      flags: []
    };

    // Add alert flags for abnormal values
    if (vitals.bloodPressure) {
      const [systolic, diastolic] = vitals.bloodPressure.split('/').map(Number);
      if (systolic > 140 || diastolic > 90) {
        vitalRecord.flags.push('high_blood_pressure');
      }
      if (systolic < 90 || diastolic < 60) {
        vitalRecord.flags.push('low_blood_pressure');
      }
    }

    if (vitals.heartRate) {
      if (vitals.heartRate > 100) {
        vitalRecord.flags.push('tachycardia');
      }
      if (vitals.heartRate < 60) {
        vitalRecord.flags.push('bradycardia');
      }
    }

    if (vitals.temperature) {
      if (vitals.temperature > 38.0) {
        vitalRecord.flags.push('fever');
      }
      if (vitals.temperature < 36.0) {
        vitalRecord.flags.push('hypothermia');
      }
    }

    if (vitals.oxygenSaturation && vitals.oxygenSaturation < 95) {
      vitalRecord.flags.push('low_oxygen_saturation');
    }

    // Initialize vital signs array if it doesn't exist
    if (!patient.medicalInfo) {
      patient.medicalInfo = {};
    }
    if (!patient.medicalInfo.vitalSigns) {
      patient.medicalInfo.vitalSigns = [];
    }

    patient.medicalInfo.vitalSigns.push(vitalRecord);

    // Keep only last 100 vital records to prevent excessive data growth
    if (patient.medicalInfo.vitalSigns.length > 100) {
      patient.medicalInfo.vitalSigns = patient.medicalInfo.vitalSigns.slice(-100);
    }

    await patient.save();

    // Log vital signs recording
    logger.audit('Vital signs recorded', req.user._id, {
      patientId: targetPatientId,
      recordedBy: req.user._id,
      vitalsRecorded: Object.keys(vitals),
      flags: vitalRecord.flags,
      ip: req.ip
    });

    // Send alerts if critical values detected
    if (vitalRecord.flags.length > 0) {
      logger.alert('Abnormal vital signs detected', {
        patientId: targetPatientId,
        vitals,
        flags: vitalRecord.flags,
        recordedBy: req.user._id
      });
    }

    res.json({
      success: true,
      message: 'Vital signs recorded successfully',
      data: {
        vitalRecord,
        flags: vitalRecord.flags,
        recommendations: vitalRecord.flags.length > 0 
          ? ['Consult healthcare provider', 'Monitor closely']
          : ['Vital signs within normal range']
      }
    });
  })
);

/**
 * @route   GET /api/health/vitals/:patientId
 * @desc    Get patient vital signs history
 * @access  Private (Patient/Doctor)
 */
router.get('/vitals/:patientId',
  authenticate,
  validateObjectId('patientId'),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { limit = 30, startDate, endDate } = req.query;

    // Check permissions
    const hasAccess = 
      req.user._id.toString() === patientId ||
      req.user.role === 'doctor' ||
      req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        error: true,
        message: 'Access denied'
      });
    }

    const patient = await User.findById(patientId).select('medicalInfo.vitalSigns firstName lastName');

    if (!patient) {
      return res.status(404).json({
        error: true,
        message: 'Patient not found'
      });
    }

    let vitalSigns = patient.medicalInfo?.vitalSigns || [];

    // Filter by date range if provided
    if (startDate || endDate) {
      vitalSigns = vitalSigns.filter(vital => {
        const vitalDate = new Date(vital.timestamp);
        if (startDate && vitalDate < new Date(startDate)) return false;
        if (endDate && vitalDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Sort by timestamp (newest first) and limit
    vitalSigns = vitalSigns
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit));

    // Calculate trends and statistics
    const stats = calculateVitalStats(vitalSigns);

    res.json({
      success: true,
      message: 'Vital signs retrieved successfully',
      data: {
        patient: {
          id: patient._id,
          name: `${patient.firstName} ${patient.lastName}`
        },
        vitalSigns,
        statistics: stats,
        recordsCount: vitalSigns.length
      }
    });
  })
);

/**
 * @route   POST /api/health/symptoms
 * @desc    Log patient symptoms
 * @access  Private (Patient)
 */
router.post('/symptoms',
  authenticate,
  authorize('patient'),
  asyncHandler(async (req, res) => {
    const {
      symptoms,
      severity,
      duration,
      triggers,
      notes,
      location
    } = req.body;

    if (!symptoms || symptoms.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'At least one symptom is required'
      });
    }

    const user = await User.findById(req.user._id);

    const symptomRecord = {
      timestamp: new Date(),
      symptoms: symptoms.map(symptom => ({
        name: symptom.name,
        severity: symptom.severity || severity,
        bodyPart: symptom.bodyPart,
        description: symptom.description
      })),
      overallSeverity: severity,
      duration,
      triggers: triggers || [],
      notes,
      location
    };

    // Initialize symptoms array if it doesn't exist
    if (!user.medicalInfo) {
      user.medicalInfo = {};
    }
    if (!user.medicalInfo.symptomHistory) {
      user.medicalInfo.symptomHistory = [];
    }

    user.medicalInfo.symptomHistory.push(symptomRecord);

    // Keep only last 50 symptom records
    if (user.medicalInfo.symptomHistory.length > 50) {
      user.medicalInfo.symptomHistory = user.medicalInfo.symptomHistory.slice(-50);
    }

    await user.save();

    // Check for severe symptoms that need immediate attention
    const severeSymptoms = symptoms.filter(s => s.severity >= 8 || 
      ['chest pain', 'difficulty breathing', 'severe headache', 'loss of consciousness'].includes(s.name.toLowerCase())
    );

    let urgencyLevel = 'low';
    let recommendations = ['Monitor symptoms', 'Rest and hydration'];

    if (severeSymptoms.length > 0 || severity >= 8) {
      urgencyLevel = 'high';
      recommendations = ['Seek immediate medical attention', 'Contact emergency services if needed'];
      
      logger.alert('Severe symptoms reported', {
        patientId: req.user._id,
        symptoms: severeSymptoms,
        severity,
        timestamp: new Date()
      });
    } else if (severity >= 6) {
      urgencyLevel = 'medium';
      recommendations = ['Consider scheduling a doctor appointment', 'Monitor symptoms closely'];
    }

    // Log symptom recording
    logger.audit('Symptoms logged', req.user._id, {
      patientId: req.user._id,
      symptomsCount: symptoms.length,
      overallSeverity: severity,
      urgencyLevel,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Symptoms logged successfully',
      data: {
        symptomRecord,
        urgencyLevel,
        recommendations,
        followUpSuggested: urgencyLevel !== 'low'
      }
    });
  })
);

/**
 * @route   GET /api/health/symptoms/:patientId
 * @desc    Get patient symptom history
 * @access  Private (Patient/Doctor)
 */
router.get('/symptoms/:patientId',
  authenticate,
  validateObjectId('patientId'),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { limit = 20, startDate, endDate } = req.query;

    // Check permissions
    const hasAccess = 
      req.user._id.toString() === patientId ||
      req.user.role === 'doctor' ||
      req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        error: true,
        message: 'Access denied'
      });
    }

    const patient = await User.findById(patientId).select('medicalInfo.symptomHistory firstName lastName');

    if (!patient) {
      return res.status(404).json({
        error: true,
        message: 'Patient not found'
      });
    }

    let symptomHistory = patient.medicalInfo?.symptomHistory || [];

    // Filter by date range if provided
    if (startDate || endDate) {
      symptomHistory = symptomHistory.filter(record => {
        const recordDate = new Date(record.timestamp);
        if (startDate && recordDate < new Date(startDate)) return false;
        if (endDate && recordDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Sort by timestamp (newest first) and limit
    symptomHistory = symptomHistory
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit));

    // Analyze symptom patterns
    const patterns = analyzeSymptomPatterns(symptomHistory);

    res.json({
      success: true,
      message: 'Symptom history retrieved successfully',
      data: {
        patient: {
          id: patient._id,
          name: `${patient.firstName} ${patient.lastName}`
        },
        symptomHistory,
        patterns,
        recordsCount: symptomHistory.length
      }
    });
  })
);

/**
 * @route   POST /api/health/wellness-goals
 * @desc    Set wellness goals
 * @access  Private (Patient)
 */
router.post('/wellness-goals',
  authenticate,
  authorize('patient'),
  asyncHandler(async (req, res) => {
    const {
      goals,
      targetDate,
      priority = 'medium'
    } = req.body;

    if (!goals || goals.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'At least one wellness goal is required'
      });
    }

    const user = await User.findById(req.user._id);

    const wellnessGoals = goals.map(goal => ({
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: goal.type, // 'fitness', 'nutrition', 'sleep', 'mental_health', 'weight', 'smoking_cessation'
      title: goal.title,
      description: goal.description,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue || 0,
      unit: goal.unit,
      targetDate: targetDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days default
      priority,
      status: 'active',
      createdAt: new Date(),
      milestones: goal.milestones || [],
      reminders: goal.reminders || []
    }));

    // Initialize wellness goals if it doesn't exist
    if (!user.medicalInfo) {
      user.medicalInfo = {};
    }
    if (!user.medicalInfo.wellnessGoals) {
      user.medicalInfo.wellnessGoals = [];
    }

    user.medicalInfo.wellnessGoals.push(...wellnessGoals);

    await user.save();

    // Log goal setting
    logger.audit('Wellness goals set', req.user._id, {
      patientId: req.user._id,
      goalsCount: goals.length,
      goalTypes: goals.map(g => g.type),
      priority,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Wellness goals set successfully',
      data: {
        goals: wellnessGoals,
        totalGoals: user.medicalInfo.wellnessGoals.length,
        recommendations: [
          'Set regular reminders to track progress',
          'Break down large goals into smaller milestones',
          'Celebrate small achievements along the way'
        ]
      }
    });
  })
);

/**
 * @route   PUT /api/health/wellness-goals/:goalId/progress
 * @desc    Update wellness goal progress
 * @access  Private (Patient)
 */
router.put('/wellness-goals/:goalId/progress',
  authenticate,
  authorize('patient'),
  asyncHandler(async (req, res) => {
    const { goalId } = req.params;
    const { currentValue, notes, milestone } = req.body;

    const user = await User.findById(req.user._id);
    
    if (!user.medicalInfo?.wellnessGoals) {
      return res.status(404).json({
        error: true,
        message: 'No wellness goals found'
      });
    }

    const goal = user.medicalInfo.wellnessGoals.find(g => g.id === goalId);
    if (!goal) {
      return res.status(404).json({
        error: true,
        message: 'Wellness goal not found'
      });
    }

    // Update progress
    const previousValue = goal.currentValue;
    goal.currentValue = currentValue;
    goal.lastUpdated = new Date();

    // Add progress entry
    if (!goal.progressHistory) {
      goal.progressHistory = [];
    }

    goal.progressHistory.push({
      date: new Date(),
      value: currentValue,
      notes,
      milestone: milestone || null
    });

    // Calculate progress percentage
    const progressPercentage = goal.targetValue > 0 
      ? Math.min((currentValue / goal.targetValue) * 100, 100)
      : 0;

    goal.progressPercentage = progressPercentage;

    // Check if goal is completed
    if (progressPercentage >= 100) {
      goal.status = 'completed';
      goal.completedAt = new Date();
    }

    await user.save();

    // Log progress update
    logger.audit('Wellness goal progress updated', req.user._id, {
      patientId: req.user._id,
      goalId,
      goalType: goal.type,
      previousValue,
      currentValue,
      progressPercentage,
      completed: goal.status === 'completed',
      ip: req.ip
    });

    const encouragement = generateEncouragement(goal, progressPercentage);

    res.json({
      success: true,
      message: 'Goal progress updated successfully',
      data: {
        goal,
        progressPercentage: Math.round(progressPercentage),
        improvement: currentValue - previousValue,
        encouragement,
        nextMilestone: goal.milestones?.find(m => m.value > currentValue)
      }
    });
  })
);

/**
 * @route   GET /api/health/wellness-dashboard
 * @desc    Get comprehensive wellness dashboard
 * @access  Private (Patient)
 */
router.get('/wellness-dashboard',
  authenticate,
  authorize('patient'),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    // Get recent vital signs
    const recentVitals = user.medicalInfo?.vitalSigns
      ?.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      ?.slice(0, 5) || [];

    // Get recent symptoms
    const recentSymptoms = user.medicalInfo?.symptomHistory
      ?.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      ?.slice(0, 5) || [];

    // Get active wellness goals
    const activeGoals = user.medicalInfo?.wellnessGoals
      ?.filter(goal => goal.status === 'active') || [];

    // Calculate health score (simplified algorithm)
    const healthScore = calculateHealthScore(user, recentVitals, recentSymptoms, activeGoals);

    // Get upcoming appointments
    const upcomingAppointments = await Appointment.find({
      patient: req.user._id,
      appointmentDate: { $gte: new Date() },
      status: 'scheduled'
    })
    .sort({ appointmentDate: 1 })
    .limit(3)
    .populate('doctor', 'firstName lastName specialization');

    const dashboard = {
      healthScore,
      vitalSigns: {
        latest: recentVitals[0] || null,
        trends: calculateVitalTrends(recentVitals)
      },
      symptoms: {
        recent: recentSymptoms.slice(0, 3),
        patterns: analyzeSymptomPatterns(recentSymptoms)
      },
      wellnessGoals: {
        active: activeGoals,
        progress: calculateOverallProgress(activeGoals)
      },
      upcomingAppointments,
      recommendations: generateHealthRecommendations(user, healthScore, recentVitals, recentSymptoms),
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      message: 'Wellness dashboard retrieved successfully',
      data: { dashboard }
    });
  })
);

// Helper functions
function calculateVitalStats(vitalSigns) {
  if (vitalSigns.length === 0) return null;

  const stats = {};
  const vitalTypes = ['heartRate', 'temperature', 'oxygenSaturation'];

  vitalTypes.forEach(type => {
    const values = vitalSigns
      .filter(v => v.vitals[type])
      .map(v => parseFloat(v.vitals[type]));

    if (values.length > 0) {
      stats[type] = {
        latest: values[0],
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        trend: values.length > 1 ? (values[0] - values[values.length - 1]) : 0
      };
    }
  });

  return stats;
}

function analyzeSymptomPatterns(symptomHistory) {
  if (symptomHistory.length === 0) return null;

  const patterns = {
    commonSymptoms: {},
    averageSeverity: 0,
    frequencyTrends: {}
  };

  let totalSeverity = 0;
  let totalSymptoms = 0;

  symptomHistory.forEach(record => {
    totalSeverity += record.overallSeverity || 0;
    
    record.symptoms.forEach(symptom => {
      patterns.commonSymptoms[symptom.name] = (patterns.commonSymptoms[symptom.name] || 0) + 1;
      totalSymptoms++;
    });
  });

  patterns.averageSeverity = totalSeverity / symptomHistory.length;

  return patterns;
}

function calculateHealthScore(user, vitals, symptoms, goals) {
  let score = 70; // Base score

  // Adjust based on recent vitals
  if (vitals.length > 0) {
    const latestVitals = vitals[0];
    if (latestVitals.flags && latestVitals.flags.length === 0) {
      score += 10; // Bonus for normal vitals
    } else {
      score -= latestVitals.flags.length * 5; // Penalty for abnormal vitals
    }
  }

  // Adjust based on symptoms
  if (symptoms.length > 0) {
    const recentSeverity = symptoms[0].overallSeverity || 0;
    score -= recentSeverity * 2; // Penalty for severe symptoms
  } else {
    score += 5; // Bonus for no recent symptoms
  }

  // Adjust based on wellness goals
  const goalProgress = calculateOverallProgress(goals);
  score += (goalProgress / 100) * 20; // Up to 20 points for goal progress

  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateVitalTrends(vitals) {
  if (vitals.length < 2) return null;

  const trends = {};
  const vitalTypes = ['heartRate', 'temperature', 'oxygenSaturation'];

  vitalTypes.forEach(type => {
    const values = vitals
      .filter(v => v.vitals[type])
      .map(v => parseFloat(v.vitals[type]));

    if (values.length >= 2) {
      const recent = values.slice(0, 3).reduce((sum, val) => sum + val, 0) / Math.min(3, values.length);
      const older = values.slice(-3).reduce((sum, val) => sum + val, 0) / Math.min(3, values.length);
      
      trends[type] = {
        direction: recent > older ? 'up' : recent < older ? 'down' : 'stable',
        change: Math.abs(recent - older)
      };
    }
  });

  return trends;
}

function calculateOverallProgress(goals) {
  if (goals.length === 0) return 0;

  const totalProgress = goals.reduce((sum, goal) => {
    return sum + (goal.progressPercentage || 0);
  }, 0);

  return Math.round(totalProgress / goals.length);
}

function generateEncouragement(goal, progressPercentage) {
  if (progressPercentage >= 100) {
    return "🎉 Congratulations! You've achieved your goal!";
  } else if (progressPercentage >= 75) {
    return "🔥 You're almost there! Keep up the great work!";
  } else if (progressPercentage >= 50) {
    return "💪 You're halfway there! Stay consistent!";
  } else if (progressPercentage >= 25) {
    return "📈 Good progress! Keep building momentum!";
  } else {
    return "🌱 Every step counts! You've got this!";
  }
}

function generateHealthRecommendations(user, healthScore, vitals, symptoms) {
  const recommendations = [];

  if (healthScore < 60) {
    recommendations.push('Consider scheduling a health checkup');
  }

  if (vitals.length === 0) {
    recommendations.push('Start tracking your vital signs regularly');
  }

  if (symptoms.length > 0) {
    const recentSeverity = symptoms[0].overallSeverity || 0;
    if (recentSeverity >= 6) {
      recommendations.push('Discuss recent symptoms with your healthcare provider');
    }
  }

  if (!user.medicalInfo?.wellnessGoals || user.medicalInfo.wellnessGoals.length === 0) {
    recommendations.push('Set some wellness goals to improve your health');
  }

  if (recommendations.length === 0) {
    recommendations.push('Keep up the good work with your health tracking!');
  }

  return recommendations;
}

module.exports = router;
