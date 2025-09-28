import React, { useState } from 'react';
import Icon from '../AppIcon';

const MedicalChatButton = ({ onClick, isActive, unreadCount = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Notification Badge */}
      {unreadCount > 0 && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center z-10 animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </div>
      )}
      
      {/* Chat Button */}
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group relative w-16 h-16 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-primary/50 ${
          isActive 
            ? 'bg-primary text-primary-foreground shadow-primary/25' 
            : 'bg-white dark:bg-gray-800 text-primary shadow-gray-300 dark:shadow-gray-700 hover:bg-primary hover:text-primary-foreground'
        }`}
      >
        {/* Pulse Animation Ring */}
        <div className={`absolute inset-0 rounded-full transition-opacity duration-300 ${
          isActive ? 'animate-ping bg-primary/20' : 'opacity-0 group-hover:opacity-100 group-hover:animate-ping bg-primary/20'
        }`}></div>
        
        {/* Icon */}
        <div className="relative flex items-center justify-center h-full w-full">
          {isActive ? (
            <Icon name="X" size={24} />
          ) : (
            <Icon name="MessageCircle" size={24} />
          )}
        </div>
      </button>
      
      {/* Tooltip */}
      {isHovered && !isActive && (
        <div className="absolute bottom-full right-0 mb-3 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg whitespace-nowrap transform transition-all duration-200 opacity-95">
          Ask Medical Questions
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
        </div>
      )}
    </div>
  );
};

export default MedicalChatButton;