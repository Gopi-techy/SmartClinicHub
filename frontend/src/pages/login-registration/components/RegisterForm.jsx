import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import { useAuth } from '../../../contexts/AuthContext';
import { Checkbox } from '../../../components/ui/Checkbox';


const RegisterForm = ({ onSubmit, isLoading, error }) => {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'patient',
    dateOfBirth: '',
    gender: '',
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const roleOptions = [
    { value: 'patient', label: 'Patient', description: 'Book appointments and manage health records' },
    { value: 'doctor', label: 'Doctor', description: 'Manage patients and appointments' },
    { value: 'admin', label: 'Administrator', description: 'System administration and analytics' }
  ];

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleRoleChange = (value) => {
    setFormData(prev => ({
      ...prev,
      role: value
    }));
    
    if (validationErrors.role) {
      setValidationErrors(prev => ({
        ...prev,
        role: ''
      }));
    }
  };

  const handleGenderChange = (value) => {
    setFormData(prev => ({
      ...prev,
      gender: value
    }));
    
    if (validationErrors.gender) {
      setValidationErrors(prev => ({
        ...prev,
        gender: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2 || formData.firstName.trim().length > 50) {
      errors.firstName = 'First name must be between 2 and 50 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.firstName.trim())) {
      errors.firstName = 'First name can only contain letters and spaces';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2 || formData.lastName.trim().length > 50) {
      errors.lastName = 'Last name must be between 2 and 50 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.lastName.trim())) {
      errors.lastName = 'Last name can only contain letters and spaces';
    }
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone) {
      errors.phone = 'Phone number is required';
    } else if (!/^[+]?[1-9]\d{1,14}$/.test(formData.phone)) {
      errors.phone = 'Phone must start with 1-9 and contain only digits (no spaces/dashes)';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.role) {
      errors.role = 'Please select your role';
    }
    
    if (!formData.agreeToTerms) {
      errors.acceptTerms = 'You must accept the terms and conditions';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      // Prepare complete registration data
      const registrationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: formData.role,
        dateOfBirth: formData.dateOfBirth || '1990-01-01',
        gender: formData.gender || 'other'
      };
      
      console.log('Registration data being sent:', registrationData);
      
      // Call signUp with the complete userData object
      const result = await signUp(registrationData);
      
      if (result?.success) {
        // Registration successful - will be handled by AuthContext
        console.log('Registration successful');
        return;
      }
    } catch (error) {
      console.error('Registration error:', error);
      // Error will be shown by AuthContext via state.error
    }
  };

  const handleGoogleRegister = () => {
    // Mock Google OAuth registration
    console.log('Google OAuth registration initiated');
    onSubmit({ 
      email: 'newuser@gmail.com', 
      firstName: 'Google',
      lastName: 'User',
      role: 'patient',
      provider: 'google' 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="First Name"
          type="text"
          name="firstName"
          placeholder="Enter first name"
          value={formData.firstName}
          onChange={handleChange}
          error={validationErrors.firstName}
          required
        />
        
        <Input
          label="Last Name"
          type="text"
          name="lastName"
          placeholder="Enter last name"
          value={formData.lastName}
          onChange={handleChange}
          error={validationErrors.lastName}
          required
        />
      </div>
      
      <Input
        label="Email Address"
        type="email"
        name="email"
        placeholder="Enter your email"
        value={formData.email}
        onChange={handleChange}
        error={validationErrors.email}
        required
      />
      
      <Input
        label="Phone Number"
        type="tel"
        name="phone"
        placeholder="1234567890 (digits only, no spaces)"
        value={formData.phone}
        onChange={handleChange}
        error={validationErrors.phone}
        description="Must start with 1-9, digits only (no spaces or dashes)"
        required
      />
      
      <Select
        label="Select Your Role"
        description="Choose how you'll use SmartClinicHub"
        options={roleOptions}
        value={formData.role}
        onChange={handleRoleChange}
        error={validationErrors.role}
        placeholder="Select your role"
        required
      />
      
      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          name="password"
          placeholder="Create a strong password"
          value={formData.password}
          onChange={handleChange}
          error={validationErrors.password}
          description="Must contain uppercase, lowercase, number, and special character"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-healthcare"
        >
          <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={16} />
        </button>
      </div>
      
      <div className="relative">
        <Input
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          name="confirmPassword"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={validationErrors.confirmPassword}
          required
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-healthcare"
        >
          <Icon name={showConfirmPassword ? 'EyeOff' : 'Eye'} size={16} />
        </button>
      </div>
      
      <Checkbox
        label="I agree to the Terms of Service and Privacy Policy"
        name="agreeToTerms"
        checked={formData.agreeToTerms}
        onChange={handleChange}
        error={validationErrors.acceptTerms}
        required
      />
      
      <Button
        type="submit"
        variant="default"
        fullWidth
        loading={isLoading}
        className="mt-6"
      >
        Create Account
      </Button>
      
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-background text-muted-foreground">Or continue with</span>
        </div>
      </div>
      
      <Button
        type="button"
        variant="outline"
        fullWidth
        onClick={handleGoogleRegister}
        className="border-2 flex items-center justify-center gap-3"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </Button>
    </form>
  );
};

export default RegisterForm;