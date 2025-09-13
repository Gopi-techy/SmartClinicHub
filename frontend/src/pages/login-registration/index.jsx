import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import AuthTabs from './components/AuthTabs';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import AuthHeader from './components/AuthHeader';
import AuthFooter from './components/AuthFooter';
import AuthFloatingElements from './components/AuthFloatingElements';

const LoginRegistration = () => {
  const navigate = useNavigate();
  const { login, register, isAuthenticated, userRole, isLoading, error, clearError } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    if (isAuthenticated && userRole) {
      navigate(`/${userRole}-dashboard`);
    }
  }, [isAuthenticated, userRole, navigate]);

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
      // Error is handled by the AuthContext
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (formData) => {
    setIsSubmitting(true);
    try {
      await register(formData);
      // Navigation will be handled by the useEffect above
    } catch (err) {
      // Error is handled by the AuthContext
      console.error('Registration error:', err);
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

      <div className="min-h-screen bg-background flex">
        {/* Left Side - Floating Animations */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <AuthFloatingElements />
        </div>
        
        {/* Right Side - Auth Forms */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            {/* Auth Header */}
            <AuthHeader />
            
            {/* Auth Card */}
            <div className="bg-card border border-border rounded-xl shadow-healthcare-lg p-6 md:p-8">
              {/* Tab Navigation */}
              <AuthTabs activeTab={activeTab} onTabChange={setActiveTab} />
              
              {/* Error Display */}
              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              
              {/* Form Content */}
              <div className="space-y-6">
                {activeTab === 'login' ? (
                  <LoginForm 
                    onSubmit={handleLogin}
                    isLoading={isSubmitting}
                  />
                ) : (
                  <RegisterForm 
                    onSubmit={handleRegister}
                    isLoading={isSubmitting}
                  />
                )}
              </div>
            </div>
            
            {/* Auth Footer */}
            <AuthFooter />
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginRegistration;