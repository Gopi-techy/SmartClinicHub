const express = require('express');
const multer = require('multer');
const { BlobServiceClient } = require('@azure/storage-blob');

const User = require('../models/User');
const { 
  getUsers, 
  getUser, 
  updateUser, 
  deleteUser,
  changePassword 
} = require('../controllers/userController');
const { authenticate, authorize, authorizeOwnershipOrAdmin } = require('../middleware/auth');
const { 
  validateUserUpdate, 
  validateObjectId, 
  validateSearch,
  validateDoctorAvailability,
  handleValidationErrors 
} = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const config = require('../config/config');

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Get all users (Admin only)
 * @access  Private (Admin)
 */
router.get('/',
  authenticate,
  authorize(['admin']),
  asyncHandler(getUsers)
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Own profile or Admin)
 */
router.get('/:id',
  authenticate,
  validateObjectId('id'),
  handleValidationErrors,
  asyncHandler(getUser)
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private (Own profile or Admin)
 */
router.put('/:id',
  authenticate,
  validateObjectId('id'),
  validateUserUpdate,
  handleValidationErrors,
  asyncHandler(updateUser)
);

/**
 * @route   PUT /api/users/:id/change-password
 * @desc    Change user password
 * @access  Private (Own profile only)
 */
router.put('/:id/change-password',
  authenticate,
  validateObjectId('id'),
  handleValidationErrors,
  asyncHandler(changePassword)
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (Admin only)
 * @access  Private (Admin)
 */
router.delete('/:id',
  authenticate,
  authorize(['admin']),
  validateObjectId('id'),
  handleValidationErrors,
  asyncHandler(deleteUser)
);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

/**
 * @route   GET /api/users/profile/:userId
 * @desc    Get user profile
 * @access  Private (Own profile or Admin)
 */
router.get('/profile/:userId',
  authenticate,
  validateObjectId('userId'),
  handleValidationErrors,
  authorizeOwnershipOrAdmin(),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    
    const user = await User.findActiveById(userId)
      .select('-password -twoFactorSecret -biometricData -emergencyTokens')
      .lean();

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    logger.audit('User profile accessed', req.user._id, {
      targetUserId: userId,
      accessedBy: req.user._id,
      ip: req.ip
    });

    res.json({
      success: true,
      data: {
        user
      }
    });
  })
);

/**
 * @route   PUT /api/users/profile/:userId
 * @desc    Update user profile
 * @access  Private (Own profile or Admin)
 */
router.put('/profile/:userId',
  authenticate,
  validateObjectId('userId'),
  validateUserUpdate,
  handleValidationErrors,
  authorizeOwnershipOrAdmin(),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated via this route
    delete updateData.password;
    delete updateData.email;
    delete updateData.role;
    delete updateData.isEmailVerified;
    delete updateData.isPhoneVerified;

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        ...updateData,
        lastModifiedBy: req.user._id 
      },
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-password -twoFactorSecret -biometricData -emergencyTokens');

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    logger.audit('User profile updated', req.user._id, {
      targetUserId: userId,
      updatedFields: Object.keys(updateData),
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user
      }
    });
  })
);

/**
 * @route   POST /api/users/upload-profile-picture/:userId
 * @desc    Upload profile picture
 * @access  Private (Own profile or Admin)
 */
router.post('/upload-profile-picture/:userId',
  authenticate,
  validateObjectId('userId'),
  handleValidationErrors,
  authorizeOwnershipOrAdmin(),
  upload.single('profilePicture'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        error: true,
        message: 'No file uploaded'
      });
    }

    // Upload to Azure Blob Storage
    const blobServiceClient = BlobServiceClient.fromConnectionString(config.azure.connectionString);
    const containerClient = blobServiceClient.getContainerClient(config.azure.containerName);
    
    const fileName = `profile-pictures/${userId}-${Date.now()}.${req.file.originalname.split('.').pop()}`;
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    await blockBlobClient.upload(req.file.buffer, req.file.size, {
      blobHTTPHeaders: {
        blobContentType: req.file.mimetype
      }
    });

    const profilePictureUrl = blockBlobClient.url;

    // Update user profile
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        profilePicture: profilePictureUrl,
        lastModifiedBy: req.user._id 
      },
      { new: true }
    ).select('-password -twoFactorSecret -biometricData -emergencyTokens');

    logger.audit('Profile picture uploaded', req.user._id, {
      targetUserId: userId,
      fileName,
      fileSize: req.file.size,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        user,
        profilePictureUrl
      }
    });
  })
);

/**
 * @route   GET /api/users/doctors
 * @desc    Get list of doctors with filters
 * @access  Public
 */
router.get('/doctors',
  validateSearch,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { 
      query, 
      specialization, 
      city, 
      state, 
      minRating, 
      maxFee,
      availability,
      page = 1, 
      limit = 10,
      sortBy = 'rating',
      sortOrder = 'desc' 
    } = req.query;

    // Build filter object
    const filters = {
      role: 'doctor',
      isActive: true,
      isDeleted: false,
      verificationStatus: 'approved' // Only show verified doctors to patients
    };

    if (query) {
      filters.$or = [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { 'professionalInfo.specialization': { $regex: query, $options: 'i' } }
      ];
    }

    if (specialization) {
      filters['professionalInfo.specialization'] = { $regex: specialization, $options: 'i' };
    }

    if (city) {
      filters['address.city'] = { $regex: city, $options: 'i' };
    }

    if (state) {
      filters['address.state'] = { $regex: state, $options: 'i' };
    }

    if (minRating) {
      filters['professionalInfo.rating'] = { $gte: parseFloat(minRating) };
    }

    if (maxFee) {
      filters['professionalInfo.consultationFee'] = { $lte: parseFloat(maxFee) };
    }

    // Build sort object
    const sortOptions = {};
    if (sortBy === 'rating') {
      sortOptions['professionalInfo.rating'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'fee') {
      sortOptions['professionalInfo.consultationFee'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'name') {
      sortOptions.firstName = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1;
    }

    // Execute query
    const doctors = await User.find(filters)
      .select('firstName lastName email phone professionalInfo address profilePicture')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await User.countDocuments(filters);

    res.json({
      success: true,
      data: {
        doctors,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalDoctors: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  })
);

/**
 * @route   GET /api/users/doctor/:doctorId
 * @desc    Get doctor details
 * @access  Public
 */
router.get('/doctor/:doctorId',
  validateObjectId('doctorId'),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { doctorId } = req.params;

    const doctor = await User.findOne({
      _id: doctorId,
      role: 'doctor',
      isActive: true,
      isDeleted: false,
      verificationStatus: 'approved' // Only show verified doctors
    })
    .select('firstName lastName email phone professionalInfo address profilePicture')
    .lean();

    if (!doctor) {
      return res.status(404).json({
        error: true,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      data: {
        doctor
      }
    });
  })
);

/**
 * @route   PUT /api/users/doctor/availability/:doctorId
 * @desc    Update doctor availability
 * @access  Private (Doctor or Admin)
 */
router.put('/doctor/availability/:doctorId',
  authenticate,
  authorize('doctor', 'admin'),
  validateObjectId('doctorId'),
  validateDoctorAvailability,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { availableSlots } = req.body;

    // Check if user is updating their own availability or is admin
    if (req.user.role === 'doctor' && req.user._id.toString() !== doctorId) {
      return res.status(403).json({
        error: true,
        message: 'You can only update your own availability'
      });
    }

    const doctor = await User.findOneAndUpdate(
      { 
        _id: doctorId, 
        role: 'doctor',
        isActive: true,
        isDeleted: false 
      },
      { 
        'professionalInfo.availableSlots': availableSlots,
        lastModifiedBy: req.user._id 
      },
      { new: true, runValidators: true }
    ).select('firstName lastName professionalInfo.availableSlots');

    if (!doctor) {
      return res.status(404).json({
        error: true,
        message: 'Doctor not found'
      });
    }

    logger.audit('Doctor availability updated', req.user._id, {
      doctorId,
      slotsCount: availableSlots.length,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: {
        doctor
      }
    });
  })
);

/**
 * @route   GET /api/users/doctor/availability/:doctorId
 * @desc    Get doctor availability
 * @access  Public
 */
router.get('/doctor/availability/:doctorId',
  validateObjectId('doctorId'),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { date } = req.query;

    const doctor = await User.findOne({
      _id: doctorId,
      role: 'doctor',
      isActive: true,
      isDeleted: false
    })
    .select('firstName lastName professionalInfo.availableSlots professionalInfo.consultationFee')
    .lean();

    if (!doctor) {
      return res.status(404).json({
        error: true,
        message: 'Doctor not found'
      });
    }

    // If specific date is requested, filter availability for that day
    let availability = doctor.professionalInfo.availableSlots;
    
    if (date) {
      const requestedDate = new Date(date);
      const dayName = requestedDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
      availability = availability.filter(slot => slot.day === dayName && slot.isAvailable);
    }

    res.json({
      success: true,
      data: {
        doctorId,
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        consultationFee: doctor.professionalInfo.consultationFee,
        availability
      }
    });
  })
);

/**
 * @route   POST /api/users/upload-document/:userId
 * @desc    Upload user documents
 * @access  Private (Own documents or Admin)
 */
router.post('/upload-document/:userId',
  authenticate,
  validateObjectId('userId'),
  handleValidationErrors,
  authorizeOwnershipOrAdmin(),
  upload.single('document'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { documentType, description } = req.body;

    if (!req.file) {
      return res.status(400).json({
        error: true,
        message: 'No file uploaded'
      });
    }

    if (!documentType) {
      return res.status(400).json({
        error: true,
        message: 'Document type is required'
      });
    }

    // Upload to Azure Blob Storage
    const blobServiceClient = BlobServiceClient.fromConnectionString(config.azure.connectionString);
    const containerClient = blobServiceClient.getContainerClient(config.azure.containerName);
    
    const fileName = `documents/${userId}/${documentType}-${Date.now()}.${req.file.originalname.split('.').pop()}`;
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    await blockBlobClient.upload(req.file.buffer, req.file.size, {
      blobHTTPHeaders: {
        blobContentType: req.file.mimetype
      }
    });

    const documentUrl = blockBlobClient.url;

    // Add document to user profile
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          documents: {
            type: documentType,
            name: req.file.originalname,
            url: documentUrl,
            description,
            uploadedAt: new Date()
          }
        },
        lastModifiedBy: req.user._id
      },
      { new: true }
    ).select('documents');

    logger.audit('Document uploaded', req.user._id, {
      targetUserId: userId,
      documentType,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        document: user.documents[user.documents.length - 1]
      }
    });
  })
);

/**
 * @route   DELETE /api/users/document/:userId/:documentId
 * @desc    Delete user document
 * @access  Private (Own documents or Admin)
 */
router.delete('/document/:userId/:documentId',
  authenticate,
  validateObjectId('userId'),
  handleValidationErrors,
  authorizeOwnershipOrAdmin(),
  asyncHandler(async (req, res) => {
    const { userId, documentId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $pull: {
          documents: { _id: documentId }
        },
        lastModifiedBy: req.user._id
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    logger.audit('Document deleted', req.user._id, {
      targetUserId: userId,
      documentId,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  })
);

/**
 * @route   GET /api/users/search
 * @desc    Search users (Admin only)
 * @access  Private (Admin)
 */
router.get('/search',
  authenticate,
  authorize('admin'),
  validateSearch,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { 
      query, 
      role, 
      isActive,
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc' 
    } = req.query;

    // Build filter object
    const filters = {
      isDeleted: false
    };

    if (query) {
      filters.$or = [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ];
    }

    if (role) {
      filters.role = role;
    }

    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const users = await User.find(filters)
      .select('firstName lastName email phone role isActive isEmailVerified lastLogin createdAt')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await User.countDocuments(filters);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  })
);

/**
 * @route   PUT /api/users/deactivate/:userId
 * @desc    Deactivate user account
 * @access  Private (Admin)
 */
router.put('/deactivate/:userId',
  authenticate,
  authorize('admin'),
  validateObjectId('userId'),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isActive: false,
        lastModifiedBy: req.user._id
      },
      { new: true }
    ).select('firstName lastName email isActive');

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    logger.audit('User deactivated', req.user._id, {
      targetUserId: userId,
      reason,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'User deactivated successfully',
      data: {
        user
      }
    });
  })
);

/**
 * @route   PUT /api/users/reactivate/:userId
 * @desc    Reactivate user account
 * @access  Private (Admin)
 */
router.put('/reactivate/:userId',
  authenticate,
  authorize('admin'),
  validateObjectId('userId'),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isActive: true,
        lastModifiedBy: req.user._id
      },
      { new: true }
    ).select('firstName lastName email isActive');

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    logger.audit('User reactivated', req.user._id, {
      targetUserId: userId,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'User reactivated successfully',
      data: {
        user
      }
    });
  })
);

module.exports = router;
