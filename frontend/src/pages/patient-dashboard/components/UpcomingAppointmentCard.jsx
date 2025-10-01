import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const UpcomingAppointmentCard = ({ appointment, onReschedule, onCancel, onBookAppointment }) => {
  if (!appointment) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="text-center py-8">
          <Icon name="Calendar" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Upcoming Appointments</h3>
          <p className="text-muted-foreground mb-4">Schedule your next visit with your healthcare provider</p>
          <Button variant="default" iconName="Plus" iconPosition="left" onClick={onBookAppointment}>
            Book Appointment
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success text-success-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'cancelled':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Format date and time from appointment data
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Not set';
    // Handle both "HH:mm" and "HH:mm:ss" formats
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const minute = minutes || '00';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute} ${ampm}`;
  };

  const displayDate = appointment.date || formatDate(appointment.appointmentDate);
  const displayTime = appointment.time || formatTime(appointment.startTime);
  const displayLocation = appointment.location || appointment.mode || 'Not specified';
  const displayType = appointment.type || 'Consultation';

  // Debug: log the appointment ID
  console.log('UpcomingAppointmentCard - Appointment:', { 
    _id: appointment._id, 
    id: appointment.id,
    full: appointment 
  });

  return (
    <div className="bg-card rounded-lg p-6 border border-border shadow-healthcare">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Icon name="Calendar" size={24} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Next Appointment</h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Appointment ID</p>
          <p className="font-mono text-sm font-medium text-foreground">{appointment._id || appointment.id || 'N/A'}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Icon name="User" size={16} className="text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Doctor</p>
                <p className="font-medium text-foreground">{typeof appointment.doctor === 'object' ? `${appointment.doctor.firstName || appointment.doctor.name || ''} ${appointment.doctor.lastName || ''}`.trim() : appointment.doctor}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Icon name="MapPin" size={16} className="text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium text-foreground">{displayLocation}</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Icon name="Clock" size={16} className="text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date & Time</p>
                <p className="font-medium text-foreground">{displayDate}</p>
                <p className="text-sm text-foreground">{displayTime}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Icon name="Stethoscope" size={16} className="text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium text-foreground">{displayType}</p>
              </div>
            </div>
          </div>
        </div>

        {appointment.notes && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground mb-1">Notes</p>
            <p className="text-sm text-foreground">{appointment.notes}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            iconName="Calendar"
            iconPosition="left"
            onClick={() => onReschedule(appointment.id)}
            className="flex-1"
          >
            Reschedule
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="X"
            iconPosition="left"
            onClick={() => onCancel(appointment._id || appointment.id)}
            className="flex-1 text-destructive hover:text-destructive"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            iconName="MapPin"
            iconPosition="left"
            className="flex-1"
          >
            Get Directions
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpcomingAppointmentCard;