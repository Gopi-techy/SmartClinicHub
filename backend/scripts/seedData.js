const mongoose = require('mongoose');
require('dotenv').config();
const { connectDatabase } = require('../src/config/database');
const User = require('../src/models/User');
const logger = require('../src/utils/logger');

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Connected to MongoDB for seeding');

    // Clear existing data
    await User.deleteMany({});
    logger.info('Cleared existing user data');

    // Create Admin user
    const admin = new User({
      firstName: "Admin",
      lastName: "SmartClinic",
      email: "admin@smartclinichub.com",
      phone: "+919876543210",
      password: "admin123", // Will be hashed automatically
      role: "admin",
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
      verificationStatus: "approved",
      preferences: {
        language: "en",
        timezone: "Asia/Kolkata",
        notifications: { email: true, sms: true, push: true }
      }
    });
    await admin.save();

    // Create 30 Doctors
    const doctors = [
      // Cardiology - 3 doctors
      {
        firstName: "Dr. Rajesh", lastName: "Kumar", email: "rajesh.kumar@smartclinic.com", phone: "+919876543211",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "Cardiology", licenseNumber: "CAR001", experience: 15,
          qualifications: ["MBBS", "MD Cardiology", "DM Interventional Cardiology"],
          consultationFee: 1500, hospitalAffiliation: "Apollo Hospital",
          rating: 4.8, totalReviews: 156
        }
      },
      {
        firstName: "Dr. Priya", lastName: "Sharma", email: "priya.sharma@smartclinic.com", phone: "+919876543212",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "Cardiology", licenseNumber: "CAR002", experience: 12,
          qualifications: ["MBBS", "MD Cardiology"], consultationFee: 1200,
          hospitalAffiliation: "Fortis Hospital", rating: 4.6, totalReviews: 89
        }
      },
      {
        firstName: "Dr. Amit", lastName: "Patel", email: "amit.patel@smartclinic.com", phone: "+919876543213",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "Cardiology", licenseNumber: "CAR003", experience: 8,
          qualifications: ["MBBS", "MD Cardiology"], consultationFee: 1000,
          hospitalAffiliation: "Max Hospital", rating: 4.4, totalReviews: 67
        }
      },

      // Neurology - 3 doctors
      {
        firstName: "Dr. Sunita", lastName: "Reddy", email: "sunita.reddy@smartclinic.com", phone: "+919876543214",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "Neurology", licenseNumber: "NEU001", experience: 18,
          qualifications: ["MBBS", "MD Neurology", "DM Neurology"],
          consultationFee: 1800, hospitalAffiliation: "AIIMS", rating: 4.9, totalReviews: 234
        }
      },
      {
        firstName: "Dr. Vikram", lastName: "Singh", email: "vikram.singh@smartclinic.com", phone: "+919876543215",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "Neurology", licenseNumber: "NEU002", experience: 14,
          qualifications: ["MBBS", "MD Neurology"], consultationFee: 1400,
          hospitalAffiliation: "Medanta Hospital", rating: 4.7, totalReviews: 178
        }
      },
      {
        firstName: "Dr. Meera", lastName: "Gupta", email: "meera.gupta@smartclinic.com", phone: "+919876543216",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "Neurology", licenseNumber: "NEU003", experience: 10,
          qualifications: ["MBBS", "MD Neurology"], consultationFee: 1200,
          hospitalAffiliation: "BLK Hospital", rating: 4.5, totalReviews: 123
        }
      },

      // Orthopedics - 3 doctors
      {
        firstName: "Dr. Ravi", lastName: "Mehta", email: "ravi.mehta@smartclinic.com", phone: "+919876543217",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "Orthopedics", licenseNumber: "ORT001", experience: 16,
          qualifications: ["MBBS", "MS Orthopedics", "Fellowship in Joint Replacement"],
          consultationFee: 1600, hospitalAffiliation: "Jaypee Hospital", rating: 4.8, totalReviews: 201
        }
      },
      {
        firstName: "Dr. Kavita", lastName: "Joshi", email: "kavita.joshi@smartclinic.com", phone: "+919876543218",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "Orthopedics", licenseNumber: "ORT002", experience: 11,
          qualifications: ["MBBS", "MS Orthopedics"], consultationFee: 1300,
          hospitalAffiliation: "Artemis Hospital", rating: 4.6, totalReviews: 145
        }
      },
      {
        firstName: "Dr. Anil", lastName: "Verma", email: "anil.verma@smartclinic.com", phone: "+919876543219",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "Orthopedics", licenseNumber: "ORT003", experience: 9,
          qualifications: ["MBBS", "MS Orthopedics"], consultationFee: 1100,
          hospitalAffiliation: "Manipal Hospital", rating: 4.4, totalReviews: 98
        }
      },

      // Dermatology - 3 doctors
      {
        firstName: "Dr. Neha", lastName: "Agarwal", email: "neha.agarwal@smartclinic.com", phone: "+919876543220",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "Dermatology", licenseNumber: "DER001", experience: 13,
          qualifications: ["MBBS", "MD Dermatology", "Fellowship in Cosmetic Dermatology"],
          consultationFee: 1400, hospitalAffiliation: "Skin & Hair Clinic", rating: 4.7, totalReviews: 189
        }
      },
      {
        firstName: "Dr. Rohit", lastName: "Bansal", email: "rohit.bansal@smartclinic.com", phone: "+919876543221",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "Dermatology", licenseNumber: "DER002", experience: 10,
          qualifications: ["MBBS", "MD Dermatology"], consultationFee: 1200,
          hospitalAffiliation: "Kaya Skin Clinic", rating: 4.5, totalReviews: 134
        }
      },
      {
        firstName: "Dr. Swati", lastName: "Kapoor", email: "swati.kapoor@smartclinic.com", phone: "+919876543222",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "Dermatology", licenseNumber: "DER003", experience: 7,
          qualifications: ["MBBS", "MD Dermatology"], consultationFee: 1000,
          hospitalAffiliation: "Dermalife Clinic", rating: 4.3, totalReviews: 87
        }
      },

      // Gynecology - 3 doctors
      {
        firstName: "Dr. Pooja", lastName: "Malhotra", email: "pooja.malhotra@smartclinic.com", phone: "+919876543223",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "Gynecology", licenseNumber: "GYN001", experience: 17,
          qualifications: ["MBBS", "MS Gynecology", "Fellowship in Infertility"],
          consultationFee: 1700, hospitalAffiliation: "Cloudnine Hospital", rating: 4.9, totalReviews: 267
        }
      },
      {
        firstName: "Dr. Sita", lastName: "Rao", email: "sita.rao@smartclinic.com", phone: "+919876543224",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "Gynecology", licenseNumber: "GYN002", experience: 14,
          qualifications: ["MBBS", "MS Gynecology"], consultationFee: 1500,
          hospitalAffiliation: "Motherhood Hospital", rating: 4.7, totalReviews: 198
        }
      },
      {
        firstName: "Dr. Anjali", lastName: "Nair", email: "anjali.nair@smartclinic.com", phone: "+919876543225",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "Gynecology", licenseNumber: "GYN003", experience: 9,
          qualifications: ["MBBS", "MS Gynecology"], consultationFee: 1300,
          hospitalAffiliation: "Rainbow Hospital", rating: 4.5, totalReviews: 156
        }
      },

      // Pediatrics - 3 doctors
      {
        firstName: "Dr. Deepak", lastName: "Chopra", email: "deepak.chopra@smartclinic.com", phone: "+919876543226",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "Pediatrics", licenseNumber: "PED001", experience: 19,
          qualifications: ["MBBS", "MD Pediatrics", "Fellowship in Pediatric Cardiology"],
          consultationFee: 1600, hospitalAffiliation: "Rainbow Children's Hospital", rating: 4.8, totalReviews: 312
        }
      },
      {
        firstName: "Dr. Sneha", lastName: "Iyer", email: "sneha.iyer@smartclinic.com", phone: "+919876543227",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "Pediatrics", licenseNumber: "PED002", experience: 12,
          qualifications: ["MBBS", "MD Pediatrics"], consultationFee: 1300,
          hospitalAffiliation: "Apollo Children's Hospital", rating: 4.6, totalReviews: 234
        }
      },
      {
        firstName: "Dr. Rahul", lastName: "Bhatt", email: "rahul.bhatt@smartclinic.com", phone: "+919876543228",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "Pediatrics", licenseNumber: "PED003", experience: 8,
          qualifications: ["MBBS", "MD Pediatrics"], consultationFee: 1100,
          hospitalAffiliation: "Fortis La Femme", rating: 4.4, totalReviews: 167
        }
      },

      // Psychiatry - 3 doctors
      {
        firstName: "Dr. Arjun", lastName: "Khanna", email: "arjun.khanna@smartclinic.com", phone: "+919876543229",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "Psychiatry", licenseNumber: "PSY001", experience: 15,
          qualifications: ["MBBS", "MD Psychiatry", "Fellowship in Child Psychiatry"],
          consultationFee: 1500, hospitalAffiliation: "Mind Wellness Center", rating: 4.7, totalReviews: 189
        }
      },
      {
        firstName: "Dr. Ritu", lastName: "Saxena", email: "ritu.saxena@smartclinic.com", phone: "+919876543230",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "Psychiatry", licenseNumber: "PSY002", experience: 11,
          qualifications: ["MBBS", "MD Psychiatry"], consultationFee: 1200,
          hospitalAffiliation: "Mental Health Institute", rating: 4.5, totalReviews: 143
        }
      },
      {
        firstName: "Dr. Manish", lastName: "Tiwari", email: "manish.tiwari@smartclinic.com", phone: "+919876543231",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "Psychiatry", licenseNumber: "PSY003", experience: 9,
          qualifications: ["MBBS", "MD Psychiatry"], consultationFee: 1000,
          hospitalAffiliation: "Shree Psychiatric Center", rating: 4.3, totalReviews: 98
        }
      },

      // Ophthalmology - 3 doctors
      {
        firstName: "Dr. Nisha", lastName: "Bhatia", email: "nisha.bhatia@smartclinic.com", phone: "+919876543232",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "Ophthalmology", licenseNumber: "OPH001", experience: 16,
          qualifications: ["MBBS", "MS Ophthalmology", "Fellowship in Retinal Surgery"],
          consultationFee: 1400, hospitalAffiliation: "Centre for Sight", rating: 4.8, totalReviews: 276
        }
      },
      {
        firstName: "Dr. Kiran", lastName: "Desai", email: "kiran.desai@smartclinic.com", phone: "+919876543233",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "Ophthalmology", licenseNumber: "OPH002", experience: 13,
          qualifications: ["MBBS", "MS Ophthalmology"], consultationFee: 1200,
          hospitalAffiliation: "Sharp Sight Center", rating: 4.6, totalReviews: 198
        }
      },
      {
        firstName: "Dr. Sameer", lastName: "Jain", email: "sameer.jain@smartclinic.com", phone: "+919876543234",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "Ophthalmology", licenseNumber: "OPH003", experience: 10,
          qualifications: ["MBBS", "MS Ophthalmology"], consultationFee: 1000,
          hospitalAffiliation: "Eye7 Chaudhary Hospital", rating: 4.4, totalReviews: 145
        }
      },

      // ENT - 3 doctors
      {
        firstName: "Dr. Varun", lastName: "Mittal", email: "varun.mittal@smartclinic.com", phone: "+919876543235",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "ENT", licenseNumber: "ENT001", experience: 14,
          qualifications: ["MBBS", "MS ENT", "Fellowship in Head & Neck Surgery"],
          consultationFee: 1300, hospitalAffiliation: "BLK ENT Center", rating: 4.7, totalReviews: 203
        }
      },
      {
        firstName: "Dr. Shilpa", lastName: "Awasthi", email: "shilpa.awasthi@smartclinic.com", phone: "+919876543236",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "ENT", licenseNumber: "ENT002", experience: 11,
          qualifications: ["MBBS", "MS ENT"], consultationFee: 1100,
          hospitalAffiliation: "Fortis ENT Clinic", rating: 4.5, totalReviews: 167
        }
      },
      {
        firstName: "Dr. Ashish", lastName: "Pandey", email: "ashish.pandey@smartclinic.com", phone: "+919876543237",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "ENT", licenseNumber: "ENT003", experience: 8,
          qualifications: ["MBBS", "MS ENT"], consultationFee: 900,
          hospitalAffiliation: "Max ENT Department", rating: 4.3, totalReviews: 134
        }
      },

      // General Medicine - 3 doctors  
      {
        firstName: "Dr. Sanjay", lastName: "Gupta", email: "sanjay.gupta@smartclinic.com", phone: "+919876543238",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "General Medicine", licenseNumber: "GM001", experience: 20,
          qualifications: ["MBBS", "MD Internal Medicine"], consultationFee: 800,
          hospitalAffiliation: "City General Hospital", rating: 4.6, totalReviews: 345
        }
      },
      {
        firstName: "Dr. Geeta", lastName: "Devi", email: "geeta.devi@smartclinic.com", phone: "+919876543239",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "General Medicine", licenseNumber: "GM002", experience: 15,
          qualifications: ["MBBS", "MD Internal Medicine"], consultationFee: 700,
          hospitalAffiliation: "Lok Nayak Hospital", rating: 4.4, totalReviews: 287
        }
      },
      {
        firstName: "Dr. Manoj", lastName: "Kumar", email: "manoj.kumar@smartclinic.com", phone: "+919876543240",
        password: "doctor123", role: "doctor", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        professionalInfo: {
          specialization: "General Medicine", licenseNumber: "GM003", experience: 12,
          qualifications: ["MBBS", "MD Internal Medicine"], consultationFee: 600,
          hospitalAffiliation: "Safdarjung Hospital", rating: 4.2, totalReviews: 198
        }
      }
    ];

    // Insert all doctors
    await User.insertMany(doctors);

    // Create 10 Patients
    const patients = [
      {
        firstName: "Rahul", lastName: "Sharma", email: "rahul.sharma@gmail.com", phone: "+919876543241",
        password: "patient123", role: "patient", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        dateOfBirth: new Date("1985-03-15"), gender: "male",
        address: { street: "123 MG Road", city: "Mumbai", state: "Maharashtra", zipCode: "400001", country: "India" },
        medicalInfo: { bloodGroup: "B+", allergies: ["Dust", "Pollen"], height: 175, weight: 70, bmi: 22.86 },
        emergencyContact: { name: "Priya Sharma", phone: "+919876543301", relationship: "Wife" }
      },
      {
        firstName: "Anita", lastName: "Patel", email: "anita.patel@gmail.com", phone: "+919876543242",
        password: "patient123", role: "patient", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        dateOfBirth: new Date("1990-07-22"), gender: "female",
        address: { street: "456 Ring Road", city: "Delhi", state: "Delhi", zipCode: "110001", country: "India" },
        medicalInfo: { bloodGroup: "A+", allergies: ["Penicillin"], height: 162, weight: 55, bmi: 20.94 },
        emergencyContact: { name: "Raj Patel", phone: "+919876543302", relationship: "Husband" }
      },
      {
        firstName: "Vikram", lastName: "Singh", email: "vikram.singh123@gmail.com", phone: "+919876543243",
        password: "patient123", role: "patient", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        dateOfBirth: new Date("1978-12-10"), gender: "male",
        address: { street: "789 Park Street", city: "Kolkata", state: "West Bengal", zipCode: "700001", country: "India" },
        medicalInfo: { bloodGroup: "O+", allergies: [], medicalConditions: ["Diabetes"], height: 180, weight: 82, bmi: 25.31 },
        emergencyContact: { name: "Sunita Singh", phone: "+919876543303", relationship: "Sister" }
      },
      {
        firstName: "Meera", lastName: "Reddy", email: "meera.reddy@yahoo.com", phone: "+919876543244",
        password: "patient123", role: "patient", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        dateOfBirth: new Date("1995-05-18"), gender: "female",
        address: { street: "321 Tech City", city: "Bangalore", state: "Karnataka", zipCode: "560001", country: "India" },
        medicalInfo: { bloodGroup: "AB+", allergies: ["Shellfish"], height: 165, weight: 58, bmi: 21.30 },
        emergencyContact: { name: "Krishna Reddy", phone: "+919876543304", relationship: "Father" }
      },
      {
        firstName: "Arjun", lastName: "Nair", email: "arjun.nair@hotmail.com", phone: "+919876543245",
        password: "patient123", role: "patient", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        dateOfBirth: new Date("1982-09-25"), gender: "male",
        address: { street: "654 Beach Road", city: "Chennai", state: "Tamil Nadu", zipCode: "600001", country: "India" },
        medicalInfo: { bloodGroup: "A-", allergies: ["Nuts"], medicalConditions: ["Hypertension"], height: 172, weight: 75, bmi: 25.35 },
        emergencyContact: { name: "Lakshmi Nair", phone: "+919876543305", relationship: "Mother" }
      },
      {
        firstName: "Kavita", lastName: "Joshi", email: "kavita.joshi456@gmail.com", phone: "+919876543246",
        password: "patient123", role: "patient", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        dateOfBirth: new Date("1988-11-03"), gender: "female",
        address: { street: "987 Civil Lines", city: "Pune", state: "Maharashtra", zipCode: "411001", country: "India" },
        medicalInfo: { bloodGroup: "B-", allergies: ["Latex"], height: 158, weight: 52, bmi: 20.83 },
        emergencyContact: { name: "Amit Joshi", phone: "+919876543306", relationship: "Brother" }
      },
      {
        firstName: "Deepak", lastName: "Agarwal", email: "deepak.agarwal@gmail.com", phone: "+919876543247",
        password: "patient123", role: "patient", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        dateOfBirth: new Date("1992-01-14"), gender: "male",
        address: { street: "147 Sector 14", city: "Gurgaon", state: "Haryana", zipCode: "122001", country: "India" },
        medicalInfo: { bloodGroup: "O-", allergies: ["Egg"], height: 178, weight: 73, bmi: 23.05 },
        emergencyContact: { name: "Ritu Agarwal", phone: "+919876543307", relationship: "Wife" }
      },
      {
        firstName: "Sneha", lastName: "Gupta", email: "sneha.gupta@outlook.com", phone: "+919876543248",
        password: "patient123", role: "patient", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        dateOfBirth: new Date("1987-08-30"), gender: "female",
        address: { street: "258 Lajpat Nagar", city: "Jaipur", state: "Rajasthan", zipCode: "302001", country: "India" },
        medicalInfo: { bloodGroup: "AB-", allergies: [], medicalConditions: ["Asthma"], height: 160, weight: 54, bmi: 21.09 },
        emergencyContact: { name: "Mohan Gupta", phone: "+919876543308", relationship: "Father" }
      },
      {
        firstName: "Rohit", lastName: "Malhotra", email: "rohit.malhotra@gmail.com", phone: "+919876543249",
        password: "patient123", role: "patient", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        dateOfBirth: new Date("1983-04-12"), gender: "male",
        address: { street: "369 Model Town", city: "Ludhiana", state: "Punjab", zipCode: "141001", country: "India" },
        medicalInfo: { bloodGroup: "A+", allergies: ["Sulfa drugs"], height: 174, weight: 68, bmi: 22.49 },
        emergencyContact: { name: "Pooja Malhotra", phone: "+919876543309", relationship: "Wife" }
      },
      {
        firstName: "Priya", lastName: "Kapoor", email: "priya.kapoor789@gmail.com", phone: "+919876543250",
        password: "patient123", role: "patient", isEmailVerified: true, isActive: true, verificationStatus: "approved",
        dateOfBirth: new Date("1991-06-28"), gender: "female",
        address: { street: "741 Nehru Place", city: "Ahmedabad", state: "Gujarat", zipCode: "380001", country: "India" },
        medicalInfo: { bloodGroup: "B+", allergies: ["Iodine"], height: 163, weight: 56, bmi: 21.08 },
        emergencyContact: { name: "Rajesh Kapoor", phone: "+919876543310", relationship: "Husband" }
      }
    ];

    // Insert all patients
    await User.insertMany(patients);

    // Summary
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const totalPatients = await User.countDocuments({ role: 'patient' });

    console.log('\n🎉 Database seeded successfully!');
    console.log('=====================================');
    console.log(`✅ Total users created: ${totalUsers}`);
    console.log(`👨‍💼 Admins: ${totalAdmins}`);
    console.log(`👩‍⚕️ Doctors: ${totalDoctors}`);
    console.log(`🏥 Patients: ${totalPatients}`);
    console.log('\n🔑 Login Credentials:');
    console.log('Admin: admin@smartclinichub.com / admin123');
    console.log('Doctors: doctor123 (e.g., rajesh.kumar@smartclinic.com)');
    console.log('Patients: patient123 (e.g., rahul.sharma@gmail.com)');

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

module.exports = { seedDatabase };