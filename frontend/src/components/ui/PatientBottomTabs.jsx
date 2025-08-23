import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

const PatientBottomTabs = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { 
      id: 'dashboard', 
      label: 'Home', 
      icon: 'Home', 
      path: '/patient-dashboard',
      isActive: location.pathname === '/patient-dashboard'
    },
    { 
      id: 'appointments', 
      label: 'Appointments', 
      icon: 'Calendar', 
      path: '/appointment-booking',
      isActive: location.pathname === '/appointment-booking'
    },
    { 
      id: 'records', 
      label: 'Records', 
      icon: 'FileText', 
      path: '/health-records-management',
      isActive: location.pathname === '/health-records-management'
    },
    { 
      id: 'messages', 
      label: 'Messages', 
      icon: 'MessageCircle', 
      path: '/messages',
      isActive: location.pathname === '/messages'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden z-40">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center justify-center px-2 py-2 min-w-[60px] transition-colors ${
              tab.isActive 
                ? 'text-primary' :'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon name={tab.icon} size={20} className="mb-1" />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PatientBottomTabs;