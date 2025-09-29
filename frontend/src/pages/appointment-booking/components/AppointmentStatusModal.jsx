import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AppointmentStatusModal = ({ isOpen, onClose, status, appointmentData }) => {
  if (!isOpen) return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: 'CheckCircle',
          iconColor: 'text-green-500',
          title: 'Appointment Scheduled Successfully!',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          message: 'Your appointment has been confirmed and scheduled.',
          actionLabel: 'View My Appointments'
        };
      case 'pending':
        return {
          icon: 'Clock',
          iconColor: 'text-yellow-500',
          title: 'Appointment Request Submitted',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          message: 'Your appointment request is pending confirmation from the doctor.',
          actionLabel: 'Track Status'
        };
      case 'conflict':
        return {
          icon: 'AlertTriangle',
          iconColor: 'text-orange-500',
          title: 'Time Slot Not Available',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          message: 'The selected time slot is no longer available. Please choose a different time.',
          actionLabel: 'Select New Time'
        };
      case 'error':
        return {
          icon: 'XCircle',
          iconColor: 'text-red-500',
          title: 'Booking Failed',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          message: 'We encountered an error while booking your appointment. Please try again.',
          actionLabel: 'Try Again'
        };
      default:
        return {
          icon: 'Info',
          iconColor: 'text-blue-500',
          title: 'Appointment Information',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          message: 'Please review your appointment details.',
          actionLabel: 'Continue'
        };
    }
  };

  const config = getStatusConfig();
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full mx-auto">
        {/* Header */}
        <div className={`p-6 rounded-t-lg ${config.bgColor} ${config.borderColor} border-b`}>
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center`}>
              <Icon name={config.icon} size={24} className={config.iconColor} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{config.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{config.message}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {appointmentData && status === 'success' && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-3 flex items-center">
                  <Icon name="Calendar" size={16} className="mr-2" />
                  Appointment Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Booking Reference:</span>
                    <span className="font-medium text-foreground">{appointmentData.bookingReference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Doctor:</span>
                    <span className="font-medium text-foreground">{appointmentData.doctorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium text-foreground">{formatDate(appointmentData.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium text-foreground">{formatTime(appointmentData.time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium text-foreground">
                      {appointmentData.mode === 'online' ? 'Telehealth' : 'In-Person'}
                    </span>
                  </div>
                  {appointmentData.meetingUrl && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Meeting URL:</span>
                      <a 
                        href={appointmentData.meetingUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        Join Meeting
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-primary/5 rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2 flex items-center">
                  <Icon name="Info" size={16} className="mr-2 text-primary" />
                  What's Next?
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• You'll receive email and SMS confirmations shortly</li>
                  <li>• Add this appointment to your calendar</li>
                  <li>• Arrive 15 minutes early for in-person visits</li>
                  {appointmentData.mode === 'online' && (
                    <li>• Test your camera and microphone before the appointment</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {status === 'conflict' && appointmentData && (
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2">Requested Slot:</h4>
                <p className="text-sm text-muted-foreground">
                  {formatDate(appointmentData.date)} at {formatTime(appointmentData.time)}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Another patient may have booked this slot while you were completing your booking. 
                Please select a different time slot.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-border">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={onClose}
            >
              {status === 'success' ? 'Close' : 'Cancel'}
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                if (status === 'success') {
                  // Navigate to appointments or dashboard
                  window.location.href = '/patient-dashboard';
                } else if (status === 'conflict') {
                  onClose();
                  // Could trigger a callback to go back to time selection
                } else {
                  onClose();
                }
              }}
            >
              {config.actionLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentStatusModal;