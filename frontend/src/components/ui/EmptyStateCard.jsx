import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from '../ui/Button';

const EmptyStateCard = ({ 
  title, 
  description, 
  actionText = "Complete Profile", 
  actionLink = "/profile",
  icon = "User",
  showProfileReminder = true 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
          <Icon name={icon} size={24} className="text-gray-400" />
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {title}
        </h3>
        
        <p className="text-sm text-gray-500 mb-4">
          {description}
        </p>
        
        {showProfileReminder && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
            <div className="flex items-center">
              <Icon name="Info" size={16} className="text-blue-400 mr-2" />
              <p className="text-xs text-blue-800">
                Complete your profile to access all features
              </p>
            </div>
          </div>
        )}
        
        <Link to={actionLink}>
          <Button size="sm" className="text-sm">
            {actionText}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default EmptyStateCard;