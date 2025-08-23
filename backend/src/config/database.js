const mongoose = require('mongoose');
const logger = require('../utils/logger');
const config = require('./config');

/**
 * Connect to MongoDB
 */
const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(config.database.uri, {
      ...config.database.options,
      // Additional options for better connection handling
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
      bufferCommands: false,
      autoIndex: config.env === 'development', // Build indexes in development
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB
 */
const disconnectDatabase = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
  }
};

/**
 * Check database health
 */
const checkDatabaseHealth = async () => {
  try {
    const status = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    return {
      status: states[status] || 'unknown',
      readyState: status,
      isConnected: status === 1
    };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return {
      status: 'error',
      readyState: -1,
      isConnected: false,
      error: error.message
    };
  }
};

/**
 * Initialize database with default data
 */
const initializeDatabase = async () => {
  try {
    // Check if we need to seed the database
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    
    if (userCount === 0) {
      logger.info('Database is empty, initializing with default data...');
      
      // Create default admin user
      const adminUser = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@smartclinichub.com',
        password: 'admin123',
        role: 'admin',
        phone: '+1-555-0000',
        isEmailVerified: true,
        isActive: true
      });
      
      await adminUser.save();
      logger.info('Default admin user created');
      
      // Create default doctor
      const doctorUser = new User({
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'doctor@smartclinichub.com',
        password: 'doctor123',
        role: 'doctor',
        phone: '+1-555-0001',
        isEmailVerified: true,
        isActive: true,
        professionalInfo: {
          specialization: 'Cardiology',
          license: 'MD123456',
          yearsOfExperience: 8
        }
      });
      
      await doctorUser.save();
      logger.info('Default doctor user created');
      
      // Create default patient
      const patientUser = new User({
        firstName: 'John',
        lastName: 'Doe',
        email: 'patient@smartclinichub.com',
        password: 'patient123',
        role: 'patient',
        phone: '+1-555-0002',
        isEmailVerified: true,
        isActive: true,
        emergencyContact: {
          name: 'Jane Doe',
          relationship: 'Spouse',
          phone: '+1-555-0003'
        }
      });
      
      await patientUser.save();
      logger.info('Default patient user created');
      
      logger.info('Database initialization completed');
    } else {
      logger.info(`Database already contains ${userCount} users, skipping initialization`);
    }
  } catch (error) {
    logger.error('Database initialization failed:', error);
  }
};

module.exports = {
  connectDatabase,
  disconnectDatabase,
  checkDatabaseHealth,
  initializeDatabase
};
