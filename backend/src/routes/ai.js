const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { authenticate, authorize, rateLimitSensitive } = require('../middleware/auth');
const { 
  validateObjectId, 
  handleValidationErrors 
} = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const config = require('../config/config');

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

/**
 * @route   POST /api/ai/symptom-checker
 * @desc    AI-powered symptom checker
 * @access  Private (Patient)
 */
router.post('/symptom-checker',
  authenticate,
  authorize('patient'),
  rateLimitSensitive(10, 60 * 60 * 1000), // 10 requests per hour
  asyncHandler(async (req, res) => {
    const { symptoms, age, gender, medicalHistory = [], currentMedications = [] } = req.body;

    if (!symptoms || symptoms.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'Symptoms are required'
      });
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        As a medical AI assistant, analyze the following symptoms and provide a preliminary assessment.
        
        Patient Information:
        - Age: ${age || 'Not specified'}
        - Gender: ${gender || 'Not specified'}
        - Medical History: ${medicalHistory.join(', ') || 'None'}
        - Current Medications: ${currentMedications.join(', ') || 'None'}
        
        Symptoms: ${symptoms.join(', ')}
        
        Please provide:
        1. Possible conditions (ranked by likelihood)
        2. Urgency level (low, medium, high, emergency)
        3. Recommended actions
        4. When to seek medical attention
        5. Home care suggestions (if appropriate)
        
        Important disclaimer: This is not a substitute for professional medical advice.
        Format your response as JSON with the following structure:
        {
          "possibleConditions": [
            {
              "condition": "condition name",
              "likelihood": "percentage",
              "description": "brief description"
            }
          ],
          "urgencyLevel": "low|medium|high|emergency",
          "recommendedActions": ["action1", "action2"],
          "seekMedicalAttention": "when to see a doctor",
          "homeCare": ["suggestion1", "suggestion2"],
          "disclaimer": "medical disclaimer"
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text();

      // Try to parse as JSON, fallback to text if parsing fails
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(aiResponse);
      } catch (parseError) {
        parsedResponse = {
          analysis: aiResponse,
          urgencyLevel: 'medium',
          disclaimer: 'This is not a substitute for professional medical advice. Please consult a healthcare provider.'
        };
      }

      // Log AI consultation
      logger.audit('AI symptom checker used', req.user._id, {
        symptoms: symptoms.length,
        urgencyLevel: parsedResponse.urgencyLevel,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Symptom analysis completed',
        data: {
          analysis: parsedResponse,
          consultationId: `ai_${Date.now()}_${req.user._id}`,
          timestamp: new Date().toISOString(),
          recommendation: parsedResponse.urgencyLevel === 'emergency' 
            ? 'Seek immediate medical attention' 
            : 'Consider booking an appointment with a healthcare provider'
        }
      });

    } catch (error) {
      logger.error('AI symptom checker error:', error);
      res.status(500).json({
        error: true,
        message: 'AI service temporarily unavailable'
      });
    }
  })
);

/**
 * @route   POST /api/ai/emergency-guidance
 * @desc    Emergency AI guidance system
 * @access  Public (Emergency situations)
 */
router.post('/emergency-guidance',
  rateLimitSensitive(20, 60 * 60 * 1000), // 20 requests per hour for emergencies
  asyncHandler(async (req, res) => {
    const { emergencyType, symptoms, patientAge, location, additionalInfo } = req.body;

    if (!emergencyType) {
      return res.status(400).json({
        error: true,
        message: 'Emergency type is required'
      });
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        EMERGENCY MEDICAL GUIDANCE - This is a critical situation.
        
        Emergency Type: ${emergencyType}
        Symptoms: ${symptoms?.join(', ') || 'Not specified'}
        Patient Age: ${patientAge || 'Not specified'}
        Location: ${location || 'Not specified'}
        Additional Information: ${additionalInfo || 'None'}
        
        Provide IMMEDIATE, CLEAR, and ACTIONABLE emergency guidance:
        
        1. First priority actions (what to do RIGHT NOW)
        2. Call emergency services? (YES/NO with reasoning)
        3. Step-by-step immediate care instructions
        4. What NOT to do (contraindications)
        5. How to monitor the patient
        6. When to perform CPR (if applicable)
        7. Position/movement guidance
        
        Keep instructions simple, clear, and prioritize life-saving actions.
        Always emphasize calling emergency services for life-threatening conditions.
        
        Format as JSON:
        {
          "priority": "critical|high|medium",
          "callEmergencyServices": true/false,
          "emergencyNumber": "applicable emergency number",
          "immediateActions": ["action1", "action2"],
          "stepByStepInstructions": ["step1", "step2"],
          "doNotDo": ["avoid1", "avoid2"],
          "monitoringPoints": ["monitor1", "monitor2"],
          "cprRequired": true/false,
          "positioningGuidance": "positioning instructions",
          "timeframe": "how long to continue",
          "warningSignsToWatch": ["sign1", "sign2"]
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text();

      let guidance;
      try {
        guidance = JSON.parse(aiResponse);
      } catch (parseError) {
        // Fallback for critical situations
        guidance = {
          priority: 'critical',
          callEmergencyServices: true,
          emergencyNumber: '112',
          immediateActions: ['Call emergency services immediately', 'Stay with the patient'],
          stepByStepInstructions: aiResponse.split('\n').filter(line => line.trim()),
          disclaimer: 'This is emergency AI guidance. Call professional emergency services immediately.'
        };
      }

      // Log emergency AI consultation
      logger.emergency('Emergency AI guidance requested', {
        emergencyType,
        priority: guidance.priority,
        callEmergencyServices: guidance.callEmergencyServices,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Emergency guidance provided',
        data: {
          guidance,
          emergencyId: `emr_${Date.now()}_${req.ip.replace(/\./g, '')}`,
          timestamp: new Date().toISOString(),
          criticalNote: guidance.callEmergencyServices 
            ? 'CALL EMERGENCY SERVICES IMMEDIATELY' 
            : 'Follow the guidance carefully and monitor the situation'
        }
      });

    } catch (error) {
      logger.error('Emergency AI guidance error:', error);
      
      // Critical fallback response for emergencies
      res.json({
        success: true,
        message: 'Emergency guidance (fallback)',
        data: {
          guidance: {
            priority: 'critical',
            callEmergencyServices: true,
            emergencyNumber: '112',
            immediateActions: [
              'Call emergency services immediately',
              'Check for responsiveness',
              'Check breathing and pulse',
              'Begin CPR if needed'
            ],
            criticalNote: 'AI service unavailable - Call emergency services immediately for any life-threatening situation'
          }
        }
      });
    }
  })
);

/**
 * @route   POST /api/ai/triage
 * @desc    AI-powered patient triage system
 * @access  Private (Healthcare providers)
 */
router.post('/triage',
  authenticate,
  authorize('doctor', 'admin'),
  rateLimitSensitive(50, 60 * 60 * 1000), // 50 requests per hour
  asyncHandler(async (req, res) => {
    const { 
      patientId, 
      symptoms, 
      vitals, 
      painLevel, 
      duration, 
      patientHistory 
    } = req.body;

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        Medical Triage Assessment for Healthcare Provider
        
        Patient Symptoms: ${symptoms?.join(', ') || 'Not specified'}
        Vital Signs: ${JSON.stringify(vitals || {})}
        Pain Level (1-10): ${painLevel || 'Not specified'}
        Symptom Duration: ${duration || 'Not specified'}
        Medical History: ${patientHistory?.join(', ') || 'None'}
        
        Provide a comprehensive triage assessment:
        
        1. Triage Category (ESI 1-5 scale)
        2. Priority Level (Critical, Urgent, Less Urgent, Non-Urgent)
        3. Recommended Wait Time
        4. Immediate Interventions Needed
        5. Specialist Consultation Required
        6. Diagnostic Tests Recommended
        7. Risk Factors and Red Flags
        8. Monitoring Requirements
        
        Use Emergency Severity Index (ESI) guidelines.
        
        Format as JSON:
        {
          "triageCategory": 1-5,
          "priorityLevel": "Critical|Urgent|Less Urgent|Non-Urgent",
          "recommendedWaitTime": "time in minutes",
          "immediateInterventions": ["intervention1", "intervention2"],
          "specialistRequired": "specialty or none",
          "diagnosticTests": ["test1", "test2"],
          "riskFactors": ["risk1", "risk2"],
          "monitoringRequired": ["vital1", "vital2"],
          "dispositionRecommendation": "admit|discharge|observe",
          "followUpRequired": true/false,
          "notes": "additional clinical notes"
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text();

      let triageAssessment;
      try {
        triageAssessment = JSON.parse(aiResponse);
      } catch (parseError) {
        triageAssessment = {
          triageCategory: 3,
          priorityLevel: 'Less Urgent',
          analysis: aiResponse,
          note: 'Please review manually'
        };
      }

      // Log triage assessment
      logger.audit('AI triage assessment', req.user._id, {
        patientId,
        triageCategory: triageAssessment.triageCategory,
        priorityLevel: triageAssessment.priorityLevel,
        assessedBy: req.user._id,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Triage assessment completed',
        data: {
          assessment: triageAssessment,
          assessmentId: `triage_${Date.now()}_${patientId}`,
          assessedBy: req.user._id,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('AI triage error:', error);
      res.status(500).json({
        error: true,
        message: 'Triage AI service temporarily unavailable'
      });
    }
  })
);

/**
 * @route   POST /api/ai/medication-interaction
 * @desc    Check for drug interactions
 * @access  Private (Healthcare providers)
 */
router.post('/medication-interaction',
  authenticate,
  authorize('doctor', 'pharmacy'),
  rateLimitSensitive(30, 60 * 60 * 1000), // 30 requests per hour
  asyncHandler(async (req, res) => {
    const { medications, patientAge, patientConditions = [], allergies = [] } = req.body;

    if (!medications || medications.length < 2) {
      return res.status(400).json({
        error: true,
        message: 'At least two medications are required for interaction checking'
      });
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        Drug Interaction Analysis
        
        Medications: ${medications.map(med => `${med.name} ${med.dosage}`).join(', ')}
        Patient Age: ${patientAge || 'Not specified'}
        Medical Conditions: ${patientConditions.join(', ') || 'None'}
        Known Allergies: ${allergies.join(', ') || 'None'}
        
        Analyze potential drug interactions and provide:
        
        1. Drug-Drug Interactions (severity levels)
        2. Drug-Condition Interactions
        3. Drug-Allergy Conflicts
        4. Age-Related Considerations
        5. Dosage Adjustments Needed
        6. Monitoring Requirements
        7. Alternative Medications
        8. Clinical Recommendations
        
        Rate interactions as: Minor, Moderate, Major, Contraindicated
        
        Format as JSON:
        {
          "drugInteractions": [
            {
              "drug1": "medication name",
              "drug2": "medication name",
              "severity": "Minor|Moderate|Major|Contraindicated",
              "mechanism": "interaction mechanism",
              "clinicalEffect": "expected effect",
              "management": "how to manage"
            }
          ],
          "conditionInteractions": ["interaction1", "interaction2"],
          "allergyConflicts": ["conflict1", "conflict2"],
          "ageConsiderations": "age-related notes",
          "dosageAdjustments": ["adjustment1", "adjustment2"],
          "monitoringRequired": ["parameter1", "parameter2"],
          "alternatives": ["alternative1", "alternative2"],
          "overallRisk": "Low|Moderate|High|Critical",
          "recommendations": ["recommendation1", "recommendation2"]
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text();

      let interactionAnalysis;
      try {
        interactionAnalysis = JSON.parse(aiResponse);
      } catch (parseError) {
        interactionAnalysis = {
          analysis: aiResponse,
          overallRisk: 'Moderate',
          note: 'Please review manually with drug interaction database'
        };
      }

      // Log interaction check
      logger.audit('Drug interaction check', req.user._id, {
        medicationCount: medications.length,
        overallRisk: interactionAnalysis.overallRisk,
        hasInteractions: interactionAnalysis.drugInteractions?.length > 0,
        checkedBy: req.user._id,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Drug interaction analysis completed',
        data: {
          analysis: interactionAnalysis,
          checkId: `interaction_${Date.now()}_${req.user._id}`,
          checkedBy: req.user._id,
          timestamp: new Date().toISOString(),
          disclaimer: 'This analysis is AI-generated. Always verify with official drug interaction databases and clinical judgment.'
        }
      });

    } catch (error) {
      logger.error('Drug interaction AI error:', error);
      res.status(500).json({
        error: true,
        message: 'Drug interaction AI service temporarily unavailable'
      });
    }
  })
);

/**
 * @route   POST /api/ai/appointment-summary
 * @desc    Generate AI appointment summary
 * @access  Private (Doctor)
 */
router.post('/appointment-summary',
  authenticate,
  authorize('doctor'),
  validateObjectId('appointmentId'),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { appointmentId, consultationNotes, prescriptions } = req.body;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctor: req.user._id,
      status: 'completed'
    }).populate('patient', 'firstName lastName age medicalInfo');

    if (!appointment) {
      return res.status(404).json({
        error: true,
        message: 'Appointment not found or not accessible'
      });
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        Generate a comprehensive medical appointment summary:
        
        Patient: ${appointment.patient.firstName} ${appointment.patient.lastName}
        Age: ${appointment.patient.age || 'Not specified'}
        Appointment Date: ${appointment.appointmentDate}
        Type: ${appointment.type}
        
        Consultation Notes:
        - Symptoms: ${consultationNotes.symptoms || appointment.symptoms?.join(', ') || 'None recorded'}
        - Diagnosis: ${consultationNotes.diagnosis || 'Not specified'}
        - Treatment: ${consultationNotes.treatment || 'Not specified'}
        - Recommendations: ${consultationNotes.recommendations || 'None'}
        
        Prescriptions: ${prescriptions?.map(p => `${p.medication} - ${p.dosage} - ${p.frequency}`).join(', ') || 'None'}
        
        Generate a professional medical summary including:
        1. Clinical Assessment
        2. Diagnosis Summary
        3. Treatment Plan
        4. Medication Summary
        5. Follow-up Requirements
        6. Patient Education Points
        7. Prognosis
        
        Format as JSON:
        {
          "clinicalAssessment": "detailed assessment",
          "diagnosisSummary": "primary and secondary diagnoses",
          "treatmentPlan": "current treatment approach",
          "medicationSummary": "prescribed medications and rationale",
          "followUpRequired": true/false,
          "followUpInstructions": "follow-up details",
          "patientEducation": ["education point 1", "education point 2"],
          "prognosis": "expected outcome",
          "redFlags": ["warning sign 1", "warning sign 2"],
          "lifestyleRecommendations": ["recommendation 1", "recommendation 2"]
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text();

      let summary;
      try {
        summary = JSON.parse(aiResponse);
      } catch (parseError) {
        summary = {
          summary: aiResponse,
          note: 'Summary generated successfully'
        };
      }

      // Log summary generation
      logger.audit('AI appointment summary generated', req.user._id, {
        appointmentId,
        patientId: appointment.patient._id,
        generatedBy: req.user._id,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Appointment summary generated',
        data: {
          summary,
          appointmentId,
          patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
          summaryId: `summary_${Date.now()}_${appointmentId}`,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Appointment summary AI error:', error);
      res.status(500).json({
        error: true,
        message: 'Summary generation service temporarily unavailable'
      });
    }
  })
);

/**
 * @route   GET /api/ai/health-insights/:patientId
 * @desc    Generate personalized health insights
 * @access  Private (Patient or Doctor with permission)
 */
router.get('/health-insights/:patientId',
  authenticate,
  validateObjectId('patientId'),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;

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

    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        error: true,
        message: 'Patient not found'
      });
    }

    // Get recent appointments
    const recentAppointments = await Appointment.find({
      patient: patientId,
      status: 'completed'
    })
    .sort({ appointmentDate: -1 })
    .limit(5)
    .lean();

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        Generate personalized health insights for patient:
        
        Patient Info:
        - Age: ${patient.age || 'Not specified'}
        - Gender: ${patient.gender || 'Not specified'}
        - Medical History: ${patient.medicalInfo?.medicalConditions?.join(', ') || 'None'}
        - Current Medications: ${patient.medicalInfo?.medications?.join(', ') || 'None'}
        - Allergies: ${patient.medicalInfo?.allergies?.join(', ') || 'None'}
        - BMI: ${patient.medicalInfo?.bmi || 'Not calculated'}
        
        Recent Medical Visits: ${recentAppointments.length} in the last period
        Recent Diagnoses: ${recentAppointments.map(apt => apt.consultationNotes?.diagnosis).filter(Boolean).join(', ') || 'None'}
        
        Provide personalized health insights:
        1. Health Status Overview
        2. Risk Factor Analysis
        3. Preventive Care Recommendations
        4. Lifestyle Recommendations
        5. Screening Recommendations
        6. Health Goals Suggestions
        7. Warning Signs to Watch
        
        Format as JSON:
        {
          "healthStatusOverview": "overall health assessment",
          "riskFactors": ["risk1", "risk2"],
          "preventiveCare": ["screening1", "screening2"],
          "lifestyleRecommendations": [
            {
              "category": "diet|exercise|lifestyle",
              "recommendation": "specific recommendation",
              "rationale": "why this is important"
            }
          ],
          "healthGoals": ["goal1", "goal2"],
          "warningSignsToWatch": ["sign1", "sign2"],
          "nextSteps": ["step1", "step2"],
          "overallScore": "number 1-10",
          "improvementAreas": ["area1", "area2"]
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text();

      let insights;
      try {
        insights = JSON.parse(aiResponse);
      } catch (parseError) {
        insights = {
          overview: aiResponse,
          note: 'Insights generated successfully'
        };
      }

      // Log insights generation
      logger.audit('Health insights generated', req.user._id, {
        patientId,
        generatedBy: req.user._id,
        overallScore: insights.overallScore,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Health insights generated',
        data: {
          insights,
          patientId,
          insightsId: `insights_${Date.now()}_${patientId}`,
          generatedAt: new Date().toISOString(),
          disclaimer: 'These insights are AI-generated and should not replace professional medical advice.'
        }
      });

    } catch (error) {
      logger.error('Health insights AI error:', error);
      res.status(500).json({
        error: true,
        message: 'Health insights service temporarily unavailable'
      });
    }
  })
);

module.exports = router;
