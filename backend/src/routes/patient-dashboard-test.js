const express = require('express');
const router = express.Router();

// Test importing the controller
try {
  const patientDashboardController = require('../controllers/patientDashboardController');
  console.log('✅ Patient dashboard controller imported successfully');
} catch (error) {
  console.error('❌ Controller import error:', error.message);
  throw error;
}

// Simple test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Patient dashboard routes working with controller import'
  });
});

module.exports = router;
