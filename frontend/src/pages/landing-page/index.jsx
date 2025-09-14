import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import StatsSection from './components/StatsSection';
import CTASection from './components/CTASection';
import FloatingElements from './components/FloatingElements';

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Set page title
    document.title = 'SmartClinicHub - Transform Your Healthcare Experience';
    
    // Check if user is already authenticated
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    
    if (token && userRole) {
      navigate(`/${userRole}-dashboard`);
    }
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>SmartClinicHub - Modern Healthcare Management Platform</title>
        <meta name="description" content="SmartClinicHub is a comprehensive healthcare management platform connecting patients, doctors, and administrators. Book appointments, manage health records, and streamline healthcare operations." />
        <meta name="keywords" content="healthcare management, medical platform, patient portal, doctor appointments, health records, clinic management, telemedicine" />
      </Helmet>

      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Floating Background Elements */}
        <FloatingElements />
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Features Section */}
      <FeaturesSection />
      
      {/* Statistics Section */}
      <StatsSection />
      
      {/* Call to Action Section */}
      <CTASection />
    </div>
    </>
  );
};

export default LandingPage;