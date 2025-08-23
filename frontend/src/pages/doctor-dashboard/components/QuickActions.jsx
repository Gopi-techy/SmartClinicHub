import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickActions = ({ onAddAppointment, onUpdateAvailability, onCreatePrescription, onEmergencyMode }) => {
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const quickActions = [
    {
      id: 'add-appointment',
      label: 'Add Appointment',
      icon: 'CalendarPlus',
      action: onAddAppointment,
      variant: 'default',
      description: 'Schedule new patient appointment'
    },
    {
      id: 'update-availability',
      label: 'Update Availability',
      icon: 'Calendar',
      action: onUpdateAvailability,
      variant: 'outline',
      description: 'Modify your schedule'
    },
    {
      id: 'create-prescription',
      label: 'Create Prescription',
      icon: 'Pill',
      action: onCreatePrescription,
      variant: 'outline',
      description: 'Write new prescription'
    },
    {
      id: 'emergency-mode',
      label: 'Emergency Mode',
      icon: 'AlertTriangle',
      action: onEmergencyMode,
      variant: 'destructive',
      description: 'Activate emergency protocols'
    }
  ];

  const secondaryActions = [
    {
      id: 'patient-search',
      label: 'Patient Search',
      icon: 'Search',
      action: () => {},
      description: 'Find patient records'
    },
    {
      id: 'lab-results',
      label: 'Lab Results',
      icon: 'FileText',
      action: () => {},
      description: 'Review test results'
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: 'MessageSquare',
      action: () => {},
      description: 'Check patient messages',
      badge: 3
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: 'BarChart3',
      action: () => {},
      description: 'Generate practice reports'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Primary Actions */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="Zap" size={20} className="mr-2 text-primary" />
          Quick Actions
        </h3>
        
        <div className="grid grid-cols-1 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant}
              fullWidth
              iconName={action.icon}
              iconPosition="left"
              onClick={action.action}
              className="justify-start h-auto py-3"
            >
              <div className="flex flex-col items-start ml-2">
                <span className="font-medium">{action.label}</span>
                <span className="text-xs opacity-70 font-normal">
                  {action.description}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Secondary Actions */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center">
            <Icon name="Grid3X3" size={20} className="mr-2 text-primary" />
            More Actions
          </h3>
          <Button
            variant="ghost"
            size="sm"
            iconName={showQuickMenu ? "ChevronUp" : "ChevronDown"}
            onClick={() => setShowQuickMenu(!showQuickMenu)}
          />
        </div>

        {showQuickMenu && (
          <div className="grid grid-cols-1 gap-2">
            {secondaryActions.map((action) => (
              <button
                key={action.id}
                onClick={action.action}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-healthcare text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon name={action.icon} size={16} className="text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground text-sm">{action.label}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </div>
                {action.badge && (
                  <span className="bg-error text-error-foreground text-xs rounded-full px-2 py-1 font-medium">
                    {action.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status Overview */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="Activity" size={20} className="mr-2 text-primary" />
          Today's Overview
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon name="Users" size={16} className="text-primary" />
              <span className="text-sm text-foreground">Patients Seen</span>
            </div>
            <span className="font-semibold text-foreground">8/12</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon name="Clock" size={16} className="text-warning" />
              <span className="text-sm text-foreground">Next Appointment</span>
            </div>
            <span className="font-semibold text-foreground">2:30 PM</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon name="Pill" size={16} className="text-success" />
              <span className="text-sm text-foreground">Prescriptions</span>
            </div>
            <span className="font-semibold text-foreground">5</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon name="MessageSquare" size={16} className="text-accent" />
              <span className="text-sm text-foreground">Unread Messages</span>
            </div>
            <span className="font-semibold text-foreground">3</span>
          </div>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="Phone" size={20} className="mr-2 text-error" />
          Emergency Contacts
        </h3>
        
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-healthcare text-left">
            <div className="flex items-center space-x-3">
              <Icon name="Hospital" size={16} className="text-error" />
              <div>
                <div className="font-medium text-foreground text-sm">Hospital Emergency</div>
                <div className="text-xs text-muted-foreground">Main Hospital Line</div>
              </div>
            </div>
            <Icon name="Phone" size={14} className="text-muted-foreground" />
          </button>
          
          <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-healthcare text-left">
            <div className="flex items-center space-x-3">
              <Icon name="UserCog" size={16} className="text-warning" />
              <div>
                <div className="font-medium text-foreground text-sm">On-Call Doctor</div>
                <div className="text-xs text-muted-foreground">Dr. Johnson</div>
              </div>
            </div>
            <Icon name="Phone" size={14} className="text-muted-foreground" />
          </button>
          
          <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-healthcare text-left">
            <div className="flex items-center space-x-3">
              <Icon name="Shield" size={16} className="text-primary" />
              <div>
                <div className="font-medium text-foreground text-sm">Security</div>
                <div className="text-xs text-muted-foreground">Clinic Security</div>
              </div>
            </div>
            <Icon name="Phone" size={14} className="text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;