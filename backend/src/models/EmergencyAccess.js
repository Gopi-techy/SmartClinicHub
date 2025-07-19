const mongoose = require('mongoose');

const emergencyAccessSchema = new mongoose.Schema({
  // Patient Information
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient reference is required']
  },
  
  // Emergency Contact Information
  emergencyContact: {
    primary: {
      name: {
        type: String,
        required: [true, 'Primary contact name is required']
      },
      phone: {
        type: String,
        required: [true, 'Primary contact phone is required']
      },
      relationship: {
        type: String,
        required: [true, 'Relationship is required']
      },
      email: String,
      address: String
    },
    secondary: {
      name: String,
      phone: String,
      relationship: String,
      email: String
    }
  },
  
  // Access Control Settings
  accessLevel: {
    type: String,
    enum: ['basic', 'medical', 'full'],
    default: 'basic',
    description: 'basic: Contact info only, medical: + medical history, full: all records'
  },
  
  // Emergency Access Methods
  accessMethods: {
    qrCode: {
      enabled: { type: Boolean, default: true },
      code: String, // Encrypted QR code data
      generatedAt: Date,
      expiresAt: Date,
      scanCount: { type: Number, default: 0 },
      lastScanned: Date
    },
    
    nfcTag: {
      enabled: { type: Boolean, default: false },
      tagId: String,
      registeredAt: Date,
      lastUsed: Date
    },
    
    biometric: {
      faceRecognition: {
        enabled: { type: Boolean, default: false },
        encoding: String, // Encrypted face encoding
        confidence: Number,
        lastUsed: Date
      },
      fingerprint: {
        enabled: { type: Boolean, default: false },
        hash: String, // Encrypted fingerprint hash
        lastUsed: Date
      }
    },
    
    aadhaarAuth: {
      enabled: { type: Boolean, default: false },
      aadhaarNumber: String, // Encrypted
      lastVerified: Date,
      verificationCount: { type: Number, default: 0 }
    },
    
    otpFallback: {
      enabled: { type: Boolean, default: true },
      guardianPhones: [String], // Emergency contacts who can receive OTP
      lastOtpSent: Date,
      otpAttempts: { type: Number, default: 0 }
    }
  },
  
  // Medical Information Access Settings
  medicalAccess: {
    allowBasicInfo: { type: Boolean, default: true }, // Name, age, blood group
    allowMedicalHistory: { type: Boolean, default: true },
    allowAllergies: { type: Boolean, default: true },
    allowMedications: { type: Boolean, default: true },
    allowEmergencyContacts: { type: Boolean, default: true },
    allowInsuranceInfo: { type: Boolean, default: false },
    allowFullRecords: { type: Boolean, default: false }
  },
  
  // Location-Based Access
  locationSettings: {
    restrictByLocation: { type: Boolean, default: false },
    allowedLocations: [{
      name: String, // Hospital name, clinic name
      address: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      },
      radius: { type: Number, default: 1000 }, // meters
      type: {
        type: String,
        enum: ['hospital', 'clinic', 'pharmacy', 'emergency_service']
      }
    }],
    currentLocation: {
      latitude: Number,
      longitude: Number,
      address: String,
      timestamp: Date
    }
  },
  
  // Time-Based Access Restrictions
  timeRestrictions: {
    enabled: { type: Boolean, default: false },
    allowedHours: {
      start: String, // HH:MM format
      end: String    // HH:MM format
    },
    allowedDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    timezone: { type: String, default: 'Asia/Kolkata' }
  },
  
  // Emergency Scenarios
  emergencyScenarios: [{
    type: {
      type: String,
      enum: ['cardiac_arrest', 'stroke', 'severe_bleeding', 'breathing_difficulty', 
             'allergic_reaction', 'diabetic_emergency', 'seizure', 'trauma', 'poisoning', 'other']
    },
    triggers: [String], // Conditions that auto-trigger this scenario
    accessLevel: {
      type: String,
      enum: ['basic', 'medical', 'full']
    },
    autoNotifyContacts: { type: Boolean, default: true },
    autoShareLocation: { type: Boolean, default: true },
    priorityLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    }
  }],
  
  // Access History and Audit Trail
  accessHistory: [{
    accessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    accessMethod: {
      type: String,
      enum: ['qr_code', 'nfc', 'face_recognition', 'fingerprint', 'aadhaar', 'otp', 'manual']
    },
    accessLevel: String,
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    ipAddress: String,
    userAgent: String,
    accessedAt: { type: Date, default: Date.now },
    dataAccessed: [String], // What specific data was accessed
    emergencyType: String,
    verificationSuccess: Boolean,
    notes: String
  }],
  
  // Security Settings
  security: {
    maxDailyAccess: { type: Number, default: 10 },
    requireTwoFactorAuth: { type: Boolean, default: false },
    allowRemoteAccess: { type: Boolean, default: true },
    blacklistedIPs: [String],
    whitelistedIPs: [String],
    suspiciousActivityThreshold: { type: Number, default: 5 },
    autoLockAfterFailures: { type: Number, default: 3 },
    lockDuration: { type: Number, default: 3600000 }, // 1 hour in milliseconds
    isLocked: { type: Boolean, default: false },
    lockedUntil: Date,
    lastSecurityCheck: Date
  },
  
  // Notification Preferences
  notifications: {
    notifyOnAccess: { type: Boolean, default: true },
    notifyOnFailedAccess: { type: Boolean, default: true },
    notifyOnLocationChange: { type: Boolean, default: false },
    notifyEmergencyContacts: { type: Boolean, default: true },
    methods: [{
      type: String,
      enum: ['sms', 'email', 'push', 'call']
    }],
    quietHours: {
      enabled: { type: Boolean, default: false },
      start: String, // HH:MM
      end: String    // HH:MM
    }
  },
  
  // Medical Alert Information
  medicalAlerts: {
    criticalAllergies: [String],
    chronicConditions: [String],
    currentMedications: [String],
    bloodType: String,
    organDonor: Boolean,
    emergencyInstructions: String,
    dnrStatus: { // Do Not Resuscitate
      type: Boolean,
      default: false
    },
    livingWill: {
      exists: Boolean,
      documentUrl: String
    },
    medicalPowerOfAttorney: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  
  // Insurance and Healthcare Provider Info
  healthcareInfo: {
    primaryDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    primaryHospital: String,
    insuranceProvider: String,
    policyNumber: String, // Encrypted
    groupNumber: String,
    subscriberId: String // Encrypted
  },
  
  // Consent and Legal
  consent: {
    dataSharing: {
      given: { type: Boolean, default: false },
      givenAt: Date,
      expiresAt: Date,
      scope: [String] // What data can be shared
    },
    emergencyTreatment: {
      given: { type: Boolean, default: true },
      givenAt: Date,
      restrictions: [String]
    },
    researchParticipation: {
      given: { type: Boolean, default: false },
      givenAt: Date
    }
  },
  
  // System Metadata
  isActive: { type: Boolean, default: true },
  lastUpdated: Date,
  version: { type: Number, default: 1 }, // For tracking schema changes
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance and security
emergencyAccessSchema.index({ patient: 1 });
emergencyAccessSchema.index({ 'accessMethods.qrCode.code': 1 });
emergencyAccessSchema.index({ 'accessMethods.nfcTag.tagId': 1 });
emergencyAccessSchema.index({ 'accessHistory.accessedAt': -1 });
emergencyAccessSchema.index({ 'accessHistory.accessedBy': 1 });
emergencyAccessSchema.index({ isActive: 1 });
emergencyAccessSchema.index({ 'security.isLocked': 1 });

// Virtual fields
emergencyAccessSchema.virtual('isCurrentlyLocked').get(function() {
  return this.security.isLocked && 
         this.security.lockedUntil && 
         this.security.lockedUntil > new Date();
});

emergencyAccessSchema.virtual('qrCodeValid').get(function() {
  const qr = this.accessMethods.qrCode;
  return qr.enabled && 
         qr.code && 
         qr.expiresAt && 
         qr.expiresAt > new Date();
});

emergencyAccessSchema.virtual('accessAttemptsToday').get(function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.accessHistory.filter(access => 
    access.accessedAt >= today
  ).length;
});

// Pre-save middleware
emergencyAccessSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  
  // Auto-unlock if lock period has expired
  if (this.security.isLocked && 
      this.security.lockedUntil && 
      this.security.lockedUntil <= new Date()) {
    this.security.isLocked = false;
    this.security.lockedUntil = undefined;
  }
  
  next();
});

// Instance methods
emergencyAccessSchema.methods.generateQRCode = function() {
  const crypto = require('crypto');
  const qrData = {
    patientId: this.patient,
    timestamp: Date.now(),
    emergencyAccess: true
  };
  
  const qrString = JSON.stringify(qrData);
  const qrCode = crypto.createHash('sha256').update(qrString).digest('hex');
  
  this.accessMethods.qrCode.code = qrCode;
  this.accessMethods.qrCode.generatedAt = new Date();
  this.accessMethods.qrCode.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  return qrCode;
};

emergencyAccessSchema.methods.verifyAccess = function(method, data, location = null) {
  // Check if system is locked
  if (this.isCurrentlyLocked) {
    throw new Error('Emergency access is temporarily locked due to security concerns');
  }
  
  // Check daily access limits
  if (this.accessAttemptsToday >= this.security.maxDailyAccess) {
    throw new Error('Daily access limit exceeded');
  }
  
  // Location-based verification
  if (this.locationSettings.restrictByLocation && location) {
    const isAllowedLocation = this.locationSettings.allowedLocations.some(allowedLoc => {
      const distance = this.calculateDistance(
        location.latitude, location.longitude,
        allowedLoc.coordinates.latitude, allowedLoc.coordinates.longitude
      );
      return distance <= allowedLoc.radius;
    });
    
    if (!isAllowedLocation) {
      throw new Error('Access not allowed from this location');
    }
  }
  
  // Time-based verification
  if (this.timeRestrictions.enabled) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.toLocaleDateString('en', { weekday: 'lowercase' });
    
    const [startHour] = this.timeRestrictions.allowedHours.start.split(':').map(Number);
    const [endHour] = this.timeRestrictions.allowedHours.end.split(':').map(Number);
    
    if (!this.timeRestrictions.allowedDays.includes(currentDay) ||
        currentHour < startHour || currentHour > endHour) {
      throw new Error('Access not allowed at this time');
    }
  }
  
  return true;
};

emergencyAccessSchema.methods.logAccess = function(accessedBy, method, success, details = {}) {
  const accessLog = {
    accessedBy,
    accessMethod: method,
    accessLevel: this.accessLevel,
    location: details.location,
    ipAddress: details.ipAddress,
    userAgent: details.userAgent,
    accessedAt: new Date(),
    dataAccessed: details.dataAccessed || [],
    emergencyType: details.emergencyType,
    verificationSuccess: success,
    notes: details.notes
  };
  
  this.accessHistory.push(accessLog);
  
  // Check for suspicious activity
  const recentFailures = this.accessHistory
    .filter(log => 
      !log.verificationSuccess && 
      log.accessedAt > new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
    ).length;
  
  if (recentFailures >= this.security.autoLockAfterFailures) {
    this.security.isLocked = true;
    this.security.lockedUntil = new Date(Date.now() + this.security.lockDuration);
  }
  
  return this.save();
};

emergencyAccessSchema.methods.calculateDistance = function(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

emergencyAccessSchema.methods.sendEmergencyAlert = function(emergencyType, location, additionalInfo = {}) {
  const alert = {
    patientId: this.patient,
    emergencyType,
    location,
    timestamp: new Date(),
    accessLevel: this.accessLevel,
    emergencyContacts: [
      this.emergencyContact.primary,
      this.emergencyContact.secondary
    ].filter(contact => contact && contact.phone),
    additionalInfo
  };
  
  // This would typically trigger notification services
  return alert;
};

// Static methods
emergencyAccessSchema.statics.findByQRCode = function(qrCode) {
  return this.findOne({
    'accessMethods.qrCode.code': qrCode,
    'accessMethods.qrCode.enabled': true,
    'accessMethods.qrCode.expiresAt': { $gt: new Date() },
    isActive: true
  }).populate('patient', 'firstName lastName dateOfBirth medicalInfo');
};

emergencyAccessSchema.statics.findByNFC = function(nfcTagId) {
  return this.findOne({
    'accessMethods.nfcTag.tagId': nfcTagId,
    'accessMethods.nfcTag.enabled': true,
    isActive: true
  }).populate('patient', 'firstName lastName dateOfBirth medicalInfo');
};

emergencyAccessSchema.statics.getEmergencyInfo = function(patientId, accessLevel = 'basic') {
  const pipeline = [
    { $match: { patient: mongoose.Types.ObjectId(patientId), isActive: true } },
    {
      $lookup: {
        from: 'users',
        localField: 'patient',
        foreignField: '_id',
        as: 'patientInfo'
      }
    },
    { $unwind: '$patientInfo' }
  ];
  
  // Project fields based on access level
  let projectFields = {
    'patientInfo.firstName': 1,
    'patientInfo.lastName': 1,
    'patientInfo.dateOfBirth': 1,
    'emergencyContact': 1,
    'medicalAlerts.bloodType': 1,
    'medicalAlerts.criticalAllergies': 1
  };
  
  if (accessLevel === 'medical' || accessLevel === 'full') {
    projectFields = {
      ...projectFields,
      'patientInfo.medicalInfo': 1,
      'medicalAlerts': 1,
      'healthcareInfo': 1
    };
  }
  
  if (accessLevel === 'full') {
    projectFields = {
      ...projectFields,
      'patientInfo': 1,
      '$root': 1
    };
  }
  
  pipeline.push({ $project: projectFields });
  
  return this.aggregate(pipeline);
};

module.exports = mongoose.model('EmergencyAccess', emergencyAccessSchema);
