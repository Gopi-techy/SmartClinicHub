import React from 'react';
import Icon from '../../../components/AppIcon';

const BookingLoadingModal = ({ isOpen, message = "Processing your appointment..." }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-sm w-full mx-auto p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Booking Appointment</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span>Checking availability</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <span>Confirming with provider</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            <span>Setting up appointment</span>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mt-6">
          Please don't close this window while we process your booking.
        </p>
      </div>
    </div>
  );
};

export default BookingLoadingModal;