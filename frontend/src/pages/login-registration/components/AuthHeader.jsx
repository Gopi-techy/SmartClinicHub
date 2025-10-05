import React from 'react';
import Icon from '../../../components/AppIcon';
import { motion } from 'framer-motion';

const AuthHeader = () => {
  return (
    <motion.div 
      className="text-center mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-md">
            <Icon name="Heart" size={32} strokeWidth={1.5} className="animate-pulse" />
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-bold text-foreground">SmartClinicHub</h1>
            <p className="text-sm text-muted-foreground">Healthcare Management Platform</p>
          </div>
        </div>
      </div>
      
      {/* Welcome Message */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Welcome Back</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Access your healthcare dashboard to manage appointments, view records, and connect with healthcare professionals.
        </p>
      </div>
    </motion.div>
  );
};

export default AuthHeader;