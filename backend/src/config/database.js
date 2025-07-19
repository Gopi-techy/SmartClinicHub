const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartclinic';
    
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    };

    await mongoose.connect(mongoUri, options);
    
    logger.info('MongoDB Atlas connected successfully');

    // Connection event listeners
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
    });

    // If the Node process ends, close the Mongoose connection
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('Mongoose connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

module.exports = { connectDatabase };
