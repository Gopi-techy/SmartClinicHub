const express = require('express');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const EmergencyAccess = require('../models/EmergencyAccess');
const { authenticate, authorize, rateLimitSensitive } = require('../middleware/auth');
const { 
  validateObjectId, 
  handleValidationErrors 
} = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const crypto = require('crypto');

const router = express.Router();

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin)
 */
router.get('/dashboard',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { timeframe = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (timeframe) {
      case '7d':
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
    }

    // Get user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          newUsers: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', startDate] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Get appointment statistics
    const appointmentStats = await Appointment.aggregate([
      {
        $match: {
          appointmentDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    // Get prescription statistics
    const prescriptionStats = await Prescription.aggregate([
      {
        $match: {
          prescribedDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalMedications: { $sum: { $size: '$medications' } }
        }
      }
    ]);

    // Get emergency access statistics
    const emergencyStats = await EmergencyAccess.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$accessType',
          count: { $sum: 1 },
          successfulAccess: {
            $sum: {
              $cond: [
                { $eq: ['$isActive', true] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // System health metrics
    const systemHealth = {
      totalUsers: await User.countDocuments(),
      activeUsers: await User.countDocuments({ 
        lastLoginDate: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) }
      }),
      totalAppointments: await Appointment.countDocuments(),
      pendingAppointments: await Appointment.countDocuments({ status: 'scheduled' }),
      totalPrescriptions: await Prescription.countDocuments(),
      pendingPrescriptions: await Prescription.countDocuments({ status: 'pending' }),
      emergencyAccessCount: await EmergencyAccess.countDocuments({ isActive: true })
    };

    // Calculate growth rates
    const previousPeriodStart = new Date(startDate - (now - startDate));
    const previousUserCount = await User.countDocuments({
      createdAt: { $gte: previousPeriodStart, $lt: startDate }
    });
    const currentUserCount = await User.countDocuments({
      createdAt: { $gte: startDate }
    });

    const userGrowthRate = previousUserCount > 0 
      ? ((currentUserCount - previousUserCount) / previousUserCount * 100).toFixed(2)
      : 100;

    const dashboard = {
      timeframe,
      period: { startDate, endDate: now },
      systemHealth,
      userStats: {
        byRole: userStats,
        growthRate: parseFloat(userGrowthRate),
        totalNew: currentUserCount
      },
      appointmentStats: {
        byStatus: appointmentStats,
        total: appointmentStats.reduce((sum, stat) => sum + stat.count, 0)
      },
      prescriptionStats: {
        byStatus: prescriptionStats,
        total: prescriptionStats.reduce((sum, stat) => sum + stat.count, 0),
        totalMedications: prescriptionStats.reduce((sum, stat) => sum + stat.totalMedications, 0)
      },
      emergencyStats: {
        byType: emergencyStats,
        total: emergencyStats.reduce((sum, stat) => sum + stat.count, 0),
        successRate: emergencyStats.reduce((sum, stat) => sum + stat.successfulAccess, 0) /
                    Math.max(1, emergencyStats.reduce((sum, stat) => sum + stat.count, 0)) * 100
      },
      generatedAt: new Date()
    };

    // Log dashboard access
    logger.audit('Admin dashboard accessed', req.user._id, {
      timeframe,
      totalUsers: systemHealth.totalUsers,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: { dashboard }
    });
  })
);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filtering and pagination
 * @access  Private (Admin)
 */
router.get('/users',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      role,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    if (role && role !== 'all') query.role = role;
    if (status) query.isActive = status === 'active';
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      select: '-password -resetPasswordToken -refreshTokens -emergencyAccess',
      populate: [
        {
          path: 'medicalInfo.primaryDoctor',
          select: 'firstName lastName'
        }
      ]
    };

    const users = await User.paginate(query, options);

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users: users.docs,
        pagination: {
          currentPage: users.page,
          totalPages: users.totalPages,
          totalItems: users.totalDocs,
          hasNextPage: users.hasNextPage,
          hasPrevPage: users.hasPrevPage
        }
      }
    });
  })
);

/**
 * @route   GET /api/admin/user/:id
 * @desc    Get detailed user information
 * @access  Private (Admin)
 */
router.get('/user/:id',
  authenticate,
  authorize('admin'),
  validateObjectId('id'),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -refreshTokens')
      .populate('medicalInfo.primaryDoctor', 'firstName lastName specialization');

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    // Get user's appointments
    const appointments = await Appointment.find({
      $or: [
        { patient: user._id },
        { doctor: user._id }
      ]
    })
    .sort({ appointmentDate: -1 })
    .limit(10)
    .populate('patient doctor', 'firstName lastName')
    .lean();

    // Get user's prescriptions
    const prescriptions = await Prescription.find({
      $or: [
        { patient: user._id },
        { doctor: user._id },
        { 'pharmacy.pharmacyId': user._id }
      ]
    })
    .sort({ prescribedDate: -1 })
    .limit(10)
    .populate('patient doctor', 'firstName lastName')
    .lean();

    // Get emergency access records
    const emergencyAccess = await EmergencyAccess.find({
      patientId: user._id
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

    const userDetails = {
      user,
      recentActivity: {
        appointments,
        prescriptions,
        emergencyAccess
      },
      statistics: {
        totalAppointments: await Appointment.countDocuments({
          $or: [{ patient: user._id }, { doctor: user._id }]
        }),
        totalPrescriptions: await Prescription.countDocuments({
          $or: [{ patient: user._id }, { doctor: user._id }]
        }),
        emergencyAccessCount: await EmergencyAccess.countDocuments({
          patientId: user._id
        })
      }
    };

    // Log user detail access
    logger.audit('User details accessed by admin', req.user._id, {
      targetUserId: user._id,
      targetUserRole: user.role,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'User details retrieved successfully',
      data: userDetails
    });
  })
);

/**
 * @route   PUT /api/admin/user/:id/status
 * @desc    Update user status (activate/deactivate)
 * @access  Private (Admin)
 */
router.put('/user/:id/status',
  authenticate,
  authorize('admin'),
  validateObjectId('id'),
  handleValidationErrors,
  rateLimitSensitive(20, 60 * 60 * 1000), // 20 status changes per hour
  asyncHandler(async (req, res) => {
    const { isActive, reason } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        error: true,
        message: 'isActive field is required and must be boolean'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    const previousStatus = user.isActive;
    user.isActive = isActive;
    user.statusHistory = user.statusHistory || [];
    user.statusHistory.push({
      status: isActive ? 'active' : 'inactive',
      changedBy: req.user._id,
      changedAt: new Date(),
      reason: reason || `Status ${isActive ? 'activated' : 'deactivated'} by admin`
    });

    await user.save();

    // Log status change
    logger.security('User status changed by admin', {
      adminId: req.user._id,
      targetUserId: user._id,
      previousStatus,
      newStatus: isActive,
      reason,
      ip: req.ip
    });

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        userId: user._id,
        isActive: user.isActive,
        changedBy: req.user._id,
        changedAt: new Date()
      }
    });
  })
);

/**
 * @route   POST /api/admin/user/:id/reset-password
 * @desc    Reset user password (admin action)
 * @access  Private (Admin)
 */
router.post('/user/:id/reset-password',
  authenticate,
  authorize('admin'),
  validateObjectId('id'),
  handleValidationErrors,
  rateLimitSensitive(10, 60 * 60 * 1000), // 10 password resets per hour
  asyncHandler(async (req, res) => {
    const { temporaryPassword, requirePasswordChange = true } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    // Generate temporary password if not provided
    const newPassword = temporaryPassword || crypto.randomBytes(12).toString('hex');
    
    user.password = newPassword; // Will be hashed by pre-save middleware
    user.passwordChangeRequired = requirePasswordChange;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.lastPasswordChange = new Date();

    await user.save();

    // Log password reset
    logger.security('Password reset by admin', {
      adminId: req.user._id,
      targetUserId: user._id,
      targetUserEmail: user.email,
      requirePasswordChange,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        userId: user._id,
        temporaryPassword: newPassword,
        requirePasswordChange,
        message: 'Please provide the temporary password to the user securely'
      }
    });
  })
);

/**
 * @route   GET /api/admin/system/health
 * @desc    Get system health status
 * @access  Private (Admin)
 */
router.get('/system/health',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const healthCheck = {
      timestamp: new Date(),
      status: 'healthy',
      services: {},
      metrics: {}
    };

    try {
      // Database connectivity
      const dbHealth = await User.findOne().limit(1);
      healthCheck.services.database = {
        status: dbHealth ? 'healthy' : 'error',
        responseTime: Date.now() - healthCheck.timestamp.getTime()
      };

      // Check recent error rates
      const recentErrors = await logger.getRecentErrors(24); // Last 24 hours
      healthCheck.services.errorRate = {
        status: recentErrors.length < 50 ? 'healthy' : 'warning',
        errorCount: recentErrors.length,
        period: '24h'
      };

      // Memory usage (mock data)
      healthCheck.metrics.memory = {
        used: Math.floor(Math.random() * 512 + 256), // MB
        total: 1024, // MB
        percentage: Math.floor(Math.random() * 50 + 25)
      };

      // Active connections (mock data)
      healthCheck.metrics.activeConnections = Math.floor(Math.random() * 100 + 20);

      // API response times
      healthCheck.metrics.averageResponseTime = Math.floor(Math.random() * 200 + 50); // ms

      // Determine overall status
      const hasErrors = Object.values(healthCheck.services).some(service => 
        service.status === 'error'
      );
      const hasWarnings = Object.values(healthCheck.services).some(service => 
        service.status === 'warning'
      );

      if (hasErrors) {
        healthCheck.status = 'error';
      } else if (hasWarnings) {
        healthCheck.status = 'warning';
      }

    } catch (error) {
      healthCheck.status = 'error';
      healthCheck.error = 'System health check failed';
      logger.error('System health check error:', error);
    }

    res.json({
      success: true,
      message: 'System health check completed',
      data: { health: healthCheck }
    });
  })
);

/**
 * @route   GET /api/admin/reports/analytics
 * @desc    Generate comprehensive analytics report
 * @access  Private (Admin)
 */
router.get('/reports/analytics',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { startDate, endDate, reportType = 'comprehensive' } = req.query;

    const dateRange = {
      $gte: new Date(startDate || Date.now() - 30 * 24 * 60 * 60 * 1000),
      $lte: new Date(endDate || Date.now())
    };

    // User analytics
    const userAnalytics = await User.aggregate([
      {
        $facet: {
          byRole: [
            { $group: { _id: '$role', count: { $sum: 1 } } }
          ],
          registrationTrend: [
            {
              $match: { createdAt: dateRange }
            },
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                },
                newUsers: { $sum: 1 }
              }
            },
            { $sort: { '_id': 1 } }
          ],
          activityLevel: [
            {
              $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                activeUsers: {
                  $sum: {
                    $cond: [
                      { $gte: ['$lastLoginDate', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
                      1,
                      0
                    ]
                  }
                }
              }
            }
          ]
        }
      }
    ]);

    // Appointment analytics
    const appointmentAnalytics = await Appointment.aggregate([
      {
        $match: { appointmentDate: dateRange }
      },
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          byType: [
            { $group: { _id: '$type', count: { $sum: 1 } } }
          ],
          dailyVolume: [
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$appointmentDate' }
                },
                appointments: { $sum: 1 },
                totalDuration: { $sum: '$duration' }
              }
            },
            { $sort: { '_id': 1 } }
          ],
          satisfaction: [
            {
              $match: { 'feedback.rating': { $exists: true } }
            },
            {
              $group: {
                _id: null,
                averageRating: { $avg: '$feedback.rating' },
                totalFeedback: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    // Prescription analytics
    const prescriptionAnalytics = await Prescription.aggregate([
      {
        $match: { prescribedDate: dateRange }
      },
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          processingTime: [
            {
              $match: { 'pharmacy.dispensedDate': { $exists: true } }
            },
            {
              $group: {
                _id: null,
                averageProcessingTime: {
                  $avg: {
                    $divide: [
                      { $subtract: ['$pharmacy.dispensedDate', '$prescribedDate'] },
                      1000 * 60 * 60 // Convert to hours
                    ]
                  }
                }
              }
            }
          ],
          topMedications: [
            { $unwind: '$medications' },
            {
              $group: {
                _id: '$medications.medication',
                count: { $sum: 1 },
                totalQuantity: { $sum: '$medications.quantity' }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ]);

    // Emergency access analytics
    const emergencyAnalytics = await EmergencyAccess.aggregate([
      {
        $match: { createdAt: dateRange }
      },
      {
        $facet: {
          byType: [
            { $group: { _id: '$accessType', count: { $sum: 1 } } }
          ],
          successRate: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                successful: {
                  $sum: {
                    $cond: [{ $eq: ['$isActive', true] }, 1, 0]
                  }
                }
              }
            }
          ],
          responseTime: [
            {
              $match: { accessDate: { $exists: true } }
            },
            {
              $group: {
                _id: null,
                averageResponseTime: {
                  $avg: {
                    $divide: [
                      { $subtract: ['$accessDate', '$createdAt'] },
                      1000 * 60 // Convert to minutes
                    ]
                  }
                }
              }
            }
          ]
        }
      }
    ]);

    const report = {
      reportType,
      period: {
        startDate: new Date(startDate || Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(endDate || Date.now())
      },
      userAnalytics: userAnalytics[0],
      appointmentAnalytics: appointmentAnalytics[0],
      prescriptionAnalytics: prescriptionAnalytics[0],
      emergencyAnalytics: emergencyAnalytics[0],
      generatedAt: new Date(),
      generatedBy: req.user._id
    };

    // Log report generation
    logger.audit('Analytics report generated', req.user._id, {
      reportType,
      period: report.period,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Analytics report generated successfully',
      data: { report }
    });
  })
);

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get system audit logs
 * @access  Private (Admin)
 */
router.get('/audit-logs',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 50,
      level,
      action,
      userId,
      startDate,
      endDate
    } = req.query;

    // This would typically query your audit log storage
    // For now, we'll return a mock response
    const logs = await logger.getAuditLogs({
      page: parseInt(page),
      limit: parseInt(limit),
      level,
      action,
      userId,
      dateRange: {
        start: startDate ? new Date(startDate) : undefined,
        end: endDate ? new Date(endDate) : undefined
      }
    });

    res.json({
      success: true,
      message: 'Audit logs retrieved successfully',
      data: logs
    });
  })
);

/**
 * @route   POST /api/admin/maintenance/backup
 * @desc    Initiate system backup
 * @access  Private (Admin)
 */
router.post('/maintenance/backup',
  authenticate,
  authorize('admin'),
  rateLimitSensitive(3, 60 * 60 * 1000), // 3 backups per hour
  asyncHandler(async (req, res) => {
    const { backupType = 'full', includeFiles = false } = req.body;

    // Mock backup process
    const backupId = `backup_${Date.now()}_${req.user._id}`;
    
    // In real implementation, this would trigger actual backup process
    const backup = {
      backupId,
      type: backupType,
      status: 'initiated',
      initiatedBy: req.user._id,
      startTime: new Date(),
      includeFiles,
      estimatedCompletionTime: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    };

    // Log backup initiation
    logger.security('System backup initiated', {
      backupId,
      backupType,
      initiatedBy: req.user._id,
      includeFiles,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Backup initiated successfully',
      data: { backup }
    });
  })
);

module.exports = router;
