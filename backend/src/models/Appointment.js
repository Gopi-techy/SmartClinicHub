const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  // Basic Appointment Information
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient is required']
  },
  
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor is required']
  },
  
  // Appointment Scheduling
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required']
  },
  
  startTime: {
    type: String, // HH:MM format
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
  },
  
  endTime: {
    type: String, // HH:MM format
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
  },
  
  duration: {
    type: Number, // in minutes
    default: 30,
    min: [15, 'Minimum appointment duration is 15 minutes'],
    max: [180, 'Maximum appointment duration is 3 hours']
  },
  
  // Appointment Type and Mode
  type: {
    type: String,
    enum: ['consultation', 'follow-up', 'emergency', 'routine-checkup', 'lab-review', 'vaccination'],
    default: 'consultation'
  },
  
  mode: {
    type: String,
    enum: ['online', 'in-person', 'hybrid'],
    default: 'in-person'
  },
  
  // Appointment Status
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show', 'rescheduled'],
    default: 'scheduled'
  },
  
  // Booking and Payment Information
  bookingReference: {
    type: String,
    unique: true,
    required: true
  },
  
  consultationFee: {
    type: Number,
    required: [true, 'Consultation fee is required'],
    min: [0, 'Consultation fee cannot be negative']
  },
  
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  
  paymentMethod: {
    type: String,
    enum: ['online', 'cash', 'insurance', 'card']
  },
  
  paymentDetails: {
    transactionId: String,
    paymentGateway: String,
    paidAmount: Number,
    paymentDate: Date
  },
  
  // Medical Information
  symptoms: [String],
  chiefComplaint: String,
  urgencyLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Doctor's Notes and Diagnosis
  consultationNotes: {
    symptoms: String,
    diagnosis: String,
    treatment: String,
    recommendations: String,
    followUpDate: Date,
    referralTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Prescription Information
  prescriptions: [{
    medication: String,
    dosage: String,
    frequency: String,
    duration: String, // e.g., "7 days", "2 weeks"
    instructions: String,
    prescribedAt: { type: Date, default: Date.now }
  }],
  
  // Lab Tests and Reports
  labTests: [{
    testName: String,
    testType: String,
    orderDate: Date,
    reportUrl: String,
    status: {
      type: String,
      enum: ['ordered', 'in-progress', 'completed', 'cancelled'],
      default: 'ordered'
    },
    results: String,
    normalRange: String
  }],
  
  // Online Consultation Details
  videoCallDetails: {
    roomId: String,
    meetingUrl: String,
    recordingUrl: String,
    callDuration: Number, // in minutes
    callStarted: Date,
    callEnded: Date,
    callQuality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor']
    }
  },
  
  // Location Information (for in-person appointments)
  location: {
    clinicName: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    roomNumber: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Reminders and Notifications
  reminders: [{
    type: {
      type: String,
      enum: ['sms', 'email', 'push', 'call']
    },
    sentAt: Date,
    scheduledFor: Date,
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed'],
      default: 'pending'
    }
  }],
  
  // Check-in Information
  checkIn: {
    arrivedAt: Date,
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    qrCodeScanned: Boolean,
    waitingTime: Number, // in minutes
    roomAssigned: String
  },
  
  // Feedback and Rating
  feedback: {
    patientRating: {
      type: Number,
      min: 1,
      max: 5
    },
    patientReview: String,
    doctorRating: {
      type: Number,
      min: 1,
      max: 5
    },
    doctorReview: String,
    submittedAt: Date
  },
  
  // Insurance Information
  insurance: {
    provider: String,
    policyNumber: String,
    claimNumber: String,
    coverage: Number, // percentage
    approvalCode: String,
    preAuthRequired: Boolean
  },
  
  // Emergency Information
  isEmergency: {
    type: Boolean,
    default: false
  },
  
  emergencyLevel: {
    type: String,
    enum: ['green', 'yellow', 'orange', 'red'], // Triage colors
  },
  
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String,
    notified: Boolean
  },
  
  // Cancellation Information
  cancellation: {
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date,
    reason: String,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'failed']
    }
  },
  
  // Rescheduling Information
  rescheduleHistory: [{
    previousDate: Date,
    previousStartTime: String,
    rescheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rescheduledAt: Date,
    reason: String
  }],
  
  // Follow-up Information
  followUp: {
    isRequired: Boolean,
    scheduledDate: Date,
    nextAppointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    instructions: String
  },
  
  // Digital Health Records
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: Date,
    description: String
  }],
  
  // Vitals Recorded
  vitals: {
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    heartRate: Number,
    temperature: Number, // in Celsius
    weight: Number, // in kg
    height: Number, // in cm
    oxygenSaturation: Number,
    recordedAt: Date,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Appointment Notes
  internalNotes: String, // For staff use only
  
  // Metadata
  source: {
    type: String,
    enum: ['web', 'mobile', 'phone', 'walk-in', 'referral'],
    default: 'web'
  },
  
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  deletedAt: Date,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance (bookingReference already has unique: true)
appointmentSchema.index({ patient: 1, appointmentDate: 1 });
appointmentSchema.index({ doctor: 1, appointmentDate: 1 });
appointmentSchema.index({ appointmentDate: 1, startTime: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ isEmergency: 1, emergencyLevel: 1 });
appointmentSchema.index({ paymentStatus: 1 });
appointmentSchema.index({ mode: 1, type: 1 });

// Compound indexes
appointmentSchema.index({ 
  doctor: 1, 
  appointmentDate: 1, 
  startTime: 1, 
  status: 1 
});

appointmentSchema.index({
  patient: 1,
  status: 1,
  appointmentDate: 1
});

// Virtual fields
appointmentSchema.virtual('appointmentDateTime').get(function() {
  if (!this.appointmentDate || !this.startTime) return null;
  
  const [hours, minutes] = this.startTime.split(':');
  const dateTime = new Date(this.appointmentDate);
  dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  return dateTime;
});

appointmentSchema.virtual('isUpcoming').get(function() {
  return this.appointmentDateTime && this.appointmentDateTime > new Date();
});

appointmentSchema.virtual('isToday').get(function() {
  if (!this.appointmentDate) return false;
  
  const today = new Date();
  const appointmentDate = new Date(this.appointmentDate);
  
  return appointmentDate.toDateString() === today.toDateString();
});

appointmentSchema.virtual('canBeCancelled').get(function() {
  if (!this.appointmentDateTime) return false;
  
  const now = new Date();
  const timeDiff = this.appointmentDateTime.getTime() - now.getTime();
  const hoursDiff = timeDiff / (1000 * 3600);
  
  return hoursDiff >= 24 && ['scheduled', 'confirmed'].includes(this.status);
});

appointmentSchema.virtual('timeSlot').get(function() {
  return `${this.startTime} - ${this.endTime}`;
});

// Pre-save middleware
appointmentSchema.pre('save', function(next) {
  // Generate booking reference if not exists
  if (!this.bookingReference) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.bookingReference = `APP-${timestamp.toUpperCase()}-${random.toUpperCase()}`;
  }
  
  // Calculate duration if not provided
  if (!this.duration && this.startTime && this.endTime) {
    const [startHours, startMinutes] = this.startTime.split(':').map(Number);
    const [endHours, endMinutes] = this.endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    this.duration = endTotalMinutes - startTotalMinutes;
  }
  
  next();
});

// Pre-save middleware for status updates
appointmentSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'cancelled' && !this.cancellation.cancelledAt) {
      this.cancellation.cancelledAt = new Date();
    }
    
    if (this.status === 'completed' && !this.consultationNotes) {
      this.consultationNotes = {};
    }
  }
  
  next();
});

// Instance methods
appointmentSchema.methods.generateMeetingRoom = function() {
  if (this.mode === 'online') {
    const roomId = `${this._id}_${Date.now()}`;
    this.videoCallDetails.roomId = roomId;
    this.videoCallDetails.meetingUrl = `${process.env.FRONTEND_URL}/video-call/${roomId}`;
    return this.videoCallDetails.meetingUrl;
  }
  return null;
};

appointmentSchema.methods.canBeRescheduled = function() {
  const now = new Date();
  const appointmentTime = this.appointmentDateTime;
  
  if (!appointmentTime) return false;
  
  const timeDiff = appointmentTime.getTime() - now.getTime();
  const hoursDiff = timeDiff / (1000 * 3600);
  
  return hoursDiff >= 12 && ['scheduled', 'confirmed'].includes(this.status);
};

appointmentSchema.methods.markAsCompleted = function(consultationData) {
  this.status = 'completed';
  if (consultationData) {
    this.consultationNotes = { ...this.consultationNotes, ...consultationData };
  }
  
  if (this.videoCallDetails.callStarted && !this.videoCallDetails.callEnded) {
    this.videoCallDetails.callEnded = new Date();
    this.videoCallDetails.callDuration = Math.round(
      (this.videoCallDetails.callEnded - this.videoCallDetails.callStarted) / 60000
    );
  }
  
  return this.save();
};

appointmentSchema.methods.sendReminder = function(type = 'email') {
  const reminder = {
    type,
    scheduledFor: new Date(),
    status: 'pending'
  };
  
  this.reminders.push(reminder);
  return this.save();
};

// Static methods
appointmentSchema.statics.findConflicts = function(doctorId, date, startTime, endTime, excludeId = null) {
  const query = {
    doctor: doctorId,
    appointmentDate: date,
    status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.find(query);
};

appointmentSchema.statics.findUpcoming = function(userId, role = 'patient') {
  const now = new Date();
  const query = {
    [role]: userId,
    appointmentDate: { $gte: now },
    status: { $in: ['scheduled', 'confirmed'] },
    isDeleted: false
  };
  
  return this.find(query)
    .populate('patient', 'firstName lastName email phone')
    .populate('doctor', 'firstName lastName professionalInfo.specialization')
    .sort({ appointmentDate: 1, startTime: 1 });
};

appointmentSchema.statics.findByDateRange = function(doctorId, startDate, endDate) {
  return this.find({
    doctor: doctorId,
    appointmentDate: {
      $gte: startDate,
      $lte: endDate
    },
    isDeleted: false
  }).sort({ appointmentDate: 1, startTime: 1 });
};

appointmentSchema.statics.getAppointmentStats = function(doctorId, timeframe = 'month') {
  const now = new Date();
  let startDate;
  
  switch (timeframe) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default: // month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  
  return this.aggregate([
    {
      $match: {
        doctor: mongoose.Types.ObjectId(doctorId),
        appointmentDate: { $gte: startDate },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$consultationFee' }
      }
    }
  ]);
};

module.exports = mongoose.model('Appointment', appointmentSchema);
