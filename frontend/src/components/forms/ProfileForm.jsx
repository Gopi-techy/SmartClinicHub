import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { checkProfileCompletion } from '../../utils/profileUtils';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

const ProfileForm = ({ onComplete }) => {
  const { user, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    
    // Address Information
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    },
    
    // Emergency Contact (for patients)
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    
    // Medical Information (for patients)
    medicalInfo: {
      bloodGroup: '',
      allergies: [],
      medications: [],
      medicalConditions: []
    },
    
    // Professional Information (for doctors)
    professionalInfo: {
      specialization: '',
      licenseNumber: '',
      experience: '',
      qualifications: [],
      consultationFee: '',
      biography: '',
      languages: []
    }
  });

  const [errors, setErrors] = useState({});

  // Initialize form with existing user data
  useEffect(() => {
    if (user) {
      setFormData(prevData => ({
        ...prevData,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        gender: user.gender || '',
        address: {
          ...prevData.address,
          ...user.address
        },
        emergencyContact: {
          ...prevData.emergencyContact,
          ...user.emergencyContact
        },
        medicalInfo: {
          ...prevData.medicalInfo,
          ...user.medicalInfo
        },
        professionalInfo: {
          ...prevData.professionalInfo,
          ...user.professionalInfo
        }
      }));
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleArrayInput = (field, value) => {
    const arrayValue = value.split(',').map(item => item.trim()).filter(item => item);
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: arrayValue
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: arrayValue
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      // Personal Information
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      
      if (user?.role === 'patient') {
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
        if (!formData.gender) newErrors.gender = 'Gender is required';
      }
    }

    if (step === 2) {
      // Address Information
      if (!formData.address.street.trim()) newErrors['address.street'] = 'Street address is required';
      if (!formData.address.city.trim()) newErrors['address.city'] = 'City is required';
      if (!formData.address.state.trim()) newErrors['address.state'] = 'State is required';
      if (!formData.address.zipCode.trim()) newErrors['address.zipCode'] = 'ZIP code is required';
    }

    if (step === 3 && user?.role === 'patient') {
      // Emergency Contact
      if (!formData.emergencyContact.name.trim()) newErrors['emergencyContact.name'] = 'Emergency contact name is required';
      if (!formData.emergencyContact.phone.trim()) newErrors['emergencyContact.phone'] = 'Emergency contact phone is required';
      if (!formData.emergencyContact.relationship.trim()) newErrors['emergencyContact.relationship'] = 'Relationship is required';
    }

    if (step === 3 && user?.role === 'doctor') {
      // Professional Information
      if (!formData.professionalInfo.specialization.trim()) newErrors['professionalInfo.specialization'] = 'Specialization is required';
      if (!formData.professionalInfo.licenseNumber.trim()) newErrors['professionalInfo.licenseNumber'] = 'License number is required';
      if (!formData.professionalInfo.experience) newErrors['professionalInfo.experience'] = 'Years of experience is required';
      if (!formData.professionalInfo.consultationFee) newErrors['professionalInfo.consultationFee'] = 'Consultation fee is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) return;

    setLoading(true);
    setErrors({}); // Clear previous errors
    
    try {
      // Transform form data to match backend schema
      const profileData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        // Only include dateOfBirth and gender for patients
        ...(user.role === 'patient' && {
          dateOfBirth: formData.dateOfBirth || undefined,
          gender: formData.gender || undefined,
        }),
        
        // Address
        address: {
          street: formData.address.street.trim() || undefined,
          city: formData.address.city.trim() || undefined,
          state: formData.address.state.trim() || undefined,
          zipCode: formData.address.zipCode.trim() || undefined,
          country: formData.address.country.trim() || 'India'
        },
        
        // Emergency Contact
        emergencyContact: {
          name: formData.emergencyContact.name.trim() || undefined,
          phone: formData.emergencyContact.phone.trim() || undefined,
          relationship: formData.emergencyContact.relationship.trim() || undefined
        },
        
        // Medical Info (for patients)
        medicalInfo: {
          bloodGroup: formData.medicalInfo.bloodGroup || undefined,
          allergies: formData.medicalInfo.allergies.filter(item => item.trim()),
          medications: formData.medicalInfo.medications.filter(item => item.trim()),
          medicalConditions: formData.medicalInfo.medicalConditions.filter(item => item.trim())
        },
        
        // Professional Info (for doctors)
        professionalInfo: {
          specialization: formData.professionalInfo.specialization.trim() || undefined,
          licenseNumber: formData.professionalInfo.licenseNumber.trim() || undefined,
          experience: formData.professionalInfo.experience ? parseInt(formData.professionalInfo.experience) || 0 : undefined,
          qualifications: formData.professionalInfo.qualifications.filter(item => item.trim()),
          consultationFee: formData.professionalInfo.consultationFee ? parseFloat(formData.professionalInfo.consultationFee) || 0 : undefined,
          languages: formData.professionalInfo.languages.filter(item => item.trim())
        }
      };
      
      // Remove empty/null/undefined values to avoid validation errors
      const cleanData = {};
      Object.keys(profileData).forEach(key => {
        if (profileData[key] !== null && profileData[key] !== undefined) {
          if (typeof profileData[key] === 'object' && !Array.isArray(profileData[key])) {
            // Handle nested objects
            const nestedClean = {};
            Object.keys(profileData[key]).forEach(nestedKey => {
              const value = profileData[key][nestedKey];
              if (value !== null && value !== undefined && value !== '') {
                if (Array.isArray(value)) {
                  if (value.length > 0) nestedClean[nestedKey] = value;
                } else {
                  nestedClean[nestedKey] = value;
                }
              }
            });
            if (Object.keys(nestedClean).length > 0) {
              cleanData[key] = nestedClean;
            }
          } else if (profileData[key] !== '') {
            cleanData[key] = profileData[key];
          }
        }
      });
      
      console.log('Raw form data:', formData);
      console.log('Transformed profile data:', profileData);
      console.log('Final clean data being sent:', cleanData);
      const result = await updateUserProfile(cleanData);
      
      if (result.success) {
        console.log('Profile updated successfully');
        setSuccess(true);
        
        // Call onComplete immediately for real-time UI updates
        if (onComplete) {
          onComplete();
        }
        
        // Show success message briefly
        setTimeout(() => {
          setSuccess(false);
        }, 2000);
      } else {
        throw new Error('Profile update failed');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      let errorMessage = 'Failed to update profile. Please try again.';
      
      // Handle specific error messages from the backend
      if (error.message && error.message !== 'Profile update failed') {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const getTotalSteps = () => {
    return user?.role === 'patient' ? 4 : 3;
  };

  const getStepTitle = (step) => {
    const titles = {
      1: 'Personal Information',
      2: 'Address Information',
      3: user?.role === 'patient' ? 'Emergency Contact' : 'Professional Information',
      4: user?.role === 'patient' ? 'Medical Information' : ''
    };
    return titles[step] || '';
  };

  const renderPersonalInfo = () => (
    <div className="space-y-8">
      {/* Basic Information */}
      <div className="bg-background border border-border p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <svg className="w-5 h-5 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="First Name *"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            error={errors.firstName}
            placeholder="Enter your first name"
          />
          <Input
            label="Last Name *"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            error={errors.lastName}
            placeholder="Enter your last name"
          />
        </div>
      </div>
      
      {/* Contact Information */}
      <div className="bg-background border border-border p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <svg className="w-5 h-5 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Contact Information
        </h3>
        <div className="space-y-4">
          <Input
            label="Email *"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={errors.email}
            placeholder="Enter your email address"
            disabled
          />
          
          <Input
            label="Phone Number *"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            error={errors.phone}
            placeholder="Enter your phone number"
          />
        </div>
      </div>
      
      {user?.role === 'patient' && (
        <div className="bg-background border border-border p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <svg className="w-5 h-5 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Personal Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Date of Birth *"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              error={errors.dateOfBirth}
            />
            
            <Select
              label="Gender *"
              value={formData.gender}
              onChange={(value) => handleInputChange('gender', value)}
              error={errors.gender}
              placeholder="Select your gender"
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
                { value: 'prefer-not-to-say', label: 'Prefer not to say' }
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderAddressInfo = () => (
    <div className="space-y-8">
      <div className="bg-background border border-border p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <svg className="w-5 h-5 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Home Address
        </h3>
        <div className="space-y-6">
          <Input
            label="Street Address *"
            value={formData.address.street}
            onChange={(e) => handleInputChange('address.street', e.target.value)}
            error={errors['address.street']}
            placeholder="Enter your street address"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="City *"
              value={formData.address.city}
              onChange={(e) => handleInputChange('address.city', e.target.value)}
              error={errors['address.city']}
              placeholder="Enter your city"
            />
            
            <Input
              label="State *"
              value={formData.address.state}
              onChange={(e) => handleInputChange('address.state', e.target.value)}
              error={errors['address.state']}
              placeholder="Enter your state"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="ZIP Code *"
              value={formData.address.zipCode}
              onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
              error={errors['address.zipCode']}
              placeholder="Enter your ZIP code"
            />
            
            <Input
              label="Country"
              value={formData.address.country}
              onChange={(e) => handleInputChange('address.country', e.target.value)}
              placeholder="Country"
              disabled
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmergencyContact = () => (
    <div className="space-y-8">
      <div className="bg-destructive/10 p-6 rounded-xl border border-destructive/20">
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
          <svg className="w-5 h-5 text-destructive mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Emergency Contact Information
        </h3>
        <p className="text-sm text-muted-foreground mb-6">This person will be contacted in case of a medical emergency.</p>
        
        <div className="space-y-6">
          <Input
            label="Emergency Contact Name *"
            value={formData.emergencyContact.name}
            onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
            error={errors['emergencyContact.name']}
            placeholder="Enter emergency contact name"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Emergency Contact Phone *"
              type="tel"
              value={formData.emergencyContact.phone}
              onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
              error={errors['emergencyContact.phone']}
              placeholder="Enter emergency contact phone"
            />
            
            <Select
              label="Relationship *"
              value={formData.emergencyContact.relationship}
              onChange={(value) => handleInputChange('emergencyContact.relationship', value)}
              error={errors['emergencyContact.relationship']}
              placeholder="Select relationship"
              options={[
                { value: 'spouse', label: 'Spouse' },
                { value: 'parent', label: 'Parent' },
                { value: 'child', label: 'Child' },
                { value: 'sibling', label: 'Sibling' },
                { value: 'friend', label: 'Friend' },
                { value: 'other', label: 'Other' }
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderMedicalInfo = () => (
    <div className="space-y-8">
      {/* Basic Medical Info */}
      <div className="bg-primary/10 p-6 rounded-xl border border-primary/20">
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
          <svg className="w-5 h-5 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Medical Information
        </h3>
        <p className="text-sm text-muted-foreground mb-6">This information helps healthcare providers give you better care.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Blood Group"
            value={formData.medicalInfo.bloodGroup}
            onChange={(value) => handleInputChange('medicalInfo.bloodGroup', value)}
            placeholder="Select your blood group"
            options={[
              { value: 'A+', label: 'A+ (A Positive)' },
              { value: 'A-', label: 'A- (A Negative)' },
              { value: 'B+', label: 'B+ (B Positive)' },
              { value: 'B-', label: 'B- (B Negative)' },
              { value: 'AB+', label: 'AB+ (AB Positive)' },
              { value: 'AB-', label: 'AB- (AB Negative)' },
              { value: 'O+', label: 'O+ (O Positive)' },
              { value: 'O-', label: 'O- (O Negative)' }
            ]}
          />
        </div>
      </div>

      {/* Allergies and Medications */}
      <div className="bg-destructive/10 p-6 rounded-xl border border-destructive/20">
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
          <svg className="w-5 h-5 text-destructive mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Allergies & Medications
        </h3>
        <p className="text-sm text-muted-foreground mb-6">Important safety information for healthcare providers.</p>
        
        <div className="space-y-6">
          <Input
            label="Allergies"
            value={formData.medicalInfo.allergies.join(', ')}
            onChange={(e) => handleArrayInput('medicalInfo.allergies', e.target.value)}
            placeholder="Enter allergies separated by commas"
            description="Example: Peanuts, Shellfish, Penicillin"
          />
          
          <Input
            label="Current Medications"
            value={formData.medicalInfo.medications.join(', ')}
            onChange={(e) => handleArrayInput('medicalInfo.medications', e.target.value)}
            placeholder="Enter current medications separated by commas"
            description="Example: Aspirin 81mg, Metformin 500mg"
          />
        </div>
      </div>

      {/* Medical Conditions */}
      <div className="bg-background border border-border p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
          <svg className="w-5 h-5 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Medical History
        </h3>
        <p className="text-sm text-muted-foreground mb-6">Existing medical conditions or chronic illnesses.</p>
        
        <Input
          label="Medical Conditions"
          value={formData.medicalInfo.medicalConditions.join(', ')}
          onChange={(e) => handleArrayInput('medicalInfo.medicalConditions', e.target.value)}
          placeholder="Enter medical conditions separated by commas"
          description="Example: Diabetes, Hypertension, Asthma (leave blank if none)"
        />
      </div>
    </div>
  );

  const renderProfessionalInfo = () => (
    <div className="space-y-8">
      {/* Medical Practice */}
      <div className="bg-primary/10 p-6 rounded-xl border border-primary/20">
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
          <svg className="w-5 h-5 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          Medical Practice
        </h3>
        <p className="text-sm text-muted-foreground mb-6">Your medical specialization and practice information.</p>
        
        <div className="space-y-6">
          <Select
            label="Specialization *"
            value={formData.professionalInfo.specialization}
            onChange={(value) => handleInputChange('professionalInfo.specialization', value)}
            error={errors['professionalInfo.specialization']}
            placeholder="Select your medical specialization"
            options={[
              { value: 'general-medicine', label: 'General Medicine' },
              { value: 'cardiology', label: 'Cardiology' },
              { value: 'dermatology', label: 'Dermatology' },
              { value: 'neurology', label: 'Neurology' },
              { value: 'pediatrics', label: 'Pediatrics' },
              { value: 'psychiatry', label: 'Psychiatry' },
              { value: 'orthopedics', label: 'Orthopedics' },
              { value: 'ophthalmology', label: 'Ophthalmology' },
              { value: 'ent', label: 'ENT' },
              { value: 'gynecology', label: 'Gynecology' }
            ]}
          />
          
          <Input
            label="License Number *"
            value={formData.professionalInfo.licenseNumber}
            onChange={(e) => handleInputChange('professionalInfo.licenseNumber', e.target.value)}
            error={errors['professionalInfo.licenseNumber']}
            placeholder="Enter your medical license number"
          />
        </div>
      </div>

      {/* Experience & Fees */}
      <div className="bg-background border border-border p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
          <svg className="w-5 h-5 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          Experience & Consultation
        </h3>
        <p className="text-sm text-muted-foreground mb-6">Your professional experience and consultation details.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Years of Experience *"
            type="number"
            value={formData.professionalInfo.experience}
            onChange={(e) => handleInputChange('professionalInfo.experience', e.target.value)}
            error={errors['professionalInfo.experience']}
            placeholder="Enter years of experience"
            min="0"
          />
          
          <Input
            label="Consultation Fee (USD) *"
            type="number"
            value={formData.professionalInfo.consultationFee}
            onChange={(e) => handleInputChange('professionalInfo.consultationFee', e.target.value)}
            error={errors['professionalInfo.consultationFee']}
            placeholder="Enter consultation fee"
            min="0"
          />
        </div>
      </div>

      {/* Qualifications & Languages */}
      <div className="bg-secondary/50 p-6 rounded-xl border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
          <svg className="w-5 h-5 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
          Qualifications & Languages
        </h3>
        <p className="text-sm text-muted-foreground mb-6">Your educational background and language skills.</p>
        
        <div className="space-y-6">
          <Input
            label="Qualifications"
            value={formData.professionalInfo.qualifications.join(', ')}
            onChange={(e) => handleArrayInput('professionalInfo.qualifications', e.target.value)}
            placeholder="Enter qualifications separated by commas"
            description="Example: MBBS, MD, Fellowship in Cardiology"
          />
          
          <Input
            label="Languages Spoken"
            value={formData.professionalInfo.languages.join(', ')}
            onChange={(e) => handleArrayInput('professionalInfo.languages', e.target.value)}
            placeholder="Enter languages separated by commas"
            description="Example: English, Spanish, French"
          />
        </div>
      </div>

      {/* Biography */}
      <div className="bg-background border border-border p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
          <svg className="w-5 h-5 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Professional Biography
        </h3>
        <p className="text-sm text-muted-foreground mb-4">Tell patients about yourself, your approach to care, and your practice philosophy.</p>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Biography
          </label>
          <textarea
            value={formData.professionalInfo.biography}
            onChange={(e) => handleInputChange('professionalInfo.biography', e.target.value)}
            placeholder="Write a brief biography about yourself, your medical approach, and what makes your practice unique..."
            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
            rows="5"
          />
          <p className="text-xs text-muted-foreground mt-1">This will be displayed on your public profile for patients to read.</p>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderPersonalInfo();
      case 2:
        return renderAddressInfo();
      case 3:
        return user?.role === 'patient' ? renderEmergencyContact() : renderProfessionalInfo();
      case 4:
        return user?.role === 'patient' ? renderMedicalInfo() : null;
      default:
        return null;
    }
  };

  const totalSteps = getTotalSteps();

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-foreground">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm font-medium text-primary-foreground bg-primary px-3 py-1 rounded-full">
            {Math.round((currentStep / totalSteps) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-3 shadow-inner">
          <div 
            className="bg-primary h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
        
        {/* Step indicators */}
        <div className="flex justify-between mt-4">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                i + 1 <= currentStep 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'bg-secondary text-muted-foreground'
              }`}>
                {i + 1}
              </div>
              <span className={`text-xs mt-2 transition-colors duration-300 ${
                i + 1 <= currentStep ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}>
                {getStepTitle(i + 1).split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Title */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          {getStepTitle(currentStep)}
        </h2>
        <p className="text-muted-foreground">
          {currentStep === 1 && "Let's start with your basic information"}
          {currentStep === 2 && "Where can we reach you?"}
          {currentStep === 3 && user?.role === 'patient' && "Who should we contact in case of emergency?"}
          {currentStep === 3 && user?.role === 'doctor' && "Tell us about your professional background"}
          {currentStep === 4 && "Health information helps us serve you better"}
        </p>
      </div>

      {/* Form */}
      <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {renderCurrentStep()}

            {/* Success Message */}
            {success && (
              <div className="text-green-700 text-sm bg-green-50 border border-green-200 p-4 rounded-lg flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Profile updated successfully! Redirecting...
              </div>
            )}

            {/* Error Message */}
            {errors.submit && (
              <div className="text-red-700 text-sm bg-red-50 border border-red-200 p-4 rounded-lg flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.submit}
              </div>
            )}
          </form>
        </div>

        {/* Navigation Buttons */}
        <div className="bg-secondary/50 px-8 py-6 border-t border-border">
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-2.5"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </Button>

            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </div>

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={nextStep}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                Next
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={loading || success}
                onClick={handleSubmit}
                className={`px-8 py-2.5 ${success ? 'bg-green-500' : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'} disabled:from-gray-400 disabled:to-gray-500`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : success ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Saved!
                  </>
                ) : (
                  <>
                    Complete Profile
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;