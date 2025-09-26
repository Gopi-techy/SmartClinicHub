import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const QuickActions = ({ onAction, onDoctorVerificationClick }) => {
  const navigate = useNavigate();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      // Here you would implement actual report generation
      console.log('Generating comprehensive system report...');
      alert('Report generated successfully! Check your downloads folder.');
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
    onAction && onAction('generate-report');
  };

  const handleBackupData = async () => {
    setIsBackingUp(true);
    try {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 5000));
      // Here you would implement actual backup functionality
      console.log('Creating system backup...');
      alert('System backup completed successfully!');
    } catch (error) {
      console.error('Backup failed:', error);
      alert('Backup failed. Please try again.');
    } finally {
      setIsBackingUp(false);
    }
    onAction && onAction('backup');
  };

  const handleMaintenanceMode = () => {
    const newMode = !maintenanceMode;
    setMaintenanceMode(newMode);
    if (newMode) {
      alert('Maintenance mode activated. System access will be restricted.');
    } else {
      alert('Maintenance mode deactivated. System is now fully operational.');
    }
    onAction && onAction('maintenance', { enabled: newMode });
  };

  const handleSystemSettings = () => {
    navigate('/admin/settings');
    onAction && onAction('system-settings');
  };

  const handleAddUser = () => {
    navigate('/admin/users/new');
    onAction && onAction('add-user');
  };

  const quickActions = [
    {
      id: 'doctor-verification',
      label: 'Doctor Verification',
      icon: 'Shield',
      variant: 'default',
      description: 'Review and verify doctor credentials',
      action: () => onDoctorVerificationClick && onDoctorVerificationClick(),
      priority: 'high'
    },
    {
      id: 'add-user',
      label: 'Add User',
      icon: 'UserPlus',
      variant: 'outline',
      description: 'Create new user accounts',
      action: handleAddUser,
      priority: 'high'
    },
    {
      id: 'generate-report',
      label: 'Generate Reports',
      icon: 'FileText',
      variant: 'outline',
      description: 'Create system analytics reports',
      loading: isGeneratingReport,
      action: handleGenerateReport,
      priority: 'medium'
    },
    {
      id: 'system-settings',
      label: 'System Settings',
      icon: 'Settings',
      variant: 'outline',
      description: 'Configure system parameters',
      action: handleSystemSettings,
      priority: 'medium'
    },
    {
      id: 'backup',
      label: 'Backup Data',
      icon: 'Database',
      variant: 'outline',
      description: 'Create system data backup',
      loading: isBackingUp,
      action: handleBackupData,
      priority: 'low'
    },
    {
      id: 'maintenance',
      label: maintenanceMode ? 'Exit Maintenance' : 'Maintenance Mode',
      icon: 'Wrench',
      variant: maintenanceMode ? 'destructive' : 'secondary',
      description: maintenanceMode ? 'Exit maintenance mode' : 'Enable maintenance mode',
      action: handleMaintenanceMode,
      priority: 'low'
    }
  ];

  return (
    <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">Quick Actions</h3>
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {quickActions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant}
            size="sm"
            onClick={action.action}
            loading={action.loading}
            disabled={action.loading}
            className={`h-8 text-xs justify-start ${
              maintenanceMode && action.id === 'maintenance' ? 'text-destructive' : ''
            }`}
          >
            <Icon name={action.icon} size={14} className="mr-1" />
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;