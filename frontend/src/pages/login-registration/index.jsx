import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import AuthTabs from './components/AuthTabs';
import NewLoginForm from './components/NewLoginForm';
import RegisterForm from './components/RegisterForm';
import AuthHeader from './components/AuthHeader';
import AuthFooter from './components/AuthFooter';

const LoginRegistration = () => {
  const navigate = useNavigate();
  const { login, register, isAuthenticated, userRole, isLoading, error, clearError } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    // Only navigate if successfully authenticated and no errors
    // Add a small delay to ensure error state is properly set
    const navigationTimeout = setTimeout(() => {
      if (isAuthenticated && userRole && !error && !isLoading && !isSubmitting) {
        console.log('Login page: Navigating to dashboard for role:', userRole);
        navigate(`/${userRole}-dashboard`);
      } else if (error) {
        console.log('Login page: Not navigating due to error:', error);
      } else if (isLoading || isSubmitting) {
        console.log('Login page: Not navigating due to loading/submitting state');
      }
    }, 100);

    return () => clearTimeout(navigationTimeout);
  }, [isAuthenticated, userRole, navigate, error, isLoading, isSubmitting]);

  useEffect(() => {
    // Clear any existing errors when switching tabs
    if (error) {
      clearError();
    }
  }, [activeTab, error, clearError]);

  const handleLogin = async (formData) => {
    setIsSubmitting(true);
    try {
      await login(formData.email, formData.password, formData.rememberMe);
      // Navigation will be handled by the useEffect above
    } catch (err) {
      // Error is handled by the AuthContext, but we also need to rethrow for the form component
      console.error('Login error:', err);
      throw err; // Rethrow the error so NewLoginForm can display it
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (formData) => {
    setIsSubmitting(true);
    try {
      const result = await register(formData);
      if (result && result.success) {
        // Navigation will be handled by the useEffect above
        console.log('Registration successful');
        return { success: true };
      } else {
        // Return the error so the form can handle it
        console.log('Registration failed:', result?.error);
        return { success: false, error: result?.error || 'Registration failed' };
      }
    } catch (err) {
      // Error is handled by the AuthContext - don't rethrow
      console.error('Registration error:', err);
      return { success: false, error: err.message || 'Registration failed' };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading screen if checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Login & Registration - SmartClinicHub</title>
        <meta name="description" content="Secure login and registration for SmartClinicHub healthcare management platform. Access for patients, doctors, and administrators." />
        <meta name="keywords" content="healthcare login, medical platform, patient portal, doctor access, admin dashboard" />
      </Helmet>

      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-lg mx-auto">
          {/* Auth Header */}
          <AuthHeader />
          
          {/* Auth Card */}
          <div className="bg-card border border-border rounded-xl shadow-md p-8">
            {/* Tab Navigation */}
            <AuthTabs activeTab={activeTab} onTabChange={setActiveTab} />
            
            {/* Form Content */}
            <div className="mt-8">
              {activeTab === 'login' ? (
                <NewLoginForm 
                  onSubmit={handleLogin}
                  isLoading={isSubmitting || isLoading}
                  error={error}
                />
              ) : (
                <RegisterForm 
                  onSubmit={handleRegister}
                  isLoading={isSubmitting}
                  error={activeTab === 'register' ? error : null}
                />
              )}
            </div>
          </div>
          
          {/* Auth Footer */}
          <AuthFooter />
        </div>
      </div>
    </>
  );
};

export default LoginRegistration;