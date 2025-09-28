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
 * @route   GET /api/ai/test
 * @desc    Test AI API connection
 * @access  Public (for testing)
 */
router.get('/test',
  asyncHandler(async (req, res) => {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const prompt = "Hello! This is a simple test. Please respond with 'Hello, I am working correctly!'";
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      res.json({
        success: true,
        message: 'AI connection test successful',
        data: {
          response: text,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        error: true,
        message: 'AI connection test failed',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  })
);

/**
 * @route   POST /api/ai/analyze-symptoms
 * @desc    AI-powered symptom analysis and recommendations
 * @access  Private
 */
router.post('/analyze-symptoms',
  authenticate,
  rateLimitSensitive,
  asyncHandler(async (req, res) => {
    const { symptoms, patientInfo, medicalHistory } = req.body;

    // Validate input
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one symptom'
      });
    }

    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash',
        generationConfig: {
          temperature: 0.3, // Lower temperature for more consistent medical responses
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 2048,
        },
      });
      
      // Create more concise prompt for faster response
      const prompt = `As a medical AI, analyze these symptoms and provide a concise JSON response:

SYMPTOMS: ${symptoms.map(s => `${s.name} (${s.severity}/10, ${s.duration})`).join(', ')}

Return ONLY valid JSON with this structure:
{
  "urgencyLevel": "low|medium|high",
  "urgencyExplanation": "brief explanation",
  "possibleConditions": [{"name": "condition", "likelihood": "percentage", "description": "brief desc"}],
  "medicationGuidance": [{"category": "Pain Relief", "medications": [{"name": "Acetaminophen", "dosage": "650mg every 4-6h", "precautions": "Max 3000mg/day"}]}],
  "recommendations": [{"action": "see doctor", "timeframe": "within 24h", "importance": "high"}],
  "warningSign": ["high fever", "difficulty breathing"],
  "disclaimer": "Consult healthcare providers for persistent symptoms"
}`;

      let result;
      let attempts = 0;
      const maxAttempts = 3;

      // Retry logic for overloaded service
      while (attempts < maxAttempts) {
        try {
          attempts++;
          console.log(`AI request attempt ${attempts}/${maxAttempts}`);
          
          result = await model.generateContent(prompt);
          break; // Success, exit retry loop
          
        } catch (retryError) {
          console.log(`Attempt ${attempts} failed:`, retryError.message);
          
          if (attempts === maxAttempts) {
            throw retryError; // Last attempt failed
          }
          
          // Wait before retrying (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempts - 1), 5000);
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      const response = await result.response;
      const aiResponse = response.text();

      let analysis;
      try {
        // Clean the response to extract JSON
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in AI response');
        }
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        throw new Error('Failed to parse AI response');
      }

      // Log successful analysis
      logger.audit('Symptom analysis completed', req.user._id, {
        symptomCount: symptoms.length,
        urgencyLevel: analysis.urgencyLevel,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Symptom analysis completed',
        analysis,
        source: 'gemini',
        analysisId: `symptom_${Date.now()}_${req.user._id}`,
        timestamp: new Date().toISOString(),
        patientId: req.user._id
      });

    } catch (error) {
      logger.error('AI symptom analysis error:', error);
      
      // Check if it's a service overload error
      if (error.message.includes('overloaded') || error.message.includes('503')) {
        return res.status(503).json({
          success: false,
          error: 'AI Service Temporarily Overloaded',
          message: 'The AI service is experiencing high traffic. Please try again in a few minutes.',
          details: {
            timestamp: new Date().toISOString(),
            service: 'symptom-analysis',
            retryAfter: '2-3 minutes'
          }
        });
      }
      
      // Check if it's a rate limit error
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return res.status(429).json({
          success: false,
          error: 'AI Service Rate Limited',
          message: 'Too many requests. Please wait a moment and try again.',
          details: {
            timestamp: new Date().toISOString(),
            service: 'symptom-analysis',
            retryAfter: '1 minute'
          }
        });
      }
      
      res.status(503).json({
        success: false,
        error: 'AI Service Temporarily Unavailable',
        message: 'Our AI service is currently unavailable. Please try again later or contact support.',
        details: {
          timestamp: new Date().toISOString(),
          service: 'symptom-analysis'
        }
      });
    }
  })
);

/**
 * @route   POST /api/ai/health-insights
 * @desc    Generate personalized health insights and recommendations
 * @access  Private
 */
router.post('/health-insights',
  authenticate,
  rateLimitSensitive,
  asyncHandler(async (req, res) => {
    const { goals, vitals, symptoms, lifestyle } = req.body;

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      const prompt = `
        You are a health AI assistant. Analyze the provided health data and generate personalized insights.
        
        HEALTH GOALS: ${JSON.stringify(goals || [])}
        VITALS: ${JSON.stringify(vitals || {})}
        RECENT SYMPTOMS: ${JSON.stringify(symptoms || [])}
        LIFESTYLE: ${JSON.stringify(lifestyle || {})}
        
        Provide a JSON response with:
        {
          "healthScore": {
            "overall": 85,
            "explanation": "explanation of score",
            "factors": {
              "diet": 80,
              "exercise": 90,
              "sleep": 75,
              "stress": 70,
              "preventiveCare": 85
            }
          },
          "insights": {
            "keyTrends": ["trend 1", "trend 2"],
            "riskAnalysis": [{"risk": "risk name", "level": "low|medium|high", "description": "description"}],
            "strengths": ["strength 1", "strength 2"],
            "improvements": ["improvement area 1", "improvement area 2"]
          },
          "recommendations": {
            "nutrition": [{"recommendation": "advice", "rationale": "reason"}],
            "exercise": [{"recommendation": "advice", "frequency": "how often"}],
            "mentalHealth": [{"recommendation": "advice", "techniques": ["technique 1"]}],
            "sleep": [{"recommendation": "advice", "implementation": "how to"}],
            "preventiveCare": [{"recommendation": "advice", "timeframe": "when"}]
          }
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text();

      let insights;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          insights = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in AI response');
        }
      } catch (parseError) {
        throw new Error('Failed to parse AI response');
      }

      res.json({
        success: true,
        message: 'Health insights generated successfully',
        data: {
          ...insights,
          insightsId: `health_${Date.now()}_${req.user._id}`,
          generatedAt: new Date().toISOString(),
          patientId: req.user._id
        }
      });

    } catch (error) {
      logger.error('Health insights AI error:', error);
      
      res.status(503).json({
        success: false,
        error: 'AI Service Temporarily Unavailable',
        message: 'Our AI service is currently unavailable. Please try again later.',
        service: 'health-insights'
      });
    }
  })
);

/**
 * @route   POST /api/ai/drug-interaction
 * @desc    Check for drug interactions using AI
 * @access  Private
 */
router.post('/drug-interaction',
  authenticate,
  rateLimitSensitive,
  asyncHandler(async (req, res) => {
    const { medications, supplements, conditions } = req.body;

    if (!medications || medications.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one medication'
      });
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      const prompt = `
        Analyze the following medications for potential drug interactions:
        
        MEDICATIONS: ${JSON.stringify(medications)}
        SUPPLEMENTS: ${JSON.stringify(supplements || [])}
        CONDITIONS: ${JSON.stringify(conditions || [])}
        
        Provide a JSON response with:
        {
          "riskLevel": "low|moderate|high|critical",
          "interactions": [
            {
              "medications": ["drug1", "drug2"],
              "severity": "minor|moderate|major|severe",
              "description": "interaction description",
              "recommendations": ["recommendation 1", "recommendation 2"]
            }
          ],
          "warnings": ["warning 1", "warning 2"],
          "monitoringAdvice": ["monitoring point 1", "monitoring point 2"],
          "alternatives": [
            {
              "original": "original medication",
              "alternatives": ["alternative 1", "alternative 2"],
              "reason": "why alternative is suggested"
            }
          ]
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text();

      let analysis;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in AI response');
        }
      } catch (parseError) {
        throw new Error('Failed to parse AI response');
      }

      res.json({
        success: true,
        message: 'Drug interaction analysis completed',
        data: analysis
      });

    } catch (error) {
      logger.error('Drug interaction AI error:', error);
      
      res.status(503).json({
        success: false,
        error: 'AI Service Temporarily Unavailable',
        message: 'Our AI service is currently unavailable. Please try again later.',
        service: 'drug-interaction'
      });
    }
  })
);

/**
 * @route   POST /api/ai/emergency-guidance
 * @desc    Get AI emergency guidance
 * @access  Private
 */
router.post('/emergency-guidance',
  authenticate,
  rateLimitSensitive,
  asyncHandler(async (req, res) => {
    const { situation, severity, symptoms } = req.body;

    if (!situation) {
      return res.status(400).json({
        success: false,
        message: 'Please describe the emergency situation'
      });
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      const prompt = `
        EMERGENCY MEDICAL SITUATION: ${situation}
        SEVERITY: ${severity || 'Not specified'}
        SYMPTOMS: ${JSON.stringify(symptoms || [])}
        
        Provide immediate emergency guidance in JSON format:
        {
          "callEmergency": true/false,
          "urgencyLevel": "immediate|urgent|standard",
          "immediateActions": ["action 1", "action 2"],
          "whatToDo": ["step 1", "step 2"],
          "whatNotToDo": ["avoid 1", "avoid 2"],
          "warningSign": ["warning 1", "warning 2"],
          "timeline": "when to act",
          "emergencyContacts": {
            "general": "911",
            "poison": "1-800-222-1222"
          }
        }
        
        CRITICAL: Always prioritize safety and recommend calling emergency services for life-threatening conditions.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text();

      let guidance;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          guidance = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in AI response');
        }
      } catch (parseError) {
        throw new Error('Failed to parse AI response');
      }

      res.json({
        success: true,
        message: 'Emergency guidance provided',
        data: guidance
      });

    } catch (error) {
      logger.error('Emergency guidance AI error:', error);
      
      res.status(503).json({
        success: false,
        error: 'AI Service Temporarily Unavailable',
        message: 'Our AI service is currently unavailable. For immediate emergencies, call 911.',
        service: 'emergency-guidance'
      });
    }
  })
);

module.exports = router;