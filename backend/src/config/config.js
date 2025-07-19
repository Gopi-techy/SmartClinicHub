require('dotenv').config();

const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,

  // Frontend URL
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000'
  },

  // Database configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/smartclinichub',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0
    }
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    expiresIn: '24h',
    refreshExpiresIn: '7d'
  },
  
  encryption: {
    algorithm: 'aes-256-gcm',
    key: process.env.ENCRYPTION_KEY || 'default-32-char-key-change-prod!',
    ivLength: 16
  },

  // Email configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    password: process.env.EMAIL_PASSWORD || 'your-app-password',
    from: process.env.EMAIL_FROM || 'SmartClinicHub <noreply@smartclinichub.com>'
  },

  // SMS configuration (Twilio)
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER
  },

  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@smartclinichub.com'
  },

  // Azure Blob Storage configuration
  azure: {
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    containerName: process.env.AZURE_CONTAINER_NAME || 'smartclinic-files'
  },

  // Gemini AI configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY
  },

  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }
  },

  // Emergency access configuration
  emergency: {
    apiKey: process.env.EMERGENCY_API_KEY,
    maxRadius: 50, // km
    responseTimeLimit: 300000, // 5 minutes in milliseconds
    criticalAlertThreshold: 3, // number of failed auth attempts before alert
    qrCodeExpiryTime: parseInt(process.env.QR_CODE_EXPIRY) || 24 * 60 * 60 * 1000, // 24 hours
    maxEmergencyContacts: parseInt(process.env.MAX_EMERGENCY_CONTACTS) || 5,
    emergencyNumbers: {
      general: process.env.EMERGENCY_NUMBER_GENERAL || '112',
      medical: process.env.EMERGENCY_NUMBER_MEDICAL || '911',
      poison: process.env.EMERGENCY_NUMBER_POISON || '1-800-222-1222'
    }
  },

  // Appointment configuration
  appointment: {
    slotDuration: 30, // minutes
    advanceBookingDays: 30,
    reminderTimes: [24, 2], // hours before appointment
    maxConcurrentSlots: 10,
    defaultDuration: parseInt(process.env.DEFAULT_APPOINTMENT_DURATION) || 30, // minutes
    bufferTime: parseInt(process.env.APPOINTMENT_BUFFER_TIME) || 15, // minutes
    maxAdvanceBooking: parseInt(process.env.MAX_ADVANCE_BOOKING) || 90 // days
  },

  security: {
    bcryptRounds: 12,
    maxLoginAttempts: 5,
    lockoutTime: 900000, // 15 minutes
    sessionTimeout: 3600000, // 1 hour
    otpExpiry: 300000, // 5 minutes
    qrCodeExpiry: 600000, // 10 minutes
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
    passwordRequireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
    passwordRequireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
    passwordRequireSpecial: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false'
  },

  ai: {
    maxTokens: 1000,
    temperature: 0.7,
    emergencyPromptTemplate: `You are an emergency medical AI assistant. 
    Provide immediate, clear, and safe guidance for: {situation}.
    Always prioritize calling emergency services (911) for life-threatening conditions.`,
    triageCategories: ['critical', 'urgent', 'standard', 'non-urgent'],
    maxPromptLength: parseInt(process.env.AI_MAX_PROMPT_LENGTH) || 10000,
    cacheTimeout: parseInt(process.env.AI_CACHE_TIMEOUT) || 5 * 60 * 1000, // 5 minutes
    maxRequestsPerHour: parseInt(process.env.AI_MAX_REQUESTS_PER_HOUR) || 100,
    enableCaching: process.env.AI_ENABLE_CACHING !== 'false'
  },

  pharmacy: {
    externalAPIs: {
      '1mg': {
        baseUrl: 'https://api.1mg.com',
        timeout: 30000
      },
      'netmeds': {
        baseUrl: 'https://api.netmeds.com',
        timeout: 30000
      }
    },
    prescriptionValidity: 90, // days
    refillLimit: 5,
    qrCodeExpiryDays: parseInt(process.env.PRESCRIPTION_QR_EXPIRY_DAYS) || 90,
    maxMedicationsPerPrescription: parseInt(process.env.MAX_MEDICATIONS_PER_PRESCRIPTION) || 10,
    allowGenericSubstitution: process.env.ALLOW_GENERIC_SUBSTITUTION !== 'false'
  },

  // File upload configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf', '.txt'],
    maxFiles: parseInt(process.env.MAX_FILES) || 10,
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedDocumentTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    allowedMedicalTypes: [
      'application/dicom',
      'image/jpeg',
      'image/png',
      'application/pdf'
    ]
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    db: 0,
    keyPrefix: 'smartclinic:'
  },

  // Payment configuration (Stripe)
  payment: {
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY || 'pk_test_your-stripe-public-key',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_your-stripe-secret-key',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your-webhook-secret',
    defaultCurrency: process.env.DEFAULT_CURRENCY || 'usd'
  },

  // Web Push Notifications
  webPush: {
    publicKey: process.env.VAPID_PUBLIC_KEY || 'your-vapid-public-key',
    privateKey: process.env.VAPID_PRIVATE_KEY || 'your-vapid-private-key',
    subject: process.env.VAPID_SUBJECT || 'mailto:admin@smartclinichub.com'
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // requests per window
    sensitiveMax: parseInt(process.env.RATE_LIMIT_SENSITIVE_MAX) || 20 // for sensitive operations
  },

  // Health monitoring configuration
  health: {
    maxVitalRecords: parseInt(process.env.MAX_VITAL_RECORDS) || 100,
    maxSymptomRecords: parseInt(process.env.MAX_SYMPTOM_RECORDS) || 50,
    vitalNormalRanges: {
      bloodPressure: {
        systolic: { min: 90, max: 140 },
        diastolic: { min: 60, max: 90 }
      },
      heartRate: { min: 60, max: 100 },
      temperature: { min: 36.0, max: 38.0 },
      oxygenSaturation: { min: 95, max: 100 }
    }
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    auditRetentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS) || 365
  },

  // Development tools
  development: {
    enableSwagger: process.env.ENABLE_SWAGGER === 'true',
    enableDebugRoutes: process.env.ENABLE_DEBUG_ROUTES === 'true',
    enableCors: process.env.ENABLE_CORS !== 'false'
  },

  // Analytics and monitoring
  analytics: {
    enableTracking: process.env.ENABLE_ANALYTICS !== 'false',
    googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID || '',
    sentryDsn: process.env.SENTRY_DSN || ''
  },

  // Backup and maintenance
  backup: {
    enableAutoBackup: process.env.ENABLE_AUTO_BACKUP === 'true',
    backupSchedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30
  }
};

// Validation function
const validateConfig = () => {
  const requiredFields = [
    'jwt.secret'
  ];

  const missingFields = requiredFields.filter(field => {
    const keys = field.split('.');
    let value = config;
    for (const key of keys) {
      value = value[key];
      if (value === undefined) return true;
    }
    return false;
  });

  if (missingFields.length > 0) {
    throw new Error(`Missing required configuration fields: ${missingFields.join(', ')}`);
  }

  // Environment-specific validations
  if (config.env === 'production') {
    const productionRequiredFields = [
      'sendgrid.apiKey',
      'azure.connectionString',
      'gemini.apiKey',
      'payment.stripeSecretKey'
    ];

    const missingProdFields = productionRequiredFields.filter(field => {
      const keys = field.split('.');
      let value = config;
      for (const key of keys) {
        value = value[key];
        if (!value || value.includes('your-') || value.includes('change-in-production')) {
          return true;
        }
      }
      return false;
    });

    if (missingProdFields.length > 0) {
      console.warn(`⚠️  Production environment detected but some configuration fields need attention: ${missingProdFields.join(', ')}`);
    }
  }
};

// Validate configuration on load
try {
  validateConfig();
  console.log('✅ Configuration validated successfully');
} catch (error) {
  console.error('❌ Configuration validation failed:', error.message);
  if (config.env === 'production') {
    process.exit(1);
  }
}

module.exports = config;
