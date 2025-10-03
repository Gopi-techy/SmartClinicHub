const express = require('express');
const router = express.Router();
const { S3Service, upload } = require('../services/s3ServiceSimple');
const { authenticate } = require('../middleware/auth');
const HealthRecord = require('../models/HealthRecord');

// Upload health record
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file provided' 
      });
    }

    const { description, category, doctorId } = req.body;
    
    // Use authenticated user's ID - this is already a valid ObjectId from JWT
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'User ID not found in authentication token' 
      });
    }
    
    // Validate category
    const validCategories = ['Lab Results', 'Prescriptions', 'Imaging', 'Insurance', 'Personal Notes', 'Other'];
    const fileCategory = validCategories.includes(category) ? category : 'Other';

    console.log(`Uploading file for user ${userId}, category: ${fileCategory}`);

    // Upload to S3
    const s3Result = await S3Service.uploadFile(req.file, userId, {
      description: description || '',
      category: fileCategory,
      doctorId: doctorId || null
    });

    if (!s3Result || !s3Result.key || !s3Result.url) {
      throw new Error('Failed to upload file to S3 - invalid response');
    }

    console.log(`S3 upload successful: ${s3Result.key}`);

    // Save record to database
    const healthRecord = new HealthRecord({
      patient: userId,                    // Use authenticated user's ObjectId
      recordType: 'imaging',              // Required: Record type (files are usually imaging/documents)
      recordDate: new Date(),
      recordedBy: userId,                 // Who uploaded the file (authenticated user)
      s3Files: [{                         // Store file info in s3Files array
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
        s3Key: s3Result.key,
        s3Url: s3Result.url,
        description: description || '',
        category: fileCategory,
        uploadDate: new Date(),
        uploadedBy: userId                // Use authenticated user's ObjectId
      }],
      notes: description || '',           // Store description in notes as well
      status: 'active'
    });

    const savedRecord = await healthRecord.save();
    console.log(`Database save successful: ${savedRecord._id}`);

    res.status(201).json({
      success: true,
      record: savedRecord,
      message: 'Health record uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Determine appropriate error status
    let statusCode = 500;
    if (error.name === 'ValidationError') {
      statusCode = 400;
    } else if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
      statusCode = 401;
    }
    
    res.status(statusCode).json({
      success: false,
      error: 'Failed to upload health record',
      details: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Get user's health records
router.get('/my-records', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, dateRange, sortBy } = req.query;

    let query = { patient: userId, status: 'active' };
    
    // Add category filter - handle s3Files structure
    if (category && category !== 'all') {
      query['s3Files.category'] = category;
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
        query.recordDate = { $gte: startDate };
      }
    }

    // Set sort options
    let sortOptions = { recordDate: -1 }; // Default: newest first
    if (sortBy === 'name-asc') sortOptions = { 's3Files.name': 1 };
    if (sortBy === 'name-desc') sortOptions = { 's3Files.name': -1 };
    if (sortBy === 'date-asc') sortOptions = { recordDate: 1 };

    const records = await HealthRecord.find(query)
      .sort(sortOptions)
      .populate('patient', 'firstName lastName')
      .populate('recordedBy', 'firstName lastName')
      .lean();

    // Remove duplicates based on s3Key and filter out malformed records
    const uniqueRecords = [];
    const seenKeys = new Set();
    
    for (const record of records) {
      // Skip records without s3Files or with malformed s3Files
      if (!record.s3Files || !Array.isArray(record.s3Files) || record.s3Files.length === 0) {
        console.warn(`Skipping malformed record ${record._id}: no s3Files array`);
        continue;
      }
      
      // Check if first file has required fields
      const firstFile = record.s3Files[0];
      if (!firstFile || !firstFile.s3Key || !firstFile.name) {
        console.warn(`Skipping malformed record ${record._id}: missing required s3File fields`);
        continue;
      }
      
      const s3Key = firstFile.s3Key;
      if (!seenKeys.has(s3Key)) {
        seenKeys.add(s3Key);
        uniqueRecords.push(record);
      }
    }

    // Generate signed URLs for secure access
    const recordsWithUrls = await Promise.all(
      uniqueRecords.map(async (record) => {
        try {
          // Handle the new s3Files array structure
          if (record.s3Files && record.s3Files.length > 0) {
            // Generate signed URLs for each file in the record
            const filesWithUrls = await Promise.all(
              record.s3Files.map(async (file) => {
                try {
                  // Check if s3Key exists before generating signed URL
                  if (!file.s3Key) {
                    console.warn(`Missing s3Key for file: ${file.name || 'unknown'}`);
                    return file;
                  }
                  
                  const signedUrl = await S3Service.getSignedUrl(file.s3Key);
                  return {
                    ...file,
                    downloadUrl: signedUrl
                  };
                } catch (error) {
                  console.error(`Error generating signed URL for ${file.s3Key}:`, error);
                  return file;
                }
              })
            );
            
            return {
              ...record,
              s3Files: filesWithUrls,
              // For backward compatibility, if there's only one file, expose it at root level
              ...(record.s3Files.length === 1 && {
                downloadUrl: filesWithUrls[0].downloadUrl,
                name: filesWithUrls[0].name,
                type: filesWithUrls[0].type,
                size: filesWithUrls[0].size
              })
            };
          }
          
          return record;
        } catch (error) {
          console.error(`Error processing record ${record._id}:`, error);
          return record;
        }
      })
    );

    res.json({
      success: true,
      records: recordsWithUrls,
      total: recordsWithUrls.length
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
router.get('/all-records', authenticate, async (req, res) => {
  try {
    // Check if user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Access denied. Doctors only.' });
    }

    const { patientId, category, dateRange, sortBy } = req.query;

    let query = { status: 'active' };
    
    // Add patient filter for specific patient
    if (patientId) {
      query.patient = patientId;
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
      .populate('patient', 'firstName lastName')
      .populate('recordedBy', 'firstName lastName')
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
router.get('/:recordId/download', authenticate, async (req, res) => {
  try {
    const { recordId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const record = await HealthRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ error: 'Health record not found' });
    }

    // Check permissions
    if (userRole !== 'doctor' && record.patient.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get the S3 key from the s3Files array
    if (!record.s3Files || record.s3Files.length === 0) {
      return res.status(404).json({ error: 'No files found for this record' });
    }

    const s3Key = record.s3Files[0].s3Key;
    const fileName = record.s3Files[0].name;

    // Generate signed URL for download
    const downloadUrl = await S3Service.getSignedUrl(s3Key, 300); // 5 minutes

    res.json({
      success: true,
      downloadUrl,
      fileName
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
router.delete('/:recordId', authenticate, async (req, res) => {
  try {
    const { recordId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const record = await HealthRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ error: 'Health record not found' });
    }

    // Check permissions (only patient owner or doctor can delete)
    if (userRole !== 'doctor' && record.patient.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete files from S3
    if (record.s3Files && record.s3Files.length > 0) {
      for (const file of record.s3Files) {
        try {
          await S3Service.deleteFile(file.s3Key);
        } catch (error) {
          console.error(`Failed to delete S3 file ${file.s3Key}:`, error);
          // Continue with database deletion even if S3 deletion fails
        }
      }
    }

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
router.delete('/bulk/delete', authenticate, async (req, res) => {
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
      if (userRole !== 'doctor' && record.patient.toString() !== userId) {
        return res.status(403).json({ 
          error: `Access denied for record: ${record.s3Files?.[0]?.name || 'Unknown'}` 
        });
      }
    }

    // Delete files from S3
    for (const record of records) {
      if (record.s3Files && record.s3Files.length > 0) {
        for (const file of record.s3Files) {
          try {
            await S3Service.deleteFile(file.s3Key);
          } catch (error) {
            console.error(`Failed to delete S3 file ${file.s3Key}:`, error);
            // Continue with next file
          }
        }
      }
    }

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