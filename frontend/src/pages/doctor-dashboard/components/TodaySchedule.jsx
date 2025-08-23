import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const TodaySchedule = ({ appointments, onAppointmentClick, onReschedule }) => {
  const [expandedCard, setExpandedCard] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success text-success-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'completed':
        return 'bg-muted text-muted-foreground';
      case 'cancelled':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getVisitTypeIcon = (type) => {
    switch (type) {
      case 'consultation':
        return 'Stethoscope';
      case 'follow-up':
        return 'RotateCcw';
      case 'emergency':
        return 'AlertTriangle';
      case 'routine':
        return 'Calendar';
      default:
        return 'User';
    }
  };

  const toggleCard = (appointmentId) => {
    setExpandedCard(expandedCard === appointmentId ? null : appointmentId);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground flex items-center">
          <Icon name="Clock" size={24} className="mr-2 text-primary" />
          Today's Schedule
        </h2>
        <div className="text-sm text-muted-foreground">
          {appointments.length} appointments
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {appointments.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="Calendar" size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No appointments scheduled for today</p>
          </div>
        ) : (
          appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="border border-border rounded-lg p-4 hover:shadow-healthcare transition-healthcare cursor-pointer"
              onClick={() => toggleCard(appointment.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Icon name={getVisitTypeIcon(appointment.visitType)} size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{appointment.patientName}</h3>
                      <p className="text-sm text-muted-foreground">{appointment.time}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {appointment.duration} min
                    </span>
                    <span className="text-sm text-muted-foreground capitalize">
                      {appointment.visitType}
                    </span>
                  </div>

                  <p className="text-sm text-foreground mb-2">
                    <span className="font-medium">Reason:</span> {appointment.reason}
                  </p>

                  {appointment.preparationNotes && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Notes:</span> {appointment.preparationNotes}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <Icon 
                    name={expandedCard === appointment.id ? "ChevronUp" : "ChevronDown"} 
                    size={16} 
                    className="text-muted-foreground"
                  />
                  {appointment.isUrgent && (
                    <div className="w-2 h-2 bg-error rounded-full"></div>
                  )}
                </div>
              </div>

              {expandedCard === appointment.id && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-1 gap-3 mb-4">
                    <div>
                      <span className="text-sm font-medium text-foreground">Patient ID:</span>
                      <span className="text-sm text-muted-foreground ml-2">{appointment.patientId}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground">Contact:</span>
                      <span className="text-sm text-muted-foreground ml-2">{appointment.contact}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground">Last Visit:</span>
                      <span className="text-sm text-muted-foreground ml-2">{appointment.lastVisit}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      iconName="User"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick(appointment);
                      }}
                    >
                      View Patient
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      iconName="Calendar"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReschedule(appointment);
                      }}
                    >
                      Reschedule
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      iconName="MessageSquare"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Message
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TodaySchedule;