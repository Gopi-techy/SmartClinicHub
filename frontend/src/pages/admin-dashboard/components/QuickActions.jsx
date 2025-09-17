import React, { useState } from 'react';
import Button from '../../../components/ui/Button';


const QuickActions = ({ onAction, onDoctorVerificationClick }) => {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGeneratingReport(false);
    onAction('generate-report');
  };

  const quickActions = [
    {
      id: 'doctor-verification',
      label: 'Doctor Verification',
      icon: 'Shield',
      variant: 'default',
      action: () => onDoctorVerificationClick && onDoctorVerificationClick()
    },
    {
      id: 'add-user',
      label: 'Add User',
      icon: 'UserPlus',
      variant: 'outline',
      action: () => onAction && onAction('add-user')
    },
    {
      id: 'generate-report',
      label: 'Generate Reports',
      icon: 'FileText',
      variant: 'outline',
      loading: isGeneratingReport,
      action: handleGenerateReport
    },
    {
      id: 'system-settings',
      label: 'System Settings',
      icon: 'Settings',
      variant: 'outline',
      action: () => onAction && onAction('system-settings')
    },
    {
      id: 'backup',
      label: 'Backup Data',
      icon: 'Database',
      variant: 'outline',
      action: () => onAction && onAction('backup')
    },
    {
      id: 'maintenance',
      label: 'Maintenance Mode',
      icon: 'Wrench',
      variant: 'secondary',
      action: () => onAction && onAction('maintenance')
    }
  ];

  return (
    <div className="bg-card rounded-lg p-6 shadow-healthcare border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {quickActions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant}
            iconName={action.icon}
            iconPosition="left"
            loading={action.loading}
            onClick={action.action}
            className="justify-start"
            fullWidth
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;