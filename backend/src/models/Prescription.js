const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  // Basic Prescription Information
  prescriptionNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  // Patient and Doctor Information
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
  
  // Associated Appointment
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  
  // Prescription Date and Validity
  prescribedDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  validUntil: {
    type: Date,
    required: true
  },
  
  // Medications
  medications: [{
    name: {
      type: String,
      required: [true, 'Medication name is required']
    },
    
    genericName: String,
    
    strength: {
      type: String,
      required: [true, 'Medication strength is required']
    },
    
    dosage: {
      type: String,
      required: [true, 'Dosage is required'],
      // e.g., "1 tablet", "2 capsules", "5ml"
    },
    
    frequency: {
      type: String,
      required: [true, 'Frequency is required'],
      enum: ['once_daily', 'twice_daily', 'thrice_daily', 'four_times_daily', 
             'every_4_hours', 'every_6_hours', 'every_8_hours', 'every_12_hours',
             'as_needed', 'before_meals', 'after_meals', 'at_bedtime', 'custom']
    },
    
    customFrequency: {
      type: String,
      // Used when frequency is 'custom'
    },
    
    duration: {
      value: {
        type: Number,
        required: [true, 'Duration value is required']
      },
      unit: {
        type: String,
        enum: ['days', 'weeks', 'months'],
        required: [true, 'Duration unit is required']
      }
    },
    
    route: {
      type: String,
      enum: ['oral', 'topical', 'injection', 'inhaler', 'drops', 'suppository', 'patch'],
      default: 'oral'
    },
    
    instructions: {
      type: String,
      required: [true, 'Instructions are required']
      // e.g., "Take with food", "Take on empty stomach"
    },
    
    quantity: {
      prescribed: {
        type: Number,
        required: [true, 'Prescribed quantity is required']
      },
      unit: {
        type: String,
        required: [true, 'Quantity unit is required']
        // e.g., "tablets", "capsules", "ml", "tubes"
      }
    },
    
    refills: {
      allowed: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      remaining: {
        type: Number,
        default: 0
      }
    },
    
    // Drug Information
    drugInfo: {
      drugClass: String,
      mechanism: String,
      contraindications: [String],
      sideEffects: [String],
      interactions: [String]
    },
    
    // Substitution allowed
    substitutionAllowed: {
      type: Boolean,
      default: true
    },
    
    // Priority/Importance
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    
    // Status tracking
    status: {
      type: String,
      enum: ['active', 'discontinued', 'completed', 'on_hold'],
      default: 'active'
    },
    
    discontinuedDate: Date,
    discontinuedReason: String
  }],
  
  // Diagnosis and Clinical Information
  diagnosis: {
    primary: {
      type: String,
      required: [true, 'Primary diagnosis is required']
    },
    secondary: [String],
    icdCodes: [String] // ICD-10 codes
  },
  
  // Clinical Notes
  clinicalNotes: {
    symptoms: String,
    examination: String,
    investigations: String,
    assessment: String,
    plan: String
  },
  
  // Pharmacy Information
  pharmacy: {
    preferred: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dispensedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dispensedDate: Date,
    dispensingPharmacy: {
      name: String,
      address: String,
      licenseNumber: String,
      pharmacistName: String
    }
  },
  
  // E-Prescription Details
  ePrescription: {
    digitalSignature: String,
    qrCode: String, // For verification
    barcode: String,
    verificationCode: String,
    encryptedData: String
  },
  
  // Prescription Status
  status: {
    type: String,
    enum: ['active', 'filled', 'partially_filled', 'cancelled', 'expired'],
    default: 'active'
  },
  
  // Filling History
  fillingHistory: [{
    pharmacy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    pharmacist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    filledDate: Date,
    medications: [{
      medicationId: String, // Reference to medication in the medications array
      quantityFilled: Number,
      batchNumber: String,
      expiryDate: Date,
      manufacturerName: String,
      cost: Number
    }],
    totalCost: Number,
    paymentMethod: String,
    notes: String
  }],
  
  // Insurance and Payment
  insurance: {
    provider: String,
    policyNumber: String,
    coverage: Number, // Percentage
    copay: Number,
    deductible: Number,
    approvalRequired: Boolean,
    approvalCode: String
  },
  
  // Special Instructions
  specialInstructions: {
    patientInstructions: String,
    pharmacyInstructions: String,
    emergencyInstructions: String,
    followUpRequired: Boolean,
    followUpDate: Date
  },
  
  // Drug Interactions and Alerts
  alerts: [{
    type: {
      type: String,
      enum: ['allergy', 'interaction', 'contraindication', 'dosage', 'age', 'pregnancy']
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    message: String,
    acknowledged: Boolean,
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    acknowledgedAt: Date
  }],
  
  // Delivery Information (for online pharmacies)
  delivery: {
    required: Boolean,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    preferredTime: String,
    deliveryInstructions: String,
    tracking: {
      trackingNumber: String,
      carrier: String,
      status: {
        type: String,
        enum: ['pending', 'dispatched', 'in_transit', 'delivered', 'failed']
      },
      estimatedDelivery: Date,
      actualDelivery: Date
    }
  },
  
  // Compliance and Monitoring
  adherence: {
    tracking: Boolean,
    reminders: [{
      time: String, // HH:MM format
      enabled: Boolean,
      lastSent: Date
    }],
    missedDoses: [{
      medicationName: String,
      scheduledTime: Date,
      actualTime: Date,
      missed: Boolean,
      reason: String
    }]
  },
  
  // Legal and Regulatory
  regulatory: {
    controlledSubstance: Boolean,
    scheduleClass: String, // DEA schedule classification
    prescriptionType: {
      type: String,
      enum: ['new', 'refill', 'transfer', 'emergency'],
      default: 'new'
    },
    specialAuthorization: String,
    priorAuthorization: {
      required: Boolean,
      approved: Boolean,
      approvalNumber: String,
      approvedDate: Date
    }
  },
  
  // Integration with External Systems
  externalSystems: {
    hospitalSystem: {
      id: String,
      name: String,
      reference: String
    },
    pharmacyChain: {
      id: String,
      name: String,
      reference: String
    },
    insuranceSystem: {
      id: String,
      claimNumber: String
    }
  },
  
  // Document Attachments
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    description: String,
    uploadedAt: Date
  }],
  
  // Audit Trail
  auditTrail: [{
    action: {
      type: String,
      enum: ['created', 'modified', 'filled', 'cancelled', 'refilled', 'viewed']
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: Date,
    details: String,
    ipAddress: String,
    userAgent: String
  }],
  
  // Metadata
  version: {
    type: Number,
    default: 1
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

// Indexes for performance (prescriptionNumber already has unique: true)
prescriptionSchema.index({ patient: 1, prescribedDate: -1 });
prescriptionSchema.index({ doctor: 1, prescribedDate: -1 });
prescriptionSchema.index({ status: 1 });
prescriptionSchema.index({ validUntil: 1 });
prescriptionSchema.index({ 'ePrescription.qrCode': 1 });
prescriptionSchema.index({ 'ePrescription.verificationCode': 1 });
prescriptionSchema.index({ appointment: 1 });

// Compound indexes
prescriptionSchema.index({ 
  patient: 1, 
  status: 1, 
  prescribedDate: -1 
});

prescriptionSchema.index({
  'pharmacy.dispensedBy': 1,
  'pharmacy.dispensedDate': -1
});

// Virtual fields
prescriptionSchema.virtual('isExpired').get(function() {
  return this.validUntil && this.validUntil < new Date();
});

prescriptionSchema.virtual('isRefillable').get(function() {
  return this.medications.some(med => 
    med.refills.remaining > 0 && 
    !this.isExpired && 
    this.status === 'filled'
  );
});

prescriptionSchema.virtual('totalMedications').get(function() {
  return this.medications.length;
});

prescriptionSchema.virtual('activeMedications').get(function() {
  return this.medications.filter(med => med.status === 'active').length;
});

prescriptionSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.validUntil) return null;
  
  const now = new Date();
  const diffTime = this.validUntil.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

// Pre-save middleware
prescriptionSchema.pre('save', function(next) {
  // Generate prescription number if not exists
  if (!this.prescriptionNumber) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 6);
    this.prescriptionNumber = `RX-${timestamp.toUpperCase()}-${random.toUpperCase()}`;
  }
  
  // Set validity period (default 90 days)
  if (!this.validUntil) {
    this.validUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  }
  
  // Initialize refills remaining
  this.medications.forEach(med => {
    if (med.refills.remaining === undefined) {
      med.refills.remaining = med.refills.allowed;
    }
  });
  
  next();
});

// Pre-save middleware for audit trail
prescriptionSchema.pre('save', function(next) {
  if (this.isNew) {
    this.auditTrail.push({
      action: 'created',
      performedBy: this.createdBy,
      timestamp: new Date(),
      details: 'Prescription created'
    });
  } else if (this.isModified()) {
    this.auditTrail.push({
      action: 'modified',
      performedBy: this.lastModifiedBy,
      timestamp: new Date(),
      details: 'Prescription modified'
    });
  }
  
  next();
});

// Instance methods
prescriptionSchema.methods.generateQRCode = function() {
  const crypto = require('crypto');
  const qrData = {
    prescriptionId: this._id,
    prescriptionNumber: this.prescriptionNumber,
    patientId: this.patient,
    doctorId: this.doctor,
    timestamp: Date.now()
  };
  
  const qrString = JSON.stringify(qrData);
  const qrCode = crypto.createHash('sha256').update(qrString).digest('hex');
  
  this.ePrescription.qrCode = qrCode;
  this.ePrescription.verificationCode = crypto.randomBytes(6).toString('hex').toUpperCase();
  
  return { qrCode, verificationCode: this.ePrescription.verificationCode };
};

prescriptionSchema.methods.canBeRefilled = function(medicationIndex) {
  const medication = this.medications[medicationIndex];
  
  if (!medication) return false;
  
  return medication.refills.remaining > 0 && 
         !this.isExpired && 
         medication.status === 'active' &&
         this.status === 'filled';
};

prescriptionSchema.methods.processRefill = function(medicationIndex, pharmacyId, pharmacistId) {
  const medication = this.medications[medicationIndex];
  
  if (!this.canBeRefilled(medicationIndex)) {
    throw new Error('Medication cannot be refilled');
  }
  
  // Decrease remaining refills
  medication.refills.remaining -= 1;
  
  // Add to filling history
  this.fillingHistory.push({
    pharmacy: pharmacyId,
    pharmacist: pharmacistId,
    filledDate: new Date(),
    medications: [{
      medicationId: medication._id,
      quantityFilled: medication.quantity.prescribed
    }]
  });
  
  // Add audit entry
  this.auditTrail.push({
    action: 'refilled',
    performedBy: pharmacistId,
    timestamp: new Date(),
    details: `Refill processed for ${medication.name}`
  });
  
  return this.save();
};

prescriptionSchema.methods.markAsFilled = function(pharmacyData) {
  this.status = 'filled';
  this.pharmacy.dispensedBy = pharmacyData.pharmacistId;
  this.pharmacy.dispensedDate = new Date();
  this.pharmacy.dispensingPharmacy = pharmacyData.pharmacyInfo;
  
  // Add to filling history
  this.fillingHistory.push({
    pharmacy: pharmacyData.pharmacyId,
    pharmacist: pharmacyData.pharmacistId,
    filledDate: new Date(),
    medications: pharmacyData.medications,
    totalCost: pharmacyData.totalCost,
    paymentMethod: pharmacyData.paymentMethod,
    notes: pharmacyData.notes
  });
  
  // Add audit entry
  this.auditTrail.push({
    action: 'filled',
    performedBy: pharmacyData.pharmacistId,
    timestamp: new Date(),
    details: 'Prescription filled'
  });
  
  return this.save();
};

prescriptionSchema.methods.checkDrugInteractions = function() {
  const interactions = [];
  
  // Check for drug-drug interactions
  for (let i = 0; i < this.medications.length; i++) {
    for (let j = i + 1; j < this.medications.length; j++) {
      const med1 = this.medications[i];
      const med2 = this.medications[j];
      
      // This would typically query a drug interaction database
      // For now, we'll just check if both are the same drug class
      if (med1.drugInfo.drugClass === med2.drugInfo.drugClass) {
        interactions.push({
          type: 'interaction',
          severity: 'medium',
          message: `Potential interaction between ${med1.name} and ${med2.name}`,
          medications: [med1.name, med2.name]
        });
      }
    }
  }
  
  return interactions;
};

prescriptionSchema.methods.sendReminder = function(medicationName, reminderType = 'dose') {
  // This would integrate with notification services
  const reminder = {
    prescriptionId: this._id,
    patientId: this.patient,
    medicationName,
    reminderType,
    timestamp: new Date()
  };
  
  return reminder;
};

// Static methods
prescriptionSchema.statics.findByQRCode = function(qrCode) {
  return this.findOne({
    'ePrescription.qrCode': qrCode,
    isDeleted: false
  }).populate('patient', 'firstName lastName dateOfBirth')
    .populate('doctor', 'firstName lastName professionalInfo');
};

prescriptionSchema.statics.findByVerificationCode = function(code) {
  return this.findOne({
    'ePrescription.verificationCode': code,
    isDeleted: false
  }).populate('patient', 'firstName lastName')
    .populate('doctor', 'firstName lastName');
};

prescriptionSchema.statics.findActiveByPatient = function(patientId) {
  return this.find({
    patient: patientId,
    status: { $in: ['active', 'filled', 'partially_filled'] },
    validUntil: { $gt: new Date() },
    isDeleted: false
  }).populate('doctor', 'firstName lastName professionalInfo.specialization')
    .sort({ prescribedDate: -1 });
};

prescriptionSchema.statics.findPendingFills = function(pharmacyId) {
  return this.find({
    'pharmacy.preferred': pharmacyId,
    status: 'active',
    isDeleted: false
  }).populate('patient', 'firstName lastName phone')
    .populate('doctor', 'firstName lastName')
    .sort({ prescribedDate: 1 });
};

prescriptionSchema.statics.getExpiringPrescriptions = function(days = 7) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  
  return this.find({
    validUntil: { $lte: expiryDate, $gt: new Date() },
    status: { $in: ['active', 'filled'] },
    isDeleted: false
  }).populate('patient', 'firstName lastName email phone')
    .populate('doctor', 'firstName lastName');
};

prescriptionSchema.statics.getDrugUtilizationReport = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        prescribedDate: { $gte: startDate, $lte: endDate },
        isDeleted: false
      }
    },
    {
      $unwind: '$medications'
    },
    {
      $group: {
        _id: '$medications.name',
        totalPrescribed: { $sum: 1 },
        totalQuantity: { $sum: '$medications.quantity.prescribed' },
        avgDuration: { $avg: '$medications.duration.value' },
        doctors: { $addToSet: '$doctor' }
      }
    },
    {
      $sort: { totalPrescribed: -1 }
    }
  ]);
};

module.exports = mongoose.model('Prescription', prescriptionSchema);
