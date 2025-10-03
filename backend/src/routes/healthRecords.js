const express = require('express');
const router = express.Router();
const { S3Service, upload } = require('../services/s3Service');
const auth = require('../middleware/auth');
const HealthRecord = require('../models/HealthRecord');

// Upload health record
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { description, category, doctorId } = req.body;
    const userId = req.user.id;

    // Upload to S3
    const s3Result = await S3Service.uploadFile(req.file, userId, {
      description,
      category,
      doctorId
    });

    // Save record to database
    const healthRecord = new HealthRecord({
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
      s3Key: s3Result.key,
      s3Url: s3Result.url,
      description,
      category,
      patientId: userId,
      doctorId,
      uploadDate: new Date()
    });

    await healthRecord.save();

    res.status(201).json({
      success: true,
      record: healthRecord,
      message: 'Health record uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to upload health record',
      details: error.message
    });
  }
});

// Get user's health records
router.get('/my-records', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, dateRange, sortBy } = req.query;

    let query = { patientId: userId };
    
    // Add category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Add date range filter
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
      }
      
      if (startDate) {
        query.uploadDate = { $gte: startDate };
      }
    }

    // Set sort options
    let sortOptions = { uploadDate: -1 }; // Default: newest first
    if (sortBy === 'name-asc') sortOptions = { name: 1 };
    if (sortBy === 'name-desc') sortOptions = { name: -1 };
    if (sortBy === 'date-asc') sortOptions = { uploadDate: 1 };

    const records = await HealthRecord.find(query)
      .sort(sortOptions)
      .populate('doctorId', 'firstName lastName')
      .lean();

    // Generate signed URLs for secure access
    const recordsWithUrls = await Promise.all(
      records.map(async (record) => {
        try {
          const signedUrl = await S3Service.getSignedUrl(record.s3Key);
          return {
            ...record,
            downloadUrl: signedUrl
          };
        } catch (error) {
          console.error(`Error generating signed URL for ${record.s3Key}:`, error);
          return record;
        }
      })
    );

    res.json({
      success: true,
      records: recordsWithUrls
    });
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({
      error: 'Failed to fetch health records',
      details: error.message
    });
  }
});

// Get all records (for doctors)
router.get('/all-records', auth, async (req, res) => {
  try {
    // Check if user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Access denied. Doctors only.' });
    }

    const { patientId, category, dateRange, sortBy } = req.query;

    let query = {};
    
    // Add patient filter for specific patient
    if (patientId) {
      query.patientId = patientId;
    }

    // Add category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Add date range filter
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
      }
      
      if (startDate) {
        query.uploadDate = { $gte: startDate };
      }
    }

    // Set sort options
    let sortOptions = { uploadDate: -1 };
    if (sortBy === 'name-asc') sortOptions = { name: 1 };
    if (sortBy === 'name-desc') sortOptions = { name: -1 };
    if (sortBy === 'date-asc') sortOptions = { uploadDate: 1 };

    const records = await HealthRecord.find(query)
      .sort(sortOptions)
      .populate('patientId', 'firstName lastName')
      .populate('doctorId', 'firstName lastName')
      .lean();

    // Generate signed URLs
    const recordsWithUrls = await Promise.all(
      records.map(async (record) => {
        try {
          const signedUrl = await S3Service.getSignedUrl(record.s3Key);
          return {
            ...record,
            downloadUrl: signedUrl
          };
        } catch (error) {
          console.error(`Error generating signed URL for ${record.s3Key}:`, error);
          return record;
        }
      })
    );

    res.json({
      success: true,
      records: recordsWithUrls
    });
  } catch (error) {
    console.error('Get all records error:', error);
    res.status(500).json({
      error: 'Failed to fetch health records',
      details: error.message
    });
  }
});

// Download health record
router.get('/download/:recordId', auth, async (req, res) => {
  try {
    const { recordId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const record = await HealthRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ error: 'Health record not found' });
    }

    // Check permissions
    if (userRole !== 'doctor' && record.patientId.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Generate signed URL for download
    const downloadUrl = await S3Service.getSignedUrl(record.s3Key, 300); // 5 minutes

    res.json({
      success: true,
      downloadUrl,
      fileName: record.name
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      error: 'Failed to generate download link',
      details: error.message
    });
  }
});

// Delete health record
router.delete('/:recordId', auth, async (req, res) => {
  try {
    const { recordId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const record = await HealthRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ error: 'Health record not found' });
    }

    // Check permissions (only patient owner or doctor can delete)
    if (userRole !== 'doctor' && record.patientId.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete from S3
    await S3Service.deleteFile(record.s3Key);

    // Delete from database
    await HealthRecord.findByIdAndDelete(recordId);

    res.json({
      success: true,
      message: 'Health record deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      error: 'Failed to delete health record',
      details: error.message
    });
  }
});

// Bulk delete health records
router.delete('/bulk/delete', auth, async (req, res) => {
  try {
    const { recordIds } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return res.status(400).json({ error: 'No record IDs provided' });
    }

    const records = await HealthRecord.find({ _id: { $in: recordIds } });
    
    // Check permissions for each record
    for (const record of records) {
      if (userRole !== 'doctor' && record.patientId.toString() !== userId) {
        return res.status(403).json({ 
          error: `Access denied for record: ${record.name}` 
        });
      }
    }

    // Delete from S3
    await Promise.all(
      records.map(record => S3Service.deleteFile(record.s3Key))
    );

    // Delete from database
    await HealthRecord.deleteMany({ _id: { $in: recordIds } });

    res.json({
      success: true,
      message: `${records.length} health records deleted successfully`
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({
      error: 'Failed to delete health records',
      details: error.message
    });
  }
});

module.exports = router;