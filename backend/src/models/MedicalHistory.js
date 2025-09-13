const mongoose = require('mongoose');

const allergySchema = new mongoose.Schema({
  allergen: {
    type: String,
    required: [true, 'Allergen name is required']
  },
  allergyType: {
    type: String,
    enum: ['food', 'medication', 'environmental', 'seasonal', 'contact', 'other'],
    required: [true, 'Allergy type is required']
  },
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe', 'life-threatening'],
    required: [true, 'Severity is required']
  },
  symptoms: [String],
  reactions: [String],
  notes: String,
  diagnosedDate: Date,
  lastReaction: Date
}, { _id: false });

const conditionSchema = new mongoose.Schema({
  conditionName: {
    type: String,
    required: [true, 'Condition name is required']
  },
  icd10Code: String,
  category: {
    type: String,
    enum: ['chronic', 'acute', 'genetic', 'mental-health', 'infectious', 'autoimmune', 'other'],
    default: 'other'
  },
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe', 'critical'],
    default: 'mild'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'resolved', 'chronic'],
    default: 'active'
  },
  diagnosedDate: Date,
  diagnosedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  symptoms: [String],
  treatments: [String],
  medications: [String],
  notes: String,
  lastFlareUp: Date,
  remissionDate: Date
}, { _id: false });

const familyHistorySchema = new mongoose.Schema({
  relationship: {
    type: String,
    enum: ['mother', 'father', 'sibling', 'grandparent', 'aunt', 'uncle', 'cousin', 'other'],
    required: [true, 'Family relationship is required']
  },
  conditions: [String],
  ageAtDiagnosis: Number,
  ageAtDeath: Number,
  causeOfDeath: String,
  notes: String
}, { _id: false });

const surgerySchema = new mongoose.Schema({
  surgeryName: {
    type: String,
    required: [true, 'Surgery name is required']
  },
  surgeryDate: {
    type: Date,
    required: [true, 'Surgery date is required']
  },
  surgeon: String,
  hospital: String,
  reason: String,
  complications: [String],
  outcome: {
    type: String,
    enum: ['successful', 'complications', 'failed', 'partial-success'],
    default: 'successful'
  },
  recoveryNotes: String,
  followUpRequired: Boolean
}, { _id: false });

const medicationHistorySchema = new mongoose.Schema({
  medicationName: {
    type: String,
    required: [true, 'Medication name is required']
  },
  genericName: String,
  dosage: String,
  frequency: String,
  startDate: Date,
  endDate: Date,
  prescribedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reason: String,
  sideEffects: [String],
  effectiveness: {
    type: String,
    enum: ['very-effective', 'effective', 'somewhat-effective', 'not-effective', 'unknown'],
    default: 'unknown'
  },
  discontinued: Boolean,
  discontinuationReason: String
}, { _id: false });

const medicalHistorySchema = new mongoose.Schema({
  // Patient Information
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient is required'],
    unique: true,
    index: true
  },

  // Basic Medical Information
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    default: 'Unknown'
  },

  // Allergies
  allergies: [allergySchema],

  // Medical Conditions
  conditions: [conditionSchema],

  // Family History
  familyHistory: [familyHistorySchema],

  // Surgical History
  surgeries: [surgerySchema],

  // Medication History
  medicationHistory: [medicationHistorySchema],

  // Lifestyle Information
  lifestyle: {
    smokingStatus: {
      type: String,
      enum: ['never', 'former', 'current', 'unknown'],
      default: 'unknown'
    },
    smokingHistory: {
      packsPerDay: Number,
      yearsSmoked: Number,
      quitDate: Date
    },
    alcoholConsumption: {
      type: String,
      enum: ['none', 'occasional', 'moderate', 'heavy', 'unknown'],
      default: 'unknown'
    },
    exerciseFrequency: {
      type: String,
      enum: ['none', 'rare', 'weekly', 'daily', 'unknown'],
      default: 'unknown'
    },
    diet: {
      type: String,
      enum: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'other', 'unknown'],
      default: 'unknown'
    },
    occupation: String,
    occupationalHazards: [String]
  },

  // Immunization Status
  immunizations: [{
    vaccineName: String,
    dateGiven: Date,
    nextDue: Date,
    provider: String,
    lotNumber: String,
    isUpToDate: {
      type: Boolean,
      default: true
    }
  }],

  // Emergency Information
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String,
    address: String
  },

  // Insurance Information
  insurance: {
    primaryInsurance: {
      provider: String,
      policyNumber: String,
      groupNumber: String,
      memberID: String
    },
    secondaryInsurance: {
      provider: String,
      policyNumber: String,
      groupNumber: String,
      memberID: String
    }
  },

  // Healthcare Providers
  primaryCarePhysician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  specialists: [{
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    specialization: String,
    firstVisit: Date,
    lastVisit: Date,
    reason: String
  }],

  // Preferences and Directives
  preferences: {
    preferredLanguage: String,
    religiousRestrictions: [String],
    dietaryRestrictions: [String],
    communicationPreference: {
      type: String,
      enum: ['phone', 'email', 'text', 'mail'],
      default: 'email'
    }
  },

  advanceDirectives: {
    hasLivingWill: {
      type: Boolean,
      default: false
    },
    hasPowerOfAttorney: {
      type: Boolean,
      default: false
    },
    dnrOrder: {
      type: Boolean,
      default: false
    },
    organDonor: {
      type: Boolean,
      default: false
    },
    documentUrls: [String]
  },

  // Metadata
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  completenessScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }

}, {
  timestamps: true
});

// Calculate completeness score
medicalHistorySchema.methods.calculateCompleteness = function() {
  let score = 0;
  const fields = [
    this.bloodType !== 'Unknown' ? 10 : 0,
    this.allergies.length > 0 ? 15 : 0,
    this.conditions.length > 0 ? 10 : 0,
    this.familyHistory.length > 0 ? 10 : 0,
    this.lifestyle.smokingStatus !== 'unknown' ? 5 : 0,
    this.lifestyle.alcoholConsumption !== 'unknown' ? 5 : 0,
    this.lifestyle.exerciseFrequency !== 'unknown' ? 5 : 0,
    this.emergencyContact.name ? 15 : 0,
    this.insurance.primaryInsurance.provider ? 10 : 0,
    this.primaryCarePhysician ? 10 : 0,
    this.preferences.communicationPreference ? 5 : 0
  ];
  
  score = fields.reduce((sum, val) => sum + val, 0);
  this.completenessScore = Math.min(score, 100);
  return this.completenessScore;
};

// Get active allergies
medicalHistorySchema.methods.getActiveAllergies = function() {
  return this.allergies.filter(allergy => 
    allergy.severity === 'severe' || allergy.severity === 'life-threatening'
  );
};

// Get current medications
medicalHistorySchema.methods.getCurrentMedications = function() {
  return this.medicationHistory.filter(med => !med.discontinued);
};

// Check for drug interactions
medicalHistorySchema.methods.checkDrugInteractions = function(newMedication) {
  // This would integrate with a drug interaction database
  // For now, return a placeholder
  return {
    hasInteractions: false,
    interactions: []
  };
};

// Get risk factors
medicalHistorySchema.methods.getRiskFactors = function() {
  const riskFactors = [];
  
  // Smoking risk
  if (this.lifestyle.smokingStatus === 'current') {
    riskFactors.push('Current smoker');
  }
  
  // Age-based risks (would need patient DOB)
  
  // Family history risks
  const commonConditions = ['diabetes', 'heart disease', 'cancer', 'hypertension'];
  this.familyHistory.forEach(family => {
    family.conditions.forEach(condition => {
      if (commonConditions.some(c => condition.toLowerCase().includes(c))) {
        riskFactors.push(`Family history of ${condition}`);
      }
    });
  });
  
  return riskFactors;
};

// Middleware to update completeness score on save
medicalHistorySchema.pre('save', function(next) {
  this.calculateCompleteness();
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('MedicalHistory', medicalHistorySchema);
