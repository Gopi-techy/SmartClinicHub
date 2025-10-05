import React from 'react';
import Icon from '../../../components/AppIcon';
import { motion } from 'framer-motion';

const AuthFooter = () => {
  const currentYear = new Date().getFullYear();

  const trustBadges = [
    { icon: 'Shield', text: 'SSL Secured' },
    { icon: 'Lock', text: 'HIPAA Compliant' },
    { icon: 'CheckCircle', text: 'Medical Certified' },
  ];

  return (
    <motion.div 
      className="mt-8 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      {/* Trust Badges */}
      <div className="flex flex-wrap items-center justify-center gap-4 py-4">
        {trustBadges.map((badge, index) => (
          <div key={index} className="flex items-center px-3 py-2 bg-background border border-border rounded-full">
            <Icon name={badge.icon} size={14} className="text-primary mr-2" />
            <span className="text-xs font-medium">{badge.text}</span>
          </div>
        ))}
      </div>
      
      {/* Copyright & Links */}
      <div className="text-center text-xs text-muted-foreground">
        <p>&copy; {currentYear} SmartClinicHub. All rights reserved.</p>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-3">
          <button className="hover:text-foreground transition-colors">Privacy Policy</button>
          <button className="hover:text-foreground transition-colors">Terms of Service</button>
          <button className="hover:text-foreground transition-colors">Support</button>
        </div>
      </div>
    </motion.div>
  );
};

export default AuthFooter;