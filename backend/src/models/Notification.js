const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient Information
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required'],
    index: true
  },

  // Notification Content
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },

  message: {
    type: String,
    required: [true, 'Notification message is required'],
    maxlength: [500, 'Message cannot exceed 500 characters']
  },

  // Notification Type and Priority
  type: {
    type: String,
    enum: [
      'appointment-reminder',
      'appointment-confirmation', 
      'appointment-cancellation',
      'medication-reminder',
      'lab-results',
      'prescription-ready',
      'health-alert',
      'system-update',
      'payment-due',
      'insurance-update',
      'emergency-alert',
      'general'
    ],
    required: [true, 'Notification type is required']
  },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // Status and Interaction
  status: {
    type: String,
    enum: ['unread', 'read', 'archived', 'dismissed'],
    default: 'unread',
    index: true
  },

  readAt: Date,
  dismissedAt: Date,

  // Action Information
  actionRequired: {
    type: Boolean,
    default: false
  },

  actionUrl: String, // URL to navigate to when notification is clicked
  
  actionData: {
    type: mongoose.Schema.Types.Mixed // Additional data for the action
  },

  // Related References
  relatedAppointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },

  relatedPrescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },

  relatedHealthRecord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HealthRecord'
  },

  // Sender Information
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  senderType: {
    type: String,
    enum: ['system', 'doctor', 'nurse', 'admin', 'pharmacy'],
    default: 'system'
  },

  // Scheduling
  scheduledFor: Date, // For future notifications
  
  isScheduled: {
    type: Boolean,
    default: false
  },

  // Delivery Information
  deliveryMethods: [{
    type: String,
    enum: ['in-app', 'email', 'sms', 'push'],
    default: 'in-app'
  }],

  deliveryStatus: {
    inApp: {
      status: {
        type: String,
        enum: ['pending', 'delivered', 'failed'],
        default: 'pending'
      },
      deliveredAt: Date
    },
    email: {
      status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'failed'],
        default: 'pending'
      },
      sentAt: Date,
      deliveredAt: Date
    },
    sms: {
      status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'failed'],
        default: 'pending'
      },
      sentAt: Date,
      deliveredAt: Date
    },
    push: {
      status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'failed'],
        default: 'pending'
      },
      sentAt: Date,
      deliveredAt: Date
    }
  },

  // Expiration
  expiresAt: Date,

  // Metadata
  metadata: {
    deviceType: String,
    userAgent: String,
    ipAddress: String
  }

}, {
  timestamps: true,
  indexes: [
    { recipient: 1, createdAt: -1 },
    { recipient: 1, status: 1 },
    { recipient: 1, type: 1 },
    { scheduledFor: 1, isScheduled: 1 },
    { expiresAt: 1 }
  ]
});

// Mark notification as read
notificationSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

// Mark notification as dismissed
notificationSchema.methods.dismiss = function() {
  this.status = 'dismissed';
  this.dismissedAt = new Date();
  return this.save();
};

// Archive notification
notificationSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Check if notification is expired
notificationSchema.methods.isExpired = function() {
  return this.expiresAt && this.expiresAt < new Date();
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    recipient: userId,
    status: 'unread',
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

// Static method to get notifications for user with pagination
notificationSchema.statics.getForUser = async function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    type = null,
    status = null,
    priority = null
  } = options;

  const query = {
    recipient: userId,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  };

  if (type) query.type = type;
  if (status) query.status = status;
  if (priority) query.priority = priority;

  const notifications = await this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'firstName lastName professionalInfo.specialization')
    .populate('relatedAppointment', 'appointmentDate type doctor')
    .populate('relatedPrescription', 'prescriptionNumber medications')
    .lean();

  const total = await this.countDocuments(query);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method to create appointment reminder
notificationSchema.statics.createAppointmentReminder = async function(appointmentId, reminderHours = 24) {
  const Appointment = mongoose.model('Appointment');
  const appointment = await Appointment.findById(appointmentId)
    .populate('patient doctor');

  if (!appointment) return null;

  const reminderTime = new Date(appointment.appointmentDate);
  reminderTime.setHours(reminderTime.getHours() - reminderHours);

  return await this.create({
    recipient: appointment.patient._id,
    title: 'Appointment Reminder',
    message: `You have an appointment with Dr. ${appointment.doctor.lastName} on ${appointment.appointmentDate.toDateString()} at ${appointment.startTime}`,
    type: 'appointment-reminder',
    priority: 'medium',
    relatedAppointment: appointmentId,
    scheduledFor: reminderTime,
    isScheduled: true,
    actionRequired: true,
    actionUrl: `/patient/appointments/${appointmentId}`,
    deliveryMethods: ['in-app', 'email', 'sms']
  });
};

// Static method to create lab results notification
notificationSchema.statics.createLabResultsNotification = async function(healthRecordId) {
  const HealthRecord = mongoose.model('HealthRecord');
  const record = await HealthRecord.findById(healthRecordId)
    .populate('patient recordedBy');

  if (!record || record.recordType !== 'lab-results') return null;

  const hasAbnormalResults = record.labResults.some(
    result => result.status === 'abnormal' || result.status === 'critical'
  );

  return await this.create({
    recipient: record.patient._id,
    title: 'Lab Results Available',
    message: hasAbnormalResults 
      ? 'Your lab results are available. Some results require attention - please review.'
      : 'Your lab results are available and ready for review.',
    type: 'lab-results',
    priority: hasAbnormalResults ? 'high' : 'medium',
    relatedHealthRecord: healthRecordId,
    actionRequired: hasAbnormalResults,
    actionUrl: `/patient/health-records/${healthRecordId}`,
    deliveryMethods: ['in-app', 'email']
  });
};

// Middleware to handle scheduled notifications
notificationSchema.pre('save', function(next) {
  // Set delivery status for in-app notifications
  if (this.deliveryMethods.includes('in-app') && this.isNew) {
    this.deliveryStatus.inApp.status = 'delivered';
    this.deliveryStatus.inApp.deliveredAt = new Date();
  }
  next();
});

// TTL index for expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Notification', notificationSchema);
