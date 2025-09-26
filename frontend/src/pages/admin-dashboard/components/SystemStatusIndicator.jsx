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
    <div className="flex items-center flex-wrap gap-3">
      {/* System Status Header */}
      <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
        <Icon name="Activity" size={16} />
        <span>System Status:</span>
      </div>

      {/* Overall System Status - Prominent */}
      <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm border ${getStatusBadge(systemStatus.overall)} ${systemStatus.overall === 'operational' ? 'border-green-200' : systemStatus.overall === 'degraded' ? 'border-yellow-200' : 'border-red-200'}`}>
        <Icon name={getStatusIcon(systemStatus.overall)} size={14} />
        <span className="capitalize">{systemStatus.overall}</span>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-border"></div>

      {/* Services Row */}
      <div className="flex items-center space-x-2">
        {services.map((service) => (
          <div 
            key={service.key} 
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:shadow-sm ${
              systemStatus[service.key] === 'operational' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : systemStatus[service.key] === 'degraded' 
                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
            title={`${service.name}: ${systemStatus[service.key]}`}
          >
            <Icon name={getStatusIcon(systemStatus[service.key])} size={12} />
            <span className="hidden sm:inline">{service.name}</span>
            <span className="sm:hidden">{service.name.split(' ')[0]}</span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-border"></div>

      {/* Metrics */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700">
          <Icon name="TrendingUp" size={12} />
          <span className="hidden sm:inline">Uptime:</span>
          <span className="font-semibold">{uptime}</span>
        </div>

        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-gray-50 border border-gray-200 text-xs text-gray-600">
          <Icon name="Clock" size={12} />
          <span className="hidden sm:inline">Updated:</span>
          <span>{lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
};

export default SystemStatusIndicator;