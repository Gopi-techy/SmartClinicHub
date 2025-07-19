const mongoose = require('mongoose');
require('dotenv').config();

const { connectDatabase } = require('../src/config/database');
const logger = require('../src/utils/logger');

// Import all models to ensure they're registered
const User = require('../src/models/User');
const Appointment = require('../src/models/Appointment');
const EmergencyAccess = require('../src/models/EmergencyAccess');
const Prescription = require('../src/models/Prescription');

const migrations = [
  {
    version: '1.0.0',
    description: 'Initial database setup and indexes',
    up: async () => {
      // Create indexes for User model
      await User.createIndexes();
      logger.info('✅ User indexes created');

      // Create indexes for Appointment model
      await Appointment.createIndexes();
      logger.info('✅ Appointment indexes created');

      // Create indexes for EmergencyAccess model
      await EmergencyAccess.createIndexes();
      logger.info('✅ EmergencyAccess indexes created');

      // Create indexes for Prescription model
      await Prescription.createIndexes();
      logger.info('✅ Prescription indexes created');

      // Add any custom indexes
      await User.collection.createIndex({ 'profile.licenseNumber': 1 }, { sparse: true });
      await User.collection.createIndex({ 'lastActive': 1 });
      await User.collection.createIndex({ 'createdAt': 1 });
      
      await Appointment.collection.createIndex({ 'scheduledDate': 1, 'status': 1 });
      await Appointment.collection.createIndex({ 'patient': 1, 'scheduledDate': -1 });
      await Appointment.collection.createIndex({ 'doctor': 1, 'scheduledDate': -1 });
      
      await EmergencyAccess.collection.createIndex({ 'expiresAt': 1 }, { expireAfterSeconds: 0 });
      await EmergencyAccess.collection.createIndex({ 'qrCode': 1 });
      
      await Prescription.collection.createIndex({ 'patient': 1, 'createdAt': -1 });
      await Prescription.collection.createIndex({ 'qrCode': 1 });
      await Prescription.collection.createIndex({ 'status': 1, 'createdAt': -1 });

      logger.info('✅ Custom indexes created');
    },
    down: async () => {
      // Drop custom indexes if needed
      logger.info('⚠️ Migration 1.0.0 rollback not implemented');
    }
  },
  {
    version: '1.1.0',
    description: 'Add audit logging collections',
    up: async () => {
      // Create audit log collection with TTL
      const db = mongoose.connection.db;
      
      try {
        await db.createCollection('auditlogs', {
          capped: false,
          timeseries: {
            timeField: 'timestamp',
            metaField: 'metadata',
            granularity: 'minutes'
          }
        });
        logger.info('✅ Audit logs collection created');
      } catch (error) {
        if (error.code !== 48) { // Collection already exists
          throw error;
        }
        logger.info('ℹ️ Audit logs collection already exists');
      }

      // Create indexes for audit logs
      try {
        await db.collection('auditlogs').createIndex({ 'timestamp': 1 });
        await db.collection('auditlogs').createIndex({ 'userId': 1, 'timestamp': -1 });
        await db.collection('auditlogs').createIndex({ 'action': 1, 'timestamp': -1 });
        await db.collection('auditlogs').createIndex({ 'ipAddress': 1 });
        logger.info('✅ Audit logs indexes created');
      } catch (error) {
        logger.warn('⚠️ Some audit log indexes may already exist');
      }

      // Set TTL for audit logs (90 days)
      try {
        await db.collection('auditlogs').createIndex(
          { 'timestamp': 1 }, 
          { expireAfterSeconds: 90 * 24 * 60 * 60 }
        );
        logger.info('✅ Audit logs TTL set to 90 days');
      } catch (error) {
        logger.warn('⚠️ Audit logs TTL may already be set');
      }
    },
    down: async () => {
      const db = mongoose.connection.db;
      await db.collection('auditlogs').drop();
      logger.info('✅ Audit logs collection dropped');
    }
  },
  {
    version: '1.2.0',
    description: 'Add notification templates and settings',
    up: async () => {
      const db = mongoose.connection.db;
      
      // Create notification templates collection
      try {
        await db.createCollection('notificationtemplates');
        logger.info('✅ Notification templates collection created');
      } catch (error) {
        if (error.code !== 48) {
          throw error;
        }
        logger.info('ℹ️ Notification templates collection already exists');
      }

      // Insert default notification templates
      const templates = [
        {
          _id: 'appointment_reminder',
          name: 'Appointment Reminder',
          type: 'email',
          subject: 'Upcoming Appointment Reminder',
          body: 'Dear {{patientName}}, you have an appointment with {{doctorName}} on {{appointmentDate}} at {{appointmentTime}}.',
          variables: ['patientName', 'doctorName', 'appointmentDate', 'appointmentTime'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: 'emergency_alert',
          name: 'Emergency Alert',
          type: 'sms',
          subject: null,
          body: 'EMERGENCY: {{patientName}} has activated emergency access. Location: {{location}}. Contact: {{phone}}',
          variables: ['patientName', 'location', 'phone'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: 'prescription_ready',
          name: 'Prescription Ready',
          type: 'push',
          subject: 'Prescription Ready for Pickup',
          body: 'Your prescription for {{medicationName}} is ready for pickup at {{pharmacyName}}.',
          variables: ['medicationName', 'pharmacyName'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      for (const template of templates) {
        await db.collection('notificationtemplates').replaceOne(
          { _id: template._id },
          template,
          { upsert: true }
        );
      }
      logger.info('✅ Default notification templates inserted');

      // Create indexes for notification templates
      await db.collection('notificationtemplates').createIndex({ 'type': 1, 'isActive': 1 });
      logger.info('✅ Notification templates indexes created');
    },
    down: async () => {
      const db = mongoose.connection.db;
      await db.collection('notificationtemplates').drop();
      logger.info('✅ Notification templates collection dropped');
    }
  }
];

const getMigrationStatus = async () => {
  const db = mongoose.connection.db;
  let migrationsCollection;
  
  try {
    migrationsCollection = db.collection('migrations');
    return await migrationsCollection.find({}).toArray();
  } catch (error) {
    // Collection doesn't exist, create it
    await db.createCollection('migrations');
    return [];
  }
};

const recordMigration = async (version, description) => {
  const db = mongoose.connection.db;
  const migrationsCollection = db.collection('migrations');
  
  await migrationsCollection.insertOne({
    version,
    description,
    executedAt: new Date()
  });
};

const removeMigrationRecord = async (version) => {
  const db = mongoose.connection.db;
  const migrationsCollection = db.collection('migrations');
  
  await migrationsCollection.deleteOne({ version });
};

const runMigrations = async () => {
  try {
    await connectDatabase();
    logger.info('Connected to MongoDB for migrations');

    const executedMigrations = await getMigrationStatus();
    const executedVersions = executedMigrations.map(m => m.version);

    logger.info('📋 Migration Status:');
    logger.info(`Total migrations: ${migrations.length}`);
    logger.info(`Executed migrations: ${executedMigrations.length}`);

    let migrationsRun = 0;

    for (const migration of migrations) {
      if (!executedVersions.includes(migration.version)) {
        logger.info(`🔄 Running migration ${migration.version}: ${migration.description}`);
        
        try {
          await migration.up();
          await recordMigration(migration.version, migration.description);
          migrationsRun++;
          
          logger.info(`✅ Migration ${migration.version} completed successfully`);
        } catch (error) {
          logger.error(`❌ Migration ${migration.version} failed:`, error);
          throw error;
        }
      } else {
        logger.info(`⏭️ Migration ${migration.version} already executed, skipping`);
      }
    }

    if (migrationsRun === 0) {
      logger.info('🎉 All migrations are up to date!');
    } else {
      logger.info(`🎉 Successfully executed ${migrationsRun} migration(s)!`);
    }

    // Display final status
    const finalStatus = await getMigrationStatus();
    logger.info('\n📊 Final Migration Status:');
    finalStatus.forEach(migration => {
      logger.info(`✅ ${migration.version} - ${migration.description} (${migration.executedAt.toISOString()})`);
    });

  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
};

const rollbackMigration = async (version) => {
  try {
    await connectDatabase();
    logger.info(`🔄 Rolling back migration ${version}`);

    const migration = migrations.find(m => m.version === version);
    if (!migration) {
      throw new Error(`Migration ${version} not found`);
    }

    const executedMigrations = await getMigrationStatus();
    const isExecuted = executedMigrations.some(m => m.version === version);

    if (!isExecuted) {
      logger.warn(`⚠️ Migration ${version} was not executed, nothing to rollback`);
      return;
    }

    await migration.down();
    await removeMigrationRecord(version);
    
    logger.info(`✅ Migration ${version} rolled back successfully`);

  } catch (error) {
    logger.error(`❌ Rollback failed:`, error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
};

// Command line interface
const command = process.argv[2];
const version = process.argv[3];

if (require.main === module) {
  switch (command) {
    case 'up':
      runMigrations();
      break;
    case 'down':
      if (!version) {
        logger.error('❌ Please specify a version to rollback: npm run migrate down <version>');
        process.exit(1);
      }
      rollbackMigration(version);
      break;
    case 'status':
      (async () => {
        await connectDatabase();
        const status = await getMigrationStatus();
        console.log('\n📊 Migration Status:');
        if (status.length === 0) {
          console.log('No migrations executed yet');
        } else {
          status.forEach(migration => {
            console.log(`✅ ${migration.version} - ${migration.description} (${migration.executedAt.toISOString()})`);
          });
        }
        await mongoose.connection.close();
      })();
      break;
    default:
      console.log('Usage:');
      console.log('  npm run migrate up     - Run all pending migrations');
      console.log('  npm run migrate down <version> - Rollback a specific migration');
      console.log('  npm run migrate status - Show migration status');
      break;
  }
}

module.exports = {
  runMigrations,
  rollbackMigration,
  getMigrationStatus,
  migrations
};
