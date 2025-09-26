// Profile completion utility functions

// Check if doctor has minimum requirements for verification
export const isDoctorVerificationReady = (user) => {
  if (!user || user.role !== 'doctor') return false;
  
  const hasLicenseNumber = user.professionalInfo?.licenseNumber?.trim();
  const hasSpecialization = user.professionalInfo?.specialization?.trim();
  
  return hasLicenseNumber && hasSpecialization;
};

export const checkProfileCompletion = (user) => {
  if (!user) return { isComplete: false, completionPercentage: 0, missingFields: [] };

  const missingFields = [];
  let completedFields = 0;
  let totalFields = 0;

  // Common fields for all users
  const commonRequiredFields = [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone Number' }
  ];

  // Role-specific required fields
  const roleSpecificFields = {
    patient: [
      { key: 'dateOfBirth', label: 'Date of Birth' },
      { key: 'gender', label: 'Gender' },
      { key: 'address.street', label: 'Street Address' },
      { key: 'address.city', label: 'City' },
      { key: 'address.state', label: 'State' },
      { key: 'address.zipCode', label: 'ZIP Code' },
      { key: 'emergencyContact.name', label: 'Emergency Contact Name' },
      { key: 'emergencyContact.phone', label: 'Emergency Contact Phone' },
      { key: 'emergencyContact.relationship', label: 'Emergency Contact Relationship' },
      { key: 'medicalInfo.bloodGroup', label: 'Blood Group' }
    ],
    doctor: [
      // Verification essential fields (higher priority)
      { key: 'professionalInfo.specialization', label: 'Specialization', priority: 'essential' },
      { key: 'professionalInfo.licenseNumber', label: 'License Number', priority: 'essential' },
      // Additional professional fields (nice to have)
      { key: 'professionalInfo.experience', label: 'Years of Experience', priority: 'additional' },
      { key: 'professionalInfo.qualifications', label: 'Qualifications', priority: 'additional' },
      { key: 'professionalInfo.consultationFee', label: 'Consultation Fee', priority: 'additional' },
      { key: 'address.street', label: 'Street Address', priority: 'additional' },
      { key: 'address.city', label: 'City', priority: 'additional' },
      { key: 'address.state', label: 'State', priority: 'additional' },
      { key: 'address.zipCode', label: 'ZIP Code', priority: 'additional' }
    ]
  };

  // Combine required fields
  const allRequiredFields = [
    ...commonRequiredFields,
    ...(roleSpecificFields[user.role] || [])
  ];

  // For doctors, handle verification readiness separately
  if (user.role === 'doctor') {
    const essentialFields = allRequiredFields.filter(f => !f.priority || f.priority === 'essential');
    const additionalFields = allRequiredFields.filter(f => f.priority === 'additional');
    
    // Check essential fields first
    let essentialCompleted = 0;
    essentialFields.forEach(field => {
      const value = getNestedValue(user, field.key);
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          essentialCompleted++;
        } else if (!Array.isArray(value)) {
          essentialCompleted++;
        } else {
          missingFields.push(field.label);
        }
      } else {
        missingFields.push(field.label);
      }
    });
    
    // Check additional fields
    let additionalCompleted = 0;
    additionalFields.forEach(field => {
      const value = getNestedValue(user, field.key);
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          additionalCompleted++;
        } else if (!Array.isArray(value)) {
          additionalCompleted++;
        } else {
          missingFields.push(field.label);
        }
      } else {
        missingFields.push(field.label);
      }
    });
    
    totalFields = allRequiredFields.length;
    completedFields = essentialCompleted + additionalCompleted;
    
    // If essential fields are complete, give a boost to completion percentage
    const isVerificationReady = essentialCompleted === essentialFields.length;
    let completionPercentage = Math.round((completedFields / totalFields) * 100);
    
    // Boost completion percentage if verification ready
    if (isVerificationReady && completionPercentage < 60) {
      completionPercentage = Math.max(completionPercentage, 60);
    }
    
    const isComplete = completionPercentage >= 90;
    
    return {
      isComplete,
      completionPercentage,
      missingFields,
      completedFields,
      totalFields,
      isVerificationReady
    };
  }

  totalFields = allRequiredFields.length;

  // Check each field
  allRequiredFields.forEach(field => {
    const value = getNestedValue(user, field.key);
    
    if (value !== null && value !== undefined && value !== '') {
      // Special handling for arrays (like qualifications)
      if (Array.isArray(value) && value.length > 0) {
        completedFields++;
      } else if (!Array.isArray(value)) {
        completedFields++;
      } else {
        missingFields.push(field.label);
      }
    } else {
      missingFields.push(field.label);
    }
  });

  const completionPercentage = Math.round((completedFields / totalFields) * 100);
  const isComplete = completionPercentage >= 90; // Consider 90%+ as complete

  return {
    isComplete,
    completionPercentage,
    missingFields,
    completedFields,
    totalFields
  };
};

// Helper function to get nested object values
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

// Get profile completion status message
export const getProfileStatusMessage = (completionData) => {
  const { completionPercentage, missingFields, isVerificationReady } = completionData;
  
  // Special handling for doctors who are verification ready
  if (isVerificationReady !== undefined && isVerificationReady) {
    return {
      type: 'info',
      title: 'Ready for Verification',
      message: 'Your essential professional information is complete. Complete your full profile for a better patient experience.'
    };
  }
  
  if (completionPercentage >= 90) {
    return {
      type: 'success',
      title: 'Profile Complete',
      message: 'Your profile is complete and ready to use all features.'
    };
  } else if (completionPercentage >= 70) {
    return {
      type: 'warning',
      title: 'Almost There',
      message: `Complete ${missingFields.length} more field${missingFields.length > 1 ? 's' : ''} to unlock all features.`
    };
  } else if (completionPercentage >= 40) {
    return {
      type: 'info',
      title: 'Profile In Progress',
      message: `You're ${completionPercentage}% done. Add more information to improve your experience.`
    };
  } else {
    return {
      type: 'error',
      title: 'Complete Your Profile',
      message: 'Please complete your profile to access all platform features.'
    };
  }
};

// Get next suggested fields to complete
export const getNextSuggestedFields = (missingFields, maxSuggestions = 3) => {
  // Priority order for suggestions
  const priorityOrder = [
    'Date of Birth',
    'Gender',
    'Blood Group',
    'Street Address',
    'City',
    'State',
    'Emergency Contact Name',
    'Emergency Contact Phone',
    'Specialization',
    'License Number',
    'Years of Experience',
    'Consultation Fee'
  ];

  const sortedMissing = missingFields.sort((a, b) => {
    const aIndex = priorityOrder.indexOf(a);
    const bIndex = priorityOrder.indexOf(b);
    
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    
    return aIndex - bIndex;
  });

  return sortedMissing.slice(0, maxSuggestions);
};

// Check if user can access specific features
export const canAccessFeature = (user, feature) => {
  const profileData = checkProfileCompletion(user);
  
  const featureRequirements = {
    'appointments': 60, // Need 60% profile completion
    'prescriptions': 70,
    'health-records': 50,
    'emergency-access': 80,
    'video-consultation': 90
  };

  const requiredCompletion = featureRequirements[feature] || 0;
  return profileData.completionPercentage >= requiredCompletion;
};

// Get restricted features list
export const getRestrictedFeatures = (user) => {
  const profileData = checkProfileCompletion(user);
  const restrictedFeatures = [];

  const features = [
    { key: 'appointments', name: 'Book Appointments', required: 60 },
    { key: 'prescriptions', name: 'View Prescriptions', required: 70 },
    { key: 'health-records', name: 'Health Records', required: 50 },
    { key: 'emergency-access', name: 'Emergency Access', required: 80 },
    { key: 'video-consultation', name: 'Video Consultation', required: 90 }
  ];

  features.forEach(feature => {
    if (profileData.completionPercentage < feature.required) {
      restrictedFeatures.push({
        ...feature,
        missingPercentage: feature.required - profileData.completionPercentage
      });
    }
  });

  return restrictedFeatures;
};