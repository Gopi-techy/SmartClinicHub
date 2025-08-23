import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const SystemStatusIndicator = () => {
  const [systemStatus, setSystemStatus] = useState({
    overall: 'operational',
    database: 'operational',
    api: 'operational',
    storage: 'operational',
    notifications: 'degraded'
  });

  const [uptime, setUptime] = useState('99.9%');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational':
        return 'text-success';
      case 'degraded':
        return 'text-warning';
      case 'outage':
        return 'text-error';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational':
        return 'CheckCircle';
      case 'degraded':
        return 'AlertTriangle';
      case 'outage':
        return 'XCircle';
      default:
        return 'Clock';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'operational':
        return 'bg-success text-success-foreground';
      case 'degraded':
        return 'bg-warning text-warning-foreground';
      case 'outage':
        return 'bg-error text-error-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const services = [
    { name: 'Database', key: 'database' },
    { name: 'API Services', key: 'api' },
    { name: 'File Storage', key: 'storage' },
    { name: 'Notifications', key: 'notifications' }
  ];

  return (
    <div className="bg-card rounded-lg p-4 shadow-healthcare border border-border">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-foreground">System Status</h4>
        <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(systemStatus.overall)}`}>
          <Icon name={getStatusIcon(systemStatus.overall)} size={12} />
          <span className="capitalize">{systemStatus.overall}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Uptime</span>
          <span className="font-medium text-foreground">{uptime}</span>
        </div>

        {services.map((service) => (
          <div key={service.key} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{service.name}</span>
            <div className={`flex items-center space-x-1 ${getStatusColor(systemStatus[service.key])}`}>
              <Icon name={getStatusIcon(systemStatus[service.key])} size={14} />
              <span className="capitalize">{systemStatus[service.key]}</span>
            </div>
          </div>
        ))}

        <div className="pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatusIndicator;