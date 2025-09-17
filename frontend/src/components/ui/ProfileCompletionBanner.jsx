import React from 'react';
import { Link } from 'react-router-dom';
import { checkProfileCompletion, getProfileStatusMessage, getNextSuggestedFields } from '../../utils/profileUtils';

const ProfileCompletionBanner = ({ user, className = '' }) => {
  if (!user) return null;

  const profileData = checkProfileCompletion(user);
  const statusMessage = getProfileStatusMessage(profileData);
  const suggestedFields = getNextSuggestedFields(profileData.missingFields);

  // Don't show banner if profile is complete
  if (profileData.isComplete) return null;

  const getStatusColor = (type) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getProgressBarColor = (percentage) => {
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getButtonColor = (type) => {
    switch (type) {
      case 'error':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      default:
        return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
  };



  return (
    <div className={`rounded-lg border-2 border-dashed p-4 ${getStatusColor(statusMessage.type)} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <div className="flex-shrink-0">
              {statusMessage.type === 'error' && (
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {statusMessage.type === 'warning' && (
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {statusMessage.type === 'info' && (
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <h3 className="ml-2 text-sm font-medium">{statusMessage.title}</h3>
          </div>
          
          <p className="text-sm mb-3">{statusMessage.message}</p>
          
          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium">Profile Completion</span>
              <span className="text-xs font-medium">{profileData.completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(profileData.completionPercentage)}`}
                style={{ width: `${profileData.completionPercentage}%` }}
              ></div>
            </div>
          </div>
          
          {/* Missing Fields */}
          {suggestedFields.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium mb-1">Next steps:</p>
              <div className="flex flex-wrap gap-1">
                {suggestedFields.map((field, index) => (
                  <span 
                    key={index}
                    className="inline-block px-2 py-1 text-xs bg-white bg-opacity-50 rounded-md"
                  >
                    {field}
                  </span>
                ))}
                {profileData.missingFields.length > suggestedFields.length && (
                  <span className="inline-block px-2 py-1 text-xs bg-white bg-opacity-50 rounded-md">
                    +{profileData.missingFields.length - suggestedFields.length} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0 ml-4">
          <Link
            to="/profile"
            className={`inline-flex items-center px-3 py-2 text-xs font-medium rounded-md transition-colors ${getButtonColor(statusMessage.type)}`}
          >
            Complete Profile
            <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
      
      {/* Dismissible option for less critical states */}
      {statusMessage.type !== 'error' && (
        <div className="mt-2 pt-2 border-t border-current border-opacity-20">
          <button className="text-xs opacity-70 hover:opacity-100 transition-opacity">
            Remind me later
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileCompletionBanner;