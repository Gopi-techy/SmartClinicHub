import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';

const ToastNotification = ({ type = 'info', message, duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-green-50 border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-600',
          icon: 'CheckCircle'
        };
      case 'error':
        return {
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          icon: 'XCircle'
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          icon: 'AlertTriangle'
        };
      default:
        return {
          bgColor: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600',
          icon: 'Info'
        };
    }
  };

  const config = getTypeConfig();

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm border rounded-lg p-4 shadow-lg transform transition-all duration-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} ${config.bgColor}`}>
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          <Icon name={config.icon} size={20} />
        </div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${config.textColor}`}>
            {message}
          </p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className={`flex-shrink-0 ${config.textColor} hover:opacity-70`}
        >
          <Icon name="X" size={16} />
        </button>
      </div>
    </div>
  );
};

export default ToastNotification;