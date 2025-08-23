import React from 'react';
import Icon from '../../../components/AppIcon';

const AuthFooter = () => {
  const currentYear = new Date().getFullYear();

  const features = [
    { icon: 'Calendar', text: 'Easy Appointment Booking' },
    { icon: 'FileText', text: 'Digital Health Records' },
    { icon: 'Shield', text: 'HIPAA Compliant Security' },
    { icon: 'Smartphone', text: 'Mobile-First Design' }
  ];

  return (
    <div className="mt-12 space-y-8">
      {/* Features Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {features.map((feature, index) => (
          <div key={index} className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center mx-auto mb-2">
              <Icon name={feature.icon} size={16} />
            </div>
            <p className="text-xs text-muted-foreground font-medium">{feature.text}</p>
          </div>
        ))}
      </div>
      
      {/* Trust Indicators */}
      <div className="flex items-center justify-center space-x-6 py-4 border-t border-border">
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Icon name="Shield" size={14} />
          <span>SSL Secured</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Icon name="Lock" size={14} />
          <span>HIPAA Compliant</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Icon name="CheckCircle" size={14} />
          <span>Medical Certified</span>
        </div>
      </div>
      
      {/* Copyright */}
      <div className="text-center text-xs text-muted-foreground">
        <p>&copy; {currentYear} SmartClinicHub. All rights reserved.</p>
        <div className="flex items-center justify-center space-x-4 mt-2">
          <button className="hover:text-foreground transition-healthcare">Privacy Policy</button>
          <span>•</span>
          <button className="hover:text-foreground transition-healthcare">Terms of Service</button>
          <span>•</span>
          <button className="hover:text-foreground transition-healthcare">Support</button>
        </div>
      </div>
    </div>
  );
};

export default AuthFooter;