import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickActionsCard = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      id: 'book-appointment',
      title: 'Book Appointment',
      description: 'Schedule your next visit',
      icon: 'Calendar',
      color: 'bg-primary text-primary-foreground',
      action: () => navigate('/appointment-booking')
    },
    {
      id: 'upload-records',
      title: 'Upload Records',
      description: 'Add medical documents',
      icon: 'Upload',
      color: 'bg-accent text-accent-foreground',
      action: () => navigate('/health-records-management')
    },
    {
      id: 'emergency',
      title: 'Emergency',
      description: 'Quick access to help',
      icon: 'AlertTriangle',
      color: 'bg-destructive text-destructive-foreground',
      action: () => {}
    },
    {
      id: 'telemedicine',
      title: 'Video Call',
      description: 'Start virtual consultation',
      icon: 'Video',
      color: 'bg-success text-success-foreground',
      action: () => {}
    }
  ];

  return (
    <div className="bg-card rounded-lg p-6 border border-border shadow-healthcare">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
          <Icon name="Zap" size={24} className="text-secondary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
          <p className="text-sm text-muted-foreground">Common tasks at your fingertips</p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className="group flex-shrink-0 p-4 rounded-lg border border-border hover:border-primary/50 transition-all duration-200 hover:shadow-healthcare-lg hover-scale bg-background min-w-[140px] min-h-[100px]"
          >
            <div className="flex flex-col items-center text-center space-y-2 h-full justify-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform duration-200`}>
                <Icon name={action.icon} size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-foreground text-xs leading-tight whitespace-nowrap">{action.title}</h4>
                <p className="text-xs text-muted-foreground leading-snug text-center">{action.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="sm"
            iconName="MessageSquare"
            iconPosition="left"
            className="w-full h-10 flex items-center justify-center"
          >
            Chat with Support
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="Phone"
            iconPosition="left"
            className="w-full h-10 flex items-center justify-center"
          >
            Call Clinic
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuickActionsCard;