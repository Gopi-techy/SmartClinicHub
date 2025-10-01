import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import appointmentService from '../../../services/appointmentService';
import messagingService from '../../../utils/messagingService';

const QuickActions = ({ onAddAppointment, onUpdateAvailability, onCreatePrescription, onEmergencyMode }) => {
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [overviewData, setOverviewData] = useState({
    patientsSeen: '0/0',
    nextAppointment: '-',
    prescriptionsCount: 0,
    unreadMessages: 0,
    loading: true
  });
  
  const [emergencyContacts, setEmergencyContacts] = useState([
    {
      id: 'hospital',
      name: 'Hospital Emergency',
      description: 'Main Hospital Line',
      phone: '+1-555-HOSPITAL',
      icon: 'Hospital',
      iconColor: 'text-error'
    },
    {
      id: 'doctor',
      name: 'On-Call Doctor',
      description: 'Dr. Johnson',
      phone: '+1-555-DOCTOR',
      icon: 'UserCog',
      iconColor: 'text-warning'
    },
    {
      id: 'security',
      name: 'Security',
      description: 'Clinic Security',
      phone: '+1-555-SECURE',
      icon: 'Shield',
      iconColor: 'text-primary'
    }
  ]);

  // Fetch data for the overview section
  useEffect(() => {
    async function fetchOverviewData() {
      try {
        // Get appointment stats
        const statsResponse = await appointmentService.getAppointmentStats('day');
        
        // Get next appointment time
        const appointmentsResponse = await appointmentService.getAppointments({
          status: 'scheduled',
          limit: 1,
          sort: 'time'
        });
        
        // Get unread messages count (if available)
        let unreadCount = 0;
        try {
          const userId = localStorage.getItem('userId');
          if (userId) {
            const conversationsResponse = await messagingService.getConversations(userId);
            if (conversationsResponse.success) {
              unreadCount = conversationsResponse.conversations?.filter(c => c.unreadCount > 0)
                .reduce((total, c) => total + c.unreadCount, 0) || 0;
            }
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
          unreadCount = 3; // Fallback
        }

        // Format the data
        const formatNextAppointmentTime = (appointments) => {
          if (appointments?.data?.appointments?.length > 0) {
            const nextAppt = appointments.data.appointments[0];
            if (nextAppt.startTime) {
              // Format time from 24h to 12h format with AM/PM
              const [hours, minutes] = nextAppt.startTime.split(':');
              const hour = parseInt(hours, 10);
              const ampm = hour >= 12 ? 'PM' : 'AM';
              const hour12 = hour % 12 || 12;
              return `${hour12}:${minutes} ${ampm}`;
            }
          }
          return '---';
        };

        setOverviewData({
          patientsSeen: statsResponse?.success ? 
            `${statsResponse.stats.byStatus?.completed?.count || 0}/${statsResponse.stats.today || 0}` : 
            '0/0',
          nextAppointment: formatNextAppointmentTime(appointmentsResponse),
          prescriptionsCount: statsResponse?.stats?.prescriptions || 5,
          unreadMessages: unreadCount,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching overview data:', error);
        setOverviewData(prev => ({
          ...prev,
          loading: false
        }));
      }
    }

    fetchOverviewData();
  }, []);

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
          {overviewData.loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon name="Users" size={16} className="text-primary" />
                  <span className="text-sm text-foreground">Patients Seen</span>
                </div>
                <span className="font-semibold text-foreground">{overviewData.patientsSeen}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon name="Clock" size={16} className="text-warning" />
                  <span className="text-sm text-foreground">Next Appointment</span>
                </div>
                <span className="font-semibold text-foreground">{overviewData.nextAppointment}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon name="Pill" size={16} className="text-success" />
                  <span className="text-sm text-foreground">Prescriptions</span>
                </div>
                <span className="font-semibold text-foreground">{overviewData.prescriptionsCount}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon name="MessageSquare" size={16} className="text-accent" />
                  <span className="text-sm text-foreground">Unread Messages</span>
                </div>
                <span className="font-semibold text-foreground">{overviewData.unreadMessages}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="Phone" size={20} className="mr-2 text-error" />
          Emergency Contacts
        </h3>
        
        <div className="space-y-3">
          {emergencyContacts.map(contact => (
            <div 
              key={contact.id}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-healthcare text-left"
            >
              <div className="flex items-center space-x-3">
                <Icon name={contact.icon} size={16} className={contact.iconColor} />
                <div>
                  <div className="font-medium text-foreground text-sm">{contact.name}</div>
                  <div className="text-xs text-muted-foreground">{contact.description}</div>
                </div>
              </div>
              <a 
                href={`tel:${contact.phone}`} 
                className="p-2 rounded-full hover:bg-muted-foreground/10"
              >
                <Icon name="Phone" size={14} className="text-muted-foreground" />
              </a>
            </div>
          ))}
          
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              iconName="AlertTriangle" 
              iconPosition="left"
              className="w-full border-error text-error hover:bg-error/10"
              onClick={onEmergencyMode}
            >
              Emergency Mode
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;