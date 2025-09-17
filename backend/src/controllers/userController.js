const User = require('../models/User');

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { role, search, status } = req.query;
    
    // Build query
    let query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    } else {
      query.status = { $ne: 'deleted' }; // Exclude deleted users by default
    }

    const users = await User.find(query)
      .select('-password -passwordResetToken -emailVerificationToken -twoFactorSecret')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
};

/**
 * @desc    Get single user
 * @route   GET /api/users/:id
 * @access  Private
 */
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -passwordResetToken -emailVerificationToken -twoFactorSecret');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user can access this profile
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - You can only view your own profile'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/:id
 * @access  Private
 */
const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user can update this profile
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - You can only update your own profile'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Fields that can be updated by regular users
    const allowedUpdates = [
      'firstName', 'lastName', 'phone', 'address', 
      'emergencyContact', 'dateOfBirth', 'gender'
    ];
    
    // Role-specific fields
    if (user.role === 'patient') {
      allowedUpdates.push('medicalInfo');
    } else if (['doctor', 'pharmacy'].includes(user.role)) {
      allowedUpdates.push('professionalInfo');
    }
    
    // Admin can update additional fields
    if (req.user.role === 'admin') {
      allowedUpdates.push('status', 'role', 'isEmailVerified', 'permissions');
    }

    // Update only allowed fields
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Validate email if being updated (admin only)
    if (updates.email && req.user.role !== 'admin') {
      delete updates.email; // Remove email from updates for non-admin users
    }

    // Handle nested object updates properly
    if (updates.address) {
      // Merge with existing address data
      updates.address = { ...user.address?.toObject(), ...updates.address };
    }
    
    if (updates.emergencyContact) {
      // Merge with existing emergency contact data
      updates.emergencyContact = { ...user.emergencyContact?.toObject(), ...updates.emergencyContact };
    }
    
    if (updates.medicalInfo) {
      // Merge with existing medical info data
      updates.medicalInfo = { ...user.medicalInfo?.toObject(), ...updates.medicalInfo };
    }
    
    if (updates.professionalInfo) {
      // Merge with existing professional info data
      updates.professionalInfo = { ...user.professionalInfo?.toObject(), ...updates.professionalInfo };
      
      // Check if doctor is submitting for verification
      if (user.role === 'doctor' && 
          updates.professionalInfo.licenseNumber && 
          user.verificationStatus === 'unverified') {
        updates.verificationStatus = 'pending';
        updates.verificationDetails = {
          submittedAt: new Date()
        };
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      {
        new: true,
        runValidators: true
      }
    ).select('-password -passwordResetToken -emailVerificationToken -twoFactorSecret');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || 'Validation error'
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating user'
    });
  }
};

/**
 * @desc    Delete user (Admin only)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete - just deactivate the user
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


/**
 * @desc    Get user statistics (Admin only)
 * @route   GET /api/users/stats
 * @access  Private/Admin
 */
const getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ['$isActive', true] }, 1, 0]
            }
          },
          inactive: {
            $sum: {
              $cond: [{ $eq: ['$isActive', false] }, 1, 0]
            }
          }
        }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setDate(1)) }
    });

    res.status(200).json({
      success: true,
      stats: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        newThisMonth: newUsersThisMonth,
        byRole: stats
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Change user password
 * @route   PUT /api/users/:id/change-password
 * @access  Private (Own profile only)
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body;

    // Users can only change their own password
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - You can only change your own password'
      });
    }

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Get user with password
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || 'Validation error'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while changing password'
    });
  }
};

module.exports = {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  changePassword,
  getUserStats
};
