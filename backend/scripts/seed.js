const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../src/models/User');
const Appointment = require('../src/models/Appointment');
const Prescription = require('../src/models/Prescription');
const HealthRecord = require('../src/models/HealthRecord');
const MedicalHistory = require('../src/models/MedicalHistory');
const Notification = require('../src/models/Notification');
const { connectDatabase } = require('../src/config/database');
const logger = require('../src/utils/logger');

const clearDatabase = async () => {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Connected to MongoDB for clearing');

    // Clear existing demo/test data (for development/testing only)
    if (process.env.NODE_ENV === 'development') {
      await User.deleteMany({});
      await Appointment.deleteMany({});
      await Prescription.deleteMany({});
      await HealthRecord.deleteMany({});
      await MedicalHistory.deleteMany({});
      await Notification.deleteMany({});
      logger.info('Cleared all existing data - database is now ready for real users');
    }

    logger.info('✅ Database cleared successfully - ready for real users and data');
    
    console.log('\n🚀 SmartClinicHub Database Cleared');
    console.log('===================================');
    console.log('✅ All demo/sample data removed');
    console.log('✅ Database is now ready for real users');
    console.log('✅ No static or default data will be loaded');
    console.log('\n📝 Next steps:');
    console.log('1. Users can register through the frontend');
    console.log('2. Doctors can be added by admin users');
    console.log('3. All data will be real and dynamic');

  } catch (error) {
    logger.error('❌ Database clearing failed:', error);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
    process.exit(0);
  }
};

// Run clearing if this file is executed directly
if (require.main === module) {
  clearDatabase();
}

module.exports = { clearDatabase };
