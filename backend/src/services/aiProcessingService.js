const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');
const config = require('../config/config');

class AIProcessingService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    this.requestCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Generate cache key for request
   */
  generateCacheKey(prompt, model = 'gemini-pro') {
    const hash = require('crypto')
      .createHash('md5')
      .update(`${model}_${prompt}`)
      .digest('hex');
    return hash;
  }

  /**
   * Get cached response if available
   */
  getCachedResponse(cacheKey) {
    const cached = this.requestCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.response;
    }
    return null;
  }

  /**
   * Cache response
   */
  cacheResponse(cacheKey, response) {
    this.requestCache.set(cacheKey, {
      response,
      timestamp: Date.now()
    });

    // Clean up old cache entries periodically
    if (this.requestCache.size > 100) {
      const cutoff = Date.now() - this.cacheTimeout;
      for (const [key, value] of this.requestCache.entries()) {
        if (value.timestamp < cutoff) {
          this.requestCache.delete(key);
        }
      }
    }
  }

  /**
   * Process AI request with error handling and caching
   */
  async processAIRequest(prompt, model = 'gemini-pro', options = {}) {
    const cacheKey = this.generateCacheKey(prompt, model);
    
    // Check cache first
    if (!options.skipCache) {
      const cached = this.getCachedResponse(cacheKey);
      if (cached) {
        logger.info('AI request served from cache');
        return cached;
      }
    }

    try {
      const genModel = this.genAI.getGenerativeModel({ model });
      const result = await genModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Cache the response
      this.cacheResponse(cacheKey, text);

      logger.info('AI request processed successfully', {
        model,
        promptLength: prompt.length,
        responseLength: text.length
      });

      return text;
    } catch (error) {
      logger.error('AI processing failed:', error);
      throw new Error(`AI processing failed: ${error.message}`);
    }
  }

  /**
   * Analyze medical symptoms
   */
  async analyzeSymptoms(symptomsData) {
    const { symptoms, patientInfo, medicalHistory } = symptomsData;

    const prompt = `
      As a medical AI assistant, analyze the following symptoms and provide a comprehensive assessment.
      
      Patient Information:
      - Age: ${patientInfo.age || 'Not specified'}
      - Gender: ${patientInfo.gender || 'Not specified'}
      - Medical History: ${medicalHistory?.join(', ') || 'None'}
      
      Current Symptoms:
      ${symptoms.map(s => `- ${s.name}: ${s.description || ''} (Severity: ${s.severity}/10)`).join('\n')}
      
      Please provide:
      1. Possible conditions (with likelihood percentages)
      2. Urgency level (low, medium, high, emergency)
      3. Recommended immediate actions
      4. When to seek medical attention
      5. Possible complications to watch for
      6. Home care recommendations (if appropriate)
      
      Format the response as valid JSON with this structure:
      {
        "analysis": {
          "possibleConditions": [
            {
              "condition": "condition name",
              "likelihood": "percentage",
              "description": "brief description",
              "severity": "mild|moderate|severe"
            }
          ],
          "urgencyLevel": "low|medium|high|emergency",
          "urgencyReason": "explanation for urgency level",
          "immediateActions": ["action1", "action2"],
          "seekMedicalAttention": "when to see a doctor",
          "complications": ["complication1", "complication2"],
          "homeCare": ["suggestion1", "suggestion2"],
          "followUpRecommended": true/false,
          "redFlags": ["warning sign 1", "warning sign 2"]
        },
        "confidence": "high|medium|low",
        "disclaimer": "This analysis is AI-generated and should not replace professional medical advice."
      }
    `;

    try {
      const response = await this.processAIRequest(prompt);
      const analysis = JSON.parse(response);
      
      logger.audit('Symptom analysis completed', null, {
        symptomsCount: symptoms.length,
        urgencyLevel: analysis.analysis?.urgencyLevel,
        confidence: analysis.confidence
      });

      return analysis;
    } catch (error) {
      logger.error('Symptom analysis failed:', error);
      // Return fallback response
      return {
        analysis: {
          possibleConditions: [],
          urgencyLevel: 'medium',
          urgencyReason: 'Unable to complete analysis - please consult healthcare provider',
          immediateActions: ['Monitor symptoms', 'Seek medical advice'],
          seekMedicalAttention: 'If symptoms worsen or persist',
          complications: [],
          homeCare: ['Rest', 'Stay hydrated'],
          followUpRecommended: true,
          redFlags: ['Severe pain', 'Difficulty breathing', 'High fever']
        },
        confidence: 'low',
        disclaimer: 'AI analysis unavailable. Please consult a healthcare professional.',
        error: 'Analysis service temporarily unavailable'
      };
    }
  }

  /**
   * Generate appointment summary
   */
  async generateAppointmentSummary(appointmentData) {
    const { patient, doctor, symptoms, diagnosis, treatment, notes } = appointmentData;

    const prompt = `
      Generate a comprehensive medical appointment summary for the following consultation:
      
      Patient: ${patient.name}
      Doctor: Dr. ${doctor.name}
      Specialization: ${doctor.specialization}
      Date: ${appointmentData.date}
      
      Presenting Symptoms:
      ${symptoms?.join(', ') || 'Not specified'}
      
      Diagnosis: ${diagnosis || 'Not specified'}
      Treatment Provided: ${treatment || 'Not specified'}
      Additional Notes: ${notes || 'None'}
      
      Please generate a professional medical summary including:
      1. Chief complaint and history of present illness
      2. Clinical assessment and findings
      3. Primary and secondary diagnoses
      4. Treatment plan and interventions
      5. Medications prescribed (if any)
      6. Follow-up instructions
      7. Patient education provided
      8. Prognosis and expected outcomes
      
      Format as valid JSON:
      {
        "summary": {
          "chiefComplaint": "primary reason for visit",
          "historyPresentIllness": "detailed history",
          "clinicalAssessment": "examination findings and assessment",
          "primaryDiagnosis": "main diagnosis",
          "secondaryDiagnoses": ["diagnosis1", "diagnosis2"],
          "treatmentPlan": "treatment approach and interventions",
          "medications": ["medication1", "medication2"],
          "followUpInstructions": "follow-up care instructions",
          "patientEducation": ["education point 1", "education point 2"],
          "prognosis": "expected outcome",
          "nextAppointment": "recommended follow-up timing"
        },
        "keyPoints": ["important point 1", "important point 2"],
        "generatedAt": "${new Date().toISOString()}"
      }
    `;

    try {
      const response = await this.processAIRequest(prompt);
      const summary = JSON.parse(response);
      
      logger.audit('Appointment summary generated', null, {
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentDate: appointmentData.date
      });

      return summary;
    } catch (error) {
      logger.error('Appointment summary generation failed:', error);
      throw error;
    }
  }

  /**
   * Analyze drug interactions
   */
  async analyzeDrugInteractions(medicationsData) {
    const { medications, patientInfo } = medicationsData;

    const prompt = `
      Analyze potential drug interactions for the following medications:
      
      Patient Information:
      - Age: ${patientInfo.age || 'Not specified'}
      - Conditions: ${patientInfo.conditions?.join(', ') || 'None'}
      - Allergies: ${patientInfo.allergies?.join(', ') || 'None'}
      
      Medications:
      ${medications.map(med => `- ${med.name} ${med.dosage} (${med.frequency})`).join('\n')}
      
      Analyze for:
      1. Drug-drug interactions
      2. Drug-condition interactions
      3. Drug-allergy conflicts
      4. Age-related considerations
      5. Dosage adjustments needed
      6. Monitoring requirements
      
      Format as valid JSON:
      {
        "interactions": {
          "drugDrugInteractions": [
            {
              "drug1": "medication name",
              "drug2": "medication name",
              "severity": "minor|moderate|major|contraindicated",
              "mechanism": "interaction mechanism",
              "effect": "clinical effect",
              "management": "how to manage"
            }
          ],
          "drugConditionInteractions": [
            {
              "drug": "medication name",
              "condition": "medical condition",
              "concern": "potential issue",
              "recommendation": "suggested action"
            }
          ],
          "allergyConflicts": ["conflict1", "conflict2"],
          "ageConsiderations": "age-related considerations",
          "monitoringRequired": ["parameter1", "parameter2"],
          "dosageAdjustments": ["adjustment1", "adjustment2"]
        },
        "overallRisk": "low|moderate|high|critical",
        "criticalAlerts": ["alert1", "alert2"],
        "recommendations": ["recommendation1", "recommendation2"]
      }
    `;

    try {
      const response = await this.processAIRequest(prompt);
      const analysis = JSON.parse(response);
      
      logger.audit('Drug interaction analysis completed', null, {
        medicationsCount: medications.length,
        overallRisk: analysis.overallRisk,
        hasInteractions: analysis.interactions?.drugDrugInteractions?.length > 0
      });

      return analysis;
    } catch (error) {
      logger.error('Drug interaction analysis failed:', error);
      throw error;
    }
  }

  /**
   * Generate health insights
   */
  async generateHealthInsights(healthData) {
    const { patientData, vitalSigns, symptoms, appointments, goals } = healthData;

    const prompt = `
      Generate personalized health insights based on the following patient data:
      
      Patient Profile:
      - Age: ${patientData.age}
      - Gender: ${patientData.gender}
      - Conditions: ${patientData.conditions?.join(', ') || 'None'}
      - Medications: ${patientData.medications?.join(', ') || 'None'}
      
      Recent Vital Signs (last 5 readings):
      ${vitalSigns?.map(vs => `- ${vs.date}: BP ${vs.bloodPressure}, HR ${vs.heartRate}, Temp ${vs.temperature}°C`).join('\n') || 'No recent vitals'}
      
      Recent Symptoms:
      ${symptoms?.map(s => `- ${s.date}: ${s.symptoms.join(', ')} (Severity: ${s.severity})`).join('\n') || 'No recent symptoms'}
      
      Recent Medical Visits: ${appointments?.length || 0}
      Active Health Goals: ${goals?.length || 0}
      
      Provide comprehensive health insights including:
      1. Overall health status assessment
      2. Risk factor analysis
      3. Trend analysis from vital signs
      4. Preventive care recommendations
      5. Lifestyle recommendations
      6. Health goals suggestions
      7. Warning signs to monitor
      
      Format as valid JSON:
      {
        "insights": {
          "overallHealthStatus": "excellent|good|fair|poor",
          "healthScore": 85,
          "riskFactors": [
            {
              "factor": "risk factor name",
              "level": "low|moderate|high",
              "description": "explanation"
            }
          ],
          "vitalTrends": {
            "bloodPressure": "improving|stable|worsening",
            "heartRate": "improving|stable|worsening",
            "weight": "improving|stable|worsening"
          },
          "preventiveCare": [
            {
              "screening": "screening name",
              "due": "when due",
              "importance": "why important"
            }
          ],
          "lifestyleRecommendations": [
            {
              "category": "diet|exercise|sleep|stress",
              "recommendation": "specific advice",
              "impact": "expected benefit"
            }
          ],
          "healthGoals": [
            {
              "goal": "suggested goal",
              "timeframe": "timeline",
              "steps": ["step1", "step2"]
            }
          ],
          "warningSignsToWatch": ["sign1", "sign2"],
          "nextActions": ["action1", "action2"]
        },
        "improvementAreas": ["area1", "area2"],
        "strengths": ["strength1", "strength2"],
        "generatedAt": "${new Date().toISOString()}"
      }
    `;

    try {
      const response = await this.processAIRequest(prompt);
      const insights = JSON.parse(response);
      
      logger.audit('Health insights generated', null, {
        patientId: patientData.id,
        healthScore: insights.insights?.healthScore,
        riskFactorsCount: insights.insights?.riskFactors?.length
      });

      return insights;
    } catch (error) {
      logger.error('Health insights generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate emergency medical guidance
   */
  async generateEmergencyGuidance(emergencyData) {
    const { emergencyType, symptoms, patientInfo, location } = emergencyData;

    const prompt = `
      EMERGENCY MEDICAL GUIDANCE REQUEST - Provide immediate, clear, and actionable guidance.
      
      Emergency Type: ${emergencyType}
      Symptoms: ${symptoms?.join(', ') || 'Not specified'}
      Patient Age: ${patientInfo?.age || 'Unknown'}
      Location: ${location || 'Unknown'}
      
      Provide IMMEDIATE emergency guidance with:
      1. First priority actions (what to do RIGHT NOW)
      2. Whether to call emergency services (YES/NO with clear reasoning)
      3. Step-by-step immediate care instructions
      4. What NOT to do (contraindications)
      5. How to monitor the patient until help arrives
      6. CPR instructions if applicable
      7. Positioning and movement guidance
      
      Keep instructions simple, clear, and prioritize life-saving actions.
      
      Format as valid JSON:
      {
        "guidance": {
          "priority": "critical|high|medium",
          "callEmergencyServices": true/false,
          "emergencyNumber": "applicable number",
          "immediateActions": [
            {
              "step": 1,
              "action": "specific action",
              "timeframe": "how quickly"
            }
          ],
          "stepByStepInstructions": [
            {
              "step": 1,
              "instruction": "detailed instruction",
              "important": "key points"
            }
          ],
          "contraindications": ["what not to do"],
          "monitoringPoints": ["what to watch for"],
          "cprInstructions": {
            "required": true/false,
            "steps": ["step1", "step2"]
          },
          "positioningGuidance": "how to position patient",
          "timeframe": "how long to continue",
          "warningSignsToWatch": ["critical sign 1", "critical sign 2"]
        },
        "criticalNote": "CALL EMERGENCY SERVICES IMMEDIATELY",
        "disclaimer": "This is emergency AI guidance. Professional emergency services should be contacted immediately."
      }
    `;

    try {
      const response = await this.processAIRequest(prompt, 'gemini-pro', { skipCache: true });
      const guidance = JSON.parse(response);
      
      logger.emergency('Emergency guidance generated', {
        emergencyType,
        priority: guidance.guidance?.priority,
        callEmergencyServices: guidance.guidance?.callEmergencyServices,
        timestamp: new Date()
      });

      return guidance;
    } catch (error) {
      logger.error('Emergency guidance generation failed:', error);
      
      // Critical fallback for emergency situations
      return {
        guidance: {
          priority: 'critical',
          callEmergencyServices: true,
          emergencyNumber: '112',
          immediateActions: [
            {
              step: 1,
              action: 'Call emergency services immediately',
              timeframe: 'Now'
            },
            {
              step: 2,
              action: 'Check for responsiveness',
              timeframe: 'Immediately'
            },
            {
              step: 3,
              action: 'Check breathing and pulse',
              timeframe: 'Within 10 seconds'
            }
          ],
          stepByStepInstructions: [
            {
              step: 1,
              instruction: 'Call emergency services and provide location',
              important: 'Stay on the line with dispatcher'
            },
            {
              step: 2,
              instruction: 'Follow dispatcher instructions',
              important: 'Do not hang up unless told to do so'
            }
          ],
          contraindications: ['Do not move patient unless in immediate danger'],
          monitoringPoints: ['Breathing', 'Consciousness', 'Pulse'],
          cprInstructions: {
            required: false,
            steps: ['Only if trained and patient is unresponsive with no pulse']
          },
          positioningGuidance: 'Keep patient in current position unless unsafe',
          timeframe: 'Until emergency services arrive',
          warningSignsToWatch: ['Loss of consciousness', 'Stopped breathing', 'No pulse']
        },
        criticalNote: 'AI SERVICE UNAVAILABLE - CALL EMERGENCY SERVICES IMMEDIATELY',
        disclaimer: 'Emergency AI guidance unavailable. Contact professional emergency services immediately.',
        error: 'AI service temporarily unavailable'
      };
    }
  }

  /**
   * Process medical image analysis (placeholder for future implementation)
   */
  async analyzeMedicalImage(imageData) {
    // This would integrate with specialized medical AI models for image analysis
    // For now, return a placeholder response
    return {
      analysis: 'Medical image analysis feature coming soon',
      confidence: 'low',
      recommendations: ['Consult with radiologist for professional interpretation']
    };
  }

  /**
   * Clean up cache periodically
   */
  cleanupCache() {
    const cutoff = Date.now() - this.cacheTimeout;
    let cleaned = 0;
    
    for (const [key, value] of this.requestCache.entries()) {
      if (value.timestamp < cutoff) {
        this.requestCache.delete(key);
        cleaned++;
      }
    }
    
    logger.info(`Cleaned up ${cleaned} AI cache entries`);
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      cacheSize: this.requestCache.size,
      cacheTimeout: this.cacheTimeout,
      memoryUsage: process.memoryUsage()
    };
  }
}

module.exports = new AIProcessingService();
