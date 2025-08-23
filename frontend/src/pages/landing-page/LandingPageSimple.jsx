import React from 'react';

const LandingPageSimple = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Welcome to SmartClinicHub
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your comprehensive healthcare management solution
          </p>
          <div className="space-x-4">
            <a 
              href="/login-registration" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </a>
            <a 
              href="/patient-dashboard" 
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Patient Portal
            </a>
          </div>
        </div>
        
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3">Easy Appointments</h3>
            <p className="text-gray-600">Book and manage your appointments with ease</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3">Health Records</h3>
            <p className="text-gray-600">Secure access to your medical history</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3">Messaging</h3>
            <p className="text-gray-600">Communicate with your healthcare providers</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPageSimple;
