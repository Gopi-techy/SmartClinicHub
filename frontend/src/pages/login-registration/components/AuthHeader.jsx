import React from 'react';
import Icon from '../../../components/AppIcon';

const AuthHeader = () => {
  return (
    <div className="text-center mb-8">
      {/* Logo */}
      <div className="flex items-center justify-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg">
          <Icon name="Heart" size={28} strokeWidth={2.5} />
        </div>
        <div className="text-left">
          <h1 className="text-2xl font-bold text-foreground">SmartClinicHub</h1>
          <p className="text-sm text-muted-foreground">Healthcare Management Platform</p>
        </div>
      </div>
      
      {/* Welcome Message */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Welcome to SmartClinicHub</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Streamline your healthcare experience with our comprehensive management platform for patients, doctors, and administrators.
        </p>
      </div>
    </div>
  );
};

export default AuthHeader;