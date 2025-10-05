import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import Icon from '../../../components/AppIcon';

const NewLoginForm = ({ onSubmit, isLoading, error }) => {
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isTouched, setIsTouched] = useState({});
  const [backendError, setBackendError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update backend error when error prop changes
  useEffect(() => {
    if (error) {
      setBackendError(error);
    }
  }, [error]);

  // Clear backend error when user starts typing
  useEffect(() => {
    if (backendError) {
      setBackendError(null);
    }
  }, [formData]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Validate on change
    validateField(name, type === 'checkbox' ? checked : value);
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setIsTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, formData[name]);
  };

  const validateField = (name, value) => {
    let errorMessage = '';
    
    switch (name) {
      case 'email':
        if (!value) {
          errorMessage = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          errorMessage = 'Please enter a valid email address';
        }
        break;
        
      case 'password':
        if (!value) {
          errorMessage = 'Password is required';
        } else if (value.length < 6) {
          errorMessage = 'Password must be at least 6 characters';
        }
        break;
        
      default:
        break;
    }
    
    setErrors(prev => ({
      ...prev,
      [name]: errorMessage
    }));
    
    return !errorMessage;
  };

  const validateForm = () => {
    const emailValid = validateField('email', formData.email);
    const passwordValid = validateField('password', formData.password);
    
    setIsTouched({
      email: true,
      password: true
    });
    
    return emailValid && passwordValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setBackendError(null);
    
    try {
      // Use the parent onSubmit handler which will process authentication
      // through the AuthContext
      await onSubmit?.(formData);
      
      // If we get here without an error, authentication was successful
      // and navigation will be handled by AuthContext
    } catch (err) {
      console.error('Login error:', err);
      // Set the backend error state directly from the caught error
      setBackendError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Backend Error Display */}
      {(backendError || error) && (
        <div className="p-4 bg-destructive/15 border-l-4 border-l-destructive border border-destructive/30 rounded-lg text-destructive mb-4">
          <div className="flex gap-3 items-center">
            <Icon name="AlertCircle" className="min-w-5 h-5 text-destructive" />
            <p className="text-sm font-medium">{backendError || error}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Email Input */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Icon name="Mail" className={`w-5 h-5 ${errors.email ? 'text-destructive' : 'text-muted-foreground'}`} />
            </div>
            <input
              id="email"
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Email address"
              className={`pl-10 w-full rounded-lg border ${
                errors.email 
                  ? 'border-destructive focus:ring-destructive' 
                  : isTouched.email && !errors.email 
                    ? 'border-green-500 focus:ring-green-500' 
                    : 'border-input'
              } h-11 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`}
              disabled={isSubmitting || isLoading}
            />
            {isTouched.email && !errors.email && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <Icon name="CheckCircle" className="w-5 h-5 text-green-500" />
              </div>
            )}
          </div>
          {errors.email && isTouched.email && (
            <p className="text-sm text-destructive flex items-center gap-1 pl-1">
              <Icon name="AlertCircle" size={14} />
              {errors.email}
            </p>
          )}
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Icon name="Lock" className={`w-5 h-5 ${errors.password || backendError ? 'text-destructive' : 'text-muted-foreground'}`} />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Password"
              className={`pl-10 pr-10 w-full rounded-lg border ${
                errors.password || backendError
                  ? 'border-destructive focus:ring-destructive bg-destructive/5' 
                  : isTouched.password && !errors.password 
                    ? 'border-green-500 focus:ring-green-500' 
                    : 'border-input'
              } h-11 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`}
              disabled={isSubmitting || isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground focus:outline-none"
              disabled={isSubmitting || isLoading}
            >
              <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={18} />
            </button>
          </div>
          {errors.password && isTouched.password && (
            <p className="text-sm text-destructive flex items-center gap-1 pl-1 font-medium">
              <Icon name="AlertCircle" size={14} />
              {errors.password}
            </p>
          )}
        </div>
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="rememberMe"
            type="checkbox"
            checked={formData.rememberMe}
            onChange={handleChange}
            className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
            disabled={isSubmitting || isLoading}
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm">
            Remember me
          </label>
        </div>
        <button
          type="button"
          className="text-sm font-medium text-primary hover:text-primary/80 focus:outline-none"
          disabled={isSubmitting || isLoading}
        >
          Forgot password?
        </button>
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 ${
            (isSubmitting || isLoading) ? 'bg-primary/80' : ''
          }`}
          disabled={isSubmitting || isLoading}
        >
          {(isSubmitting || isLoading) ? (
            <span className="flex items-center">
              <svg className="-ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </span>
          ) : (
            <span className="flex items-center justify-center w-full">
              <Icon name="LogIn" className="mr-2 h-4 w-4" />
              Sign in
            </span>
          )}
        </button>
      </div>
      
      {/* Social Login */}
      <div>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-muted-foreground">Or continue with</span>
          </div>
        </div>
        
        <button
          type="button"
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-input rounded-lg shadow-sm text-sm font-medium bg-background hover:bg-muted transition-colors"
          disabled={isSubmitting || isLoading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </form>
  );
};

export default NewLoginForm;
