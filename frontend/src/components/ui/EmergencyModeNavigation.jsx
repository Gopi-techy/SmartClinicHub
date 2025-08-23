import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';

const EmergencyModeNavigation = ({ isActive, onExit }) => {
  const navigate = useNavigate();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const emergencyActions = [
    {
      id: 'call-911',
      label: 'Call 911',
      icon: 'Phone',
      action: () => window.location.href = 'tel:911',
      priority: 'critical'
    },
    {
      id: 'emergency-contacts',
      label: 'Emergency Contacts',
      icon: 'Users',
      action: () => {},
      priority: 'high'
    },
    {
      id: 'medical-id',
      label: 'Medical ID',
      icon: 'Heart',
      action: () => {},
      priority: 'high'
    },
    {
      id: 'allergies',
      label: 'Allergies & Conditions',
      icon: 'AlertTriangle',
      action: () => {},
      priority: 'medium'
    },
    {
      id: 'medications',
      label: 'Current Medications',
      icon: 'Pill',
      action: () => {},
      priority: 'medium'
    },
    {
      id: 'nearest-hospital',
      label: 'Nearest Hospital',
      icon: 'MapPin',
      action: () => {},
      priority: 'medium'
    }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'high':
        return 'bg-orange-500 hover:bg-orange-600 text-white';
      case 'medium':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-1200 bg-red-600 text-white">
      {/* Emergency Header */}
      <div className="flex items-center justify-between p-4 bg-red-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white text-red-600 rounded-full flex items-center justify-center">
            <Icon name="AlertTriangle" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold">EMERGENCY MODE</h1>
            {isOffline && (
              <p className="text-sm text-red-200">Offline - Cached data only</p>
            )}
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          iconName="X"
          onClick={onExit}
          className="bg-white text-red-600 hover:bg-gray-100"
        >
          Exit Emergency
        </Button>
      </div>

      {/* Emergency Actions Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {emergencyActions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              className={`p-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg ${getPriorityColor(action.priority)}`}
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Icon name={action.icon} size={32} />
                </div>
                <span className="text-lg font-semibold text-center">{action.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Emergency Information Cards */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* Medical Information */}
          <div className="bg-white bg-opacity-10 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Icon name="FileText" size={20} className="mr-2" />
              Quick Medical Info
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Blood Type:</span> O+
              </div>
              <div>
                <span className="font-medium">Allergies:</span> Penicillin, Shellfish
              </div>
              <div>
                <span className="font-medium">Conditions:</span> Diabetes Type 2
              </div>
              <div>
                <span className="font-medium">Emergency Contact:</span> Jane Doe (555) 123-4567
              </div>
            </div>
          </div>

          {/* Location & Hospital Info */}
          <div className="bg-white bg-opacity-10 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Icon name="MapPin" size={20} className="mr-2" />
              Nearest Emergency Services
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Hospital:</span> City General Hospital
              </div>
              <div>
                <span className="font-medium">Distance:</span> 2.3 miles
              </div>
              <div>
                <span className="font-medium">Phone:</span> (555) 987-6543
              </div>
              <div>
                <span className="font-medium">Address:</span> 123 Medical Center Dr
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Instructions */}
        <div className="mt-8 max-w-4xl mx-auto">
          <div className="bg-white bg-opacity-10 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Icon name="Info" size={20} className="mr-2" />
              Emergency Instructions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">If Conscious:</h4>
                <ul className="space-y-1 text-red-100">
                  <li>• Stay calm and call for help</li>
                  <li>• Provide medical information above</li>
                  <li>• Follow dispatcher instructions</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">If Unconscious:</h4>
                <ul className="space-y-1 text-red-100">
                  <li>• Check for breathing and pulse</li>
                  <li>• Begin CPR if trained</li>
                  <li>• Use AED if available</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyModeNavigation;