import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  );
};

export default LandingPage;