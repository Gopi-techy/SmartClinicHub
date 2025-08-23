import React, { useEffect, useRef } from 'react';
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
        <title>SmartClinicHub - Transform Your Healthcare Experience</title>
        <meta name="description" content="Revolutionary healthcare management platform connecting patients, doctors, and administrators with seamless appointment booking, health records, and telemedicine capabilities." />
        <meta name="keywords" content="healthcare management, telemedicine, appointment booking, health records, medical platform, digital health" />
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