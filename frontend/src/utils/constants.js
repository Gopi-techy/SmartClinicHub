// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Authentication
export const TOKEN_KEY = 'token';
export const USER_KEY = 'user';
export const REFRESH_TOKEN_KEY = 'refreshToken';

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PATIENT_DASHBOARD: '/patient-dashboard',
  DOCTOR_DASHBOARD: '/doctor-dashboard',
  ADMIN_DASHBOARD: '/admin-dashboard',
  APPOINTMENTS: '/appointments',
  BOOK_APPOINTMENT: '/book-appointment',
  HEALTH_RECORDS: '/health-records',
  MESSAGING: '/messaging',
  EMERGENCY: '/emergency',
  PROFILE: '/profile'
};

// User Roles
export const USER_ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin'
};

// Appointment Status
export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show',
  RESCHEDULED: 'rescheduled'
};

// Appointment Types
export const APPOINTMENT_TYPES = {
  CONSULTATION: 'consultation',
  FOLLOW_UP: 'follow-up',
  EMERGENCY: 'emergency',
  ROUTINE_CHECKUP: 'routine-checkup',
  LAB_REVIEW: 'lab-review',
  VACCINATION: 'vaccination'
};

// Appointment Modes
export const APPOINTMENT_MODES = {
  ONLINE: 'online',
  IN_PERSON: 'in-person',
  HYBRID: 'hybrid'
};

// Urgency Levels
export const URGENCY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain'
  ],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt']
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100
};

// Time Formats
export const TIME_FORMATS = {
  DATE: 'YYYY-MM-DD',
  TIME: 'HH:mm',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  DISPLAY_DATE: 'MMM DD, YYYY',
  DISPLAY_TIME: 'h:mm A'
};

// Working Hours
export const WORKING_HOURS = {
  START: 9, // 9 AM
  END: 18,  // 6 PM
  SLOT_DURATION: 30 // 30 minutes
};

// Emergency Levels
export const EMERGENCY_LEVELS = {
  GREEN: 'green',    // Low priority
  YELLOW: 'yellow',  // Medium priority
  ORANGE: 'orange',  // High priority
  RED: 'red'         // Critical
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// Chat Message Types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  AUDIO: 'audio',
  VIDEO: 'video'
};

// Notification Types
export const NOTIFICATION_TYPES = {
  APPOINTMENT: 'appointment',
  MESSAGE: 'message',
  EMERGENCY: 'emergency',
  REMINDER: 'reminder',
  SYSTEM: 'system'
};

// Theme
export const THEME = {
  PRIMARY_COLOR: '#0ea5e9',
  SECONDARY_COLOR: '#64748b',
  SUCCESS_COLOR: '#10b981',
  WARNING_COLOR: '#f59e0b',
  ERROR_COLOR: '#ef4444',
  INFO_COLOR: '#3b82f6'
};

export default {
  API_BASE_URL,
  TOKEN_KEY,
  USER_KEY,
  REFRESH_TOKEN_KEY,
  ROUTES,
  USER_ROLES,
  APPOINTMENT_STATUS,
  APPOINTMENT_TYPES,
  APPOINTMENT_MODES,
  URGENCY_LEVELS,
  FILE_UPLOAD,
  PAGINATION,
  TIME_FORMATS,
  WORKING_HOURS,
  EMERGENCY_LEVELS,
  PAYMENT_STATUS,
  MESSAGE_TYPES,
  NOTIFICATION_TYPES,
  THEME
};