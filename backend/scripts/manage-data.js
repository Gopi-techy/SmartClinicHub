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

const clearAllData = async () => {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Connected to MongoDB for data clearing');

    console.log('\n⚠️  WARNING: This will delete ALL data in the database!');
    console.log('This operation cannot be undone.');
    console.log('Only use this in development environments.');
    
    // Clear all collections
    const collections = [
      { model: User, name: 'Users' },
      { model: Appointment, name: 'Appointments' },
      { model: Prescription, name: 'Prescriptions' },
      { model: HealthRecord, name: 'Health Records' },
      { model: MedicalHistory, name: 'Medical Histories' },
      { model: Notification, name: 'Notifications' }
    ];

    for (const collection of collections) {
      const count = await collection.model.countDocuments();
      if (count > 0) {
        await collection.model.deleteMany({});
        console.log(`✅ Deleted ${count} ${collection.name}`);
      } else {
        console.log(`ℹ️  No ${collection.name} to delete`);
      }
    }

    console.log('\n🎉 Database cleared successfully!');
    console.log('📝 The application is now ready for real users and data');
    console.log('🚀 All data will be dynamic and user-generated');

  } catch (error) {
    logger.error('❌ Database clearing failed:', error);
    console.error('Error details:', error.message);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
    process.exit(0);
  }
};

const showDataSummary = async () => {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Connected to MongoDB for data summary');

    console.log('\n📊 Current Database Status');
    console.log('==========================');
    
    const users = await User.countDocuments();
    const appointments = await Appointment.countDocuments();
    const prescriptions = await Prescription.countDocuments();
    const healthRecords = await HealthRecord.countDocuments();
    const medicalHistories = await MedicalHistory.countDocuments();
    const notifications = await Notification.countDocuments();

    console.log(`👥 Users: ${users}`);
    console.log(`📅 Appointments: ${appointments}`);
    console.log(`💊 Prescriptions: ${prescriptions}`);
    console.log(`📋 Health Records: ${healthRecords}`);
    console.log(`📜 Medical Histories: ${medicalHistories}`);
    console.log(`🔔 Notifications: ${notifications}`);

    const total = users + appointments + prescriptions + healthRecords + medicalHistories + notifications;
    console.log(`\n📈 Total Documents: ${total}`);
    
    if (total === 0) {
      console.log('\n✅ Database is clean and ready for production!');
      console.log('🎯 All data will be real and user-generated');
    } else {
      console.log('\n💡 Run "npm run clear-data" to remove all existing data');
    }

  } catch (error) {
    logger.error('❌ Database summary failed:', error);
    console.error('Error details:', error.message);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
    process.exit(0);
  }
};

// Handle command line arguments
const command = process.argv[2];

if (command === 'clear') {
  clearAllData();
} else if (command === 'summary' || !command) {
  showDataSummary();
} else {
  console.log('\n📖 Usage:');
  console.log('  node manage-data.js          - Show database summary');
  console.log('  node manage-data.js summary  - Show database summary');
  console.log('  node manage-data.js clear    - Clear all data (WARNING: Irreversible!)');
  process.exit(1);
}

module.exports = { clearAllData, showDataSummary };
