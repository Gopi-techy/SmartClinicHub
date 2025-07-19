const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../src/models/User');
const { connectDatabase } = require('../src/config/database');
const logger = require('../src/utils/logger');

const seedData = {
  // Admin users
  adminUsers: [
    {
      email: 'admin@smartclinichub.com',
      password: 'Admin@123456',
      name: 'System Administrator',
      role: 'admin',
      isEmailVerified: true,
      profile: {
        phone: '+1234567890',
        address: {
          street: '123 Healthcare Ave',
          city: 'Medical City',
          state: 'MC',
          zipCode: '12345',
          country: 'USA'
        }
      }
    }
  ],

  // Doctor users
  doctors: [
    {
      email: 'dr.smith@smartclinichub.com',
      password: 'Doctor@123456',
      name: 'Dr. John Smith',
      role: 'doctor',
      isEmailVerified: true,
      profile: {
        phone: '+1234567891',
        specialization: 'Cardiology',
        licenseNumber: 'MD-001-2023',
        experience: 15,
        qualifications: ['MD', 'FACC'],
        languages: ['English', 'Spanish'],
        consultationFee: 200,
        availability: {
          monday: { start: '09:00', end: '17:00', available: true },
          tuesday: { start: '09:00', end: '17:00', available: true },
          wednesday: { start: '09:00', end: '17:00', available: true },
          thursday: { start: '09:00', end: '17:00', available: true },
          friday: { start: '09:00', end: '17:00', available: true },
          saturday: { start: '09:00', end: '13:00', available: true },
          sunday: { start: '10:00', end: '14:00', available: false }
        },
        address: {
          street: '456 Medical Center Dr',
          city: 'Healthcare City',
          state: 'HC',
          zipCode: '54321',
          country: 'USA'
        }
      }
    },
    {
      email: 'dr.johnson@smartclinichub.com',
      password: 'Doctor@123456',
      name: 'Dr. Sarah Johnson',
      role: 'doctor',
      isEmailVerified: true,
      profile: {
        phone: '+1234567892',
        specialization: 'Pediatrics',
        licenseNumber: 'MD-002-2023',
        experience: 12,
        qualifications: ['MD', 'FAAP'],
        languages: ['English'],
        consultationFee: 180,
        availability: {
          monday: { start: '08:00', end: '16:00', available: true },
          tuesday: { start: '08:00', end: '16:00', available: true },
          wednesday: { start: '08:00', end: '16:00', available: true },
          thursday: { start: '08:00', end: '16:00', available: true },
          friday: { start: '08:00', end: '16:00', available: true },
          saturday: { start: '08:00', end: '12:00', available: true },
          sunday: { start: '10:00', end: '14:00', available: false }
        },
        address: {
          street: '789 Children Hospital Rd',
          city: 'Pediatric City',
          state: 'PC',
          zipCode: '67890',
          country: 'USA'
        }
      }
    }
  ],

  // Pharmacy users
  pharmacies: [
    {
      email: 'pharmacy@healthmart.com',
      password: 'Pharmacy@123456',
      name: 'HealthMart Pharmacy',
      role: 'pharmacy',
      isEmailVerified: true,
      profile: {
        phone: '+1234567893',
        licenseNumber: 'PH-001-2023',
        operatingHours: {
          monday: { start: '08:00', end: '22:00', available: true },
          tuesday: { start: '08:00', end: '22:00', available: true },
          wednesday: { start: '08:00', end: '22:00', available: true },
          thursday: { start: '08:00', end: '22:00', available: true },
          friday: { start: '08:00', end: '22:00', available: true },
          saturday: { start: '08:00', end: '20:00', available: true },
          sunday: { start: '10:00', end: '18:00', available: true }
        },
        services: ['Prescription Filling', 'Medication Counseling', 'Immunizations'],
        address: {
          street: '321 Pharmacy Blvd',
          city: 'Medicine Town',
          state: 'MT',
          zipCode: '13579',
          country: 'USA'
        }
      }
    }
  ],

  // Patient users
  patients: [
    {
      email: 'patient1@example.com',
      password: 'Patient@123456',
      name: 'Alice Cooper',
      role: 'patient',
      isEmailVerified: true,
      profile: {
        phone: '+1234567894',
        dateOfBirth: new Date('1985-05-15'),
        gender: 'female',
        bloodGroup: 'A+',
        allergies: ['Penicillin'],
        chronicConditions: [],
        emergencyContact: {
          name: 'Bob Cooper',
          relationship: 'Spouse',
          phone: '+1234567895'
        },
        address: {
          street: '654 Patient St',
          city: 'Wellness City',
          state: 'WC',
          zipCode: '24680',
          country: 'USA'
        }
      }
    },
    {
      email: 'patient2@example.com',
      password: 'Patient@123456',
      name: 'Michael Brown',
      role: 'patient',
      isEmailVerified: true,
      profile: {
        phone: '+1234567896',
        dateOfBirth: new Date('1978-12-03'),
        gender: 'male',
        bloodGroup: 'O-',
        allergies: ['Shellfish', 'Latex'],
        chronicConditions: ['Diabetes Type 2'],
        emergencyContact: {
          name: 'Emma Brown',
          relationship: 'Spouse',
          phone: '+1234567897'
        },
        address: {
          street: '987 Health Ave',
          city: 'Care City',
          state: 'CC',
          zipCode: '97531',
          country: 'USA'
        }
      }
    }
  ]
};

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Connected to MongoDB for seeding');

    // Clear existing data (be careful in production!)
    if (process.env.NODE_ENV === 'development') {
      await User.deleteMany({});
      logger.info('Cleared existing users');
    }

    // Hash passwords and create users
    const allUsers = [
      ...seedData.adminUsers,
      ...seedData.doctors,
      ...seedData.pharmacies,
      ...seedData.patients
    ];

    for (const userData of allUsers) {
      try {
        // Hash password
        const saltRounds = 12;
        userData.password = await bcrypt.hash(userData.password, saltRounds);

        // Create user
        const user = new User(userData);
        await user.save();
        
        logger.info(`Created ${userData.role}: ${userData.email}`);
      } catch (error) {
        logger.error(`Failed to create user ${userData.email}:`, error.message);
      }
    }

    logger.info('✅ Database seeding completed successfully!');
    
    // Display seeded accounts
    console.log('\n🔐 Seeded User Accounts:');
    console.log('========================');
    
    console.log('\n👨‍💼 Admin Accounts:');
    seedData.adminUsers.forEach(user => {
      console.log(`Email: ${user.email} | Password: Admin@123456`);
    });
    
    console.log('\n👨‍⚕️ Doctor Accounts:');
    seedData.doctors.forEach(user => {
      console.log(`Email: ${user.email} | Password: Doctor@123456 | Specialization: ${user.profile.specialization}`);
    });
    
    console.log('\n💊 Pharmacy Accounts:');
    seedData.pharmacies.forEach(user => {
      console.log(`Email: ${user.email} | Password: Pharmacy@123456`);
    });
    
    console.log('\n👥 Patient Accounts:');
    seedData.patients.forEach(user => {
      console.log(`Email: ${user.email} | Password: Patient@123456`);
    });
    
    console.log('\n📝 Notes:');
    console.log('- All accounts are email verified and ready to use');
    console.log('- Change default passwords in production environment');
    console.log('- Admin account has full system access');
    console.log('- Doctor accounts have consultation scheduling enabled');
    console.log('- Pharmacy account can process prescriptions');
    console.log('- Patient accounts can book appointments and access emergency features');

  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
    process.exit(0);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, seedData };
