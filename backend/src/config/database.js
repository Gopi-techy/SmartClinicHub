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
      bufferCommands: false,
      autoIndex: config.env === 'development', // Build indexes in development
      family: 4, // Use IPv4, skip trying IPv6
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
    
    logger.info(`Database contains ${userCount} users`);
    
    // Database initialization completed - no demo data created
    logger.info('Database initialization completed - ready for production use');
    
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
