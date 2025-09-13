const mongoose = require('mongoose');

const vitalSignSchema = new mongoose.Schema({
  bloodPressure: {
    systolic: {
      type: Number,
      min: [60, 'Systolic pressure too low'],
      max: [300, 'Systolic pressure too high']
    },
    diastolic: {
      type: Number,
      min: [40, 'Diastolic pressure too low'],
      max: [200, 'Diastolic pressure too high']
    }
  },
  heartRate: {
    type: Number,
    min: [30, 'Heart rate too low'],
    max: [200, 'Heart rate too high']
  },
  temperature: {
    type: Number,
    min: [30, 'Temperature too low'],
    max: [50, 'Temperature too high']
  },
  weight: {
    type: Number,
    min: [1, 'Weight too low'],
    max: [1000, 'Weight too high']
  },
  height: {
    type: Number,
    min: [30, 'Height too low'],
    max: [300, 'Height too high']
  },
  oxygenSaturation: {
    type: Number,
    min: [50, 'Oxygen saturation too low'],
    max: [100, 'Oxygen saturation cannot exceed 100%']
  },
  bloodSugar: {
    type: Number,
    min: [20, 'Blood sugar too low'],
    max: [800, 'Blood sugar too high']
  }
}, { _id: false });

const labResultSchema = new mongoose.Schema({
  testName: {
    type: String,
    required: [true, 'Test name is required']
  },
  testType: {
    type: String,
    enum: ['blood', 'urine', 'stool', 'imaging', 'biopsy', 'other'],
    default: 'blood'
  },
  result: {
    type: String,
    required: [true, 'Test result is required']
  },
  normalRange: {
    type: String
  },
  unit: {
    type: String
  },
  status: {
    type: String,
    enum: ['normal', 'abnormal', 'critical', 'pending'],
    default: 'normal'
  },
  notes: String
}, { _id: false });

const healthRecordSchema = new mongoose.Schema({
  // Patient Information
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient is required'],
    index: true
  },

  // Record Information
  recordType: {
    type: String,
    enum: ['vital-signs', 'lab-results', 'imaging', 'diagnosis', 'treatment', 'vaccination'],
    required: [true, 'Record type is required']
  },

  recordDate: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },

  // Healthcare Provider
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Associated Appointment
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },

  // Vital Signs (for vital-signs type)
  vitalSigns: vitalSignSchema,

  // Lab Results (for lab-results type)
  labResults: [labResultSchema],

  // Diagnosis Information
  diagnosis: {
    primary: String,
    secondary: [String],
    icd10Code: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe', 'critical']
    }
  },

  // Treatment Information
  treatment: {
    description: String,
    medications: [String],
    procedures: [String],
    followUpRequired: {
      type: Boolean,
      default: false
    },
    followUpDate: Date
  },

  // Imaging Results
  imaging: {
    type: String,
    modality: {
      type: String,
      enum: ['x-ray', 'ct-scan', 'mri', 'ultrasound', 'pet-scan', 'other']
    },
    findings: String,
    reportUrl: String,
    imageUrls: [String]
  },

  // Vaccination Information
  vaccination: {
    vaccineName: String,
    vaccineType: String,
    manufacturer: String,
    lotNumber: String,
    doseNumber: Number,
    nextDueDate: Date,
    administeredBy: String,
    location: String
  },

  // General Information
  notes: String,
  
  symptoms: [String],
  
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],

  // Status and Visibility
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },

  visibility: {
    type: String,
    enum: ['patient', 'healthcare-provider', 'emergency-only'],
    default: 'healthcare-provider'
  },

  // Emergency Information
  isEmergency: {
    type: Boolean,
    default: false
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  indexes: [
    { patient: 1, recordDate: -1 },
    { patient: 1, recordType: 1 },
    { recordDate: -1 }
  ]
});

// Middleware to update updatedAt
healthRecordSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for BMI calculation
healthRecordSchema.virtual('bmi').get(function() {
  if (this.vitalSigns && this.vitalSigns.weight && this.vitalSigns.height) {
    const heightInMeters = this.vitalSigns.height / 100;
    return (this.vitalSigns.weight / (heightInMeters * heightInMeters)).toFixed(1);
  }
  return null;
});

// Method to check if record needs attention
healthRecordSchema.methods.needsAttention = function() {
  if (this.recordType === 'lab-results') {
    return this.labResults.some(result => result.status === 'critical' || result.status === 'abnormal');
  }
  
  if (this.recordType === 'vital-signs' && this.vitalSigns) {
    const vs = this.vitalSigns;
    return (
      (vs.bloodPressure && (vs.bloodPressure.systolic > 140 || vs.bloodPressure.diastolic > 90)) ||
      (vs.heartRate && (vs.heartRate < 60 || vs.heartRate > 100)) ||
      (vs.temperature && (vs.temperature < 36 || vs.temperature > 38)) ||
      (vs.oxygenSaturation && vs.oxygenSaturation < 95)
    );
  }
  
  return this.isEmergency;
};

// Static method to get patient's health summary
healthRecordSchema.statics.getPatientHealthSummary = async function(patientId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const records = await this.find({
    patient: patientId,
    recordDate: { $gte: startDate },
    status: 'active'
  })
  .sort({ recordDate: -1 })
  .populate('recordedBy', 'firstName lastName professionalInfo.specialization')
  .populate('appointment', 'appointmentDate type');
  
  return {
    totalRecords: records.length,
    vitalSigns: records.filter(r => r.recordType === 'vital-signs').slice(0, 10),
    labResults: records.filter(r => r.recordType === 'lab-results').slice(0, 10),
    diagnoses: records.filter(r => r.recordType === 'diagnosis').slice(0, 10),
    treatments: records.filter(r => r.recordType === 'treatment').slice(0, 10),
    vaccinations: records.filter(r => r.recordType === 'vaccination').slice(0, 10),
    needsAttention: records.filter(r => r.needsAttention())
  };
};

module.exports = mongoose.model('HealthRecord', healthRecordSchema);
