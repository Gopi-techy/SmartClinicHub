const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Medical Chat Route - Connect to Python ML Service
router.post('/medical-chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    
    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid message'
      });
    }

    // Check message length (prevent abuse)
    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Message too long. Please keep questions under 1000 characters.'
      });
    }

    // Configure Python ML service URL (adjust as needed)
    const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';
    
    // Make request to Python ML service
    const FormData = require('form-data');
    const fetch = require('node-fetch');
    
    const formData = new FormData();
    formData.append('msg', message.trim());

    const response = await fetch(`${ML_SERVICE_URL}/get`, {
      method: 'POST',
      body: formData,
      timeout: 30000 // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`ML service returned status: ${response.status}`);
    }

    const aiResponse = await response.text();
    
    // Log the interaction for monitoring (optional)
    console.log(`Medical Chat - User: ${req.user.id}, Message length: ${message.length}, Response length: ${aiResponse.length}`);
    
    res.json({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Medical chat error:', error);
    
    // Return user-friendly error message
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({
        success: false,
        message: 'Medical assistant is temporarily unavailable. Please try again later.',
        error: 'SERVICE_UNAVAILABLE'
      });
    }

    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request. Please try again.',
      error: 'INTERNAL_ERROR'
    });
  }
});

// Health check for ML service
router.get('/medical-chat/health', auth, async (req, res) => {
  try {
    const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';
    const fetch = require('node-fetch');
    
    const response = await fetch(`${ML_SERVICE_URL}/health`, {
      method: 'GET',
      timeout: 5000 // 5 second timeout
    });

    if (response.ok) {
      const healthData = await response.json();
      res.json({
        success: true,
        status: 'healthy',
        mlService: healthData
      });
    } else {
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        message: 'ML service is not responding properly'
      });
    }
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unavailable',
      message: 'ML service is not available'
    });
  }
});

module.exports = router;