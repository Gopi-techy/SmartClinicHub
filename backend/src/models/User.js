const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^[+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },
  
  // User Role and Permissions
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin', 'pharmacy'],
    default: 'patient'
  },
  
  // Profile Information
  dateOfBirth: {
    type: Date,
    required: function() {
      return this.role === 'patient';
    }
  },
  
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    required: function() {
      return this.role === 'patient';
    }
  },
  
  // Address Information
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'India' }
  },
  
  // Emergency Contact
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  
  // Medical Information (for patients)
  medicalInfo: {
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    allergies: [String],
    medicalConditions: [String],
    medications: [String],
    height: Number, // in cm
    weight: Number, // in kg
    bmi: Number
  },
  
  // Professional Information (for doctors)
  professionalInfo: {
    specialization: String,
    licenseNumber: String,
    experience: Number, // years
    qualifications: [String],
    consultationFee: Number,
    availableSlots: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      startTime: String, // HH:MM format
      endTime: String,   // HH:MM format
      isAvailable: { type: Boolean, default: true }
    }],
    hospitalAffiliation: String,
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 }
  },
  
  // Security and Authentication
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  phoneVerificationToken: String,
  
  // Two-Factor Authentication
  twoFactorSecret: String,
  isTwoFactorEnabled: { type: Boolean, default: false },
  
  // Emergency Access
  emergencyQRCode: String,
  emergencyTokens: [{
    token: String,
    generatedAt: Date,
    expiresAt: Date,
    isUsed: { type: Boolean, default: false }
  }],
  
  // Biometric Data (encrypted)
  biometricData: {
    faceEncoding: String, // Encrypted face encoding
    fingerprintHash: String,
    aadhaarNumber: String // Encrypted Aadhaar number
  },
  
  // Account Security
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Activity Tracking
  lastLogin: Date,
  lastActivity: Date,
  loginHistory: [{
    ip: String,
    userAgent: String,
    loginTime: Date,
    location: {
      country: String,
      city: String,
      latitude: Number,
      longitude: Number
    }
  }],
  
  // Preferences
  preferences: {
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    privacy: {
      shareDataForResearch: { type: Boolean, default: false },
      allowEmergencyAccess: { type: Boolean, default: true }
    }
  },
  
  // Profile Picture and Documents
  profilePicture: String, // URL to profile picture
  documents: [{
    type: String, // 'license', 'certificate', 'id_proof', etc.
    name: String,
    url: String,
    uploadedAt: Date,
    verified: { type: Boolean, default: false }
  }],
  
  // Status and Metadata
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance (email and phone already have unique: true)
userSchema.index({ role: 1 });
userSchema.index({ 'professionalInfo.specialization': 1 });
userSchema.index({ isActive: 1, isDeleted: 1 });
userSchema.index({ 'address.city': 1, 'address.state': 1 });

// Virtual fields
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

userSchema.virtual('isAccountLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Hash password if it's modified
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  
  // Calculate BMI if height and weight are provided
  if (this.medicalInfo?.height && this.medicalInfo?.weight) {
    const heightInMeters = this.medicalInfo.height / 100;
    this.medicalInfo.bmi = Math.round((this.medicalInfo.weight / (heightInMeters * heightInMeters)) * 100) / 100;
  }
  
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateEmailVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  return token;
};

userSchema.methods.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

userSchema.methods.generateEmergencyToken = function() {
  const token = crypto.randomBytes(16).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  this.emergencyTokens.push({
    token: hashedToken,
    generatedAt: new Date(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  });
  
  return token;
};

userSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 15 minutes
  if (this.loginAttempts + 1 >= 5 && !this.isAccountLocked) {
    updates.$set = { lockUntil: Date.now() + 15 * 60 * 1000 }; // 15 minutes
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

userSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.twoFactorSecret;
  delete obj.biometricData;
  delete obj.emergencyTokens;
  delete obj.emailVerificationToken;
  delete obj.phoneVerificationToken;
  delete obj.passwordResetToken;
  return obj;
};

// Static methods
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ 
    email: email.toLowerCase(),
    isActive: true,
    isDeleted: false 
  }).select('+password');
  
  if (!user) {
    throw new Error('Invalid login credentials');
  }
  
  if (user.isAccountLocked) {
    throw new Error('Account is temporarily locked due to too many failed login attempts');
  }
  
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incrementLoginAttempts();
    throw new Error('Invalid login credentials');
  }
  
  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }
  
  return user;
};

userSchema.statics.findActiveById = function(id) {
  return this.findOne({ 
    _id: id, 
    isActive: true, 
    isDeleted: false 
  });
};

userSchema.statics.findByRole = function(role) {
  return this.find({ 
    role, 
    isActive: true, 
    isDeleted: false 
  });
};

module.exports = mongoose.model('User', userSchema);
