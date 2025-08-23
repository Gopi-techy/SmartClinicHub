import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const HealthMetricsCard = ({ metrics }) => {
  const getMetricIcon = (type) => {
    switch (type) {
      case 'blood_pressure':
        return 'Heart';
      case 'heart_rate':
        return 'Activity';
      case 'temperature':
        return 'Thermometer';
      case 'weight':
        return 'Scale';
      case 'blood_sugar':
        return 'Droplets';
      default:
        return 'TrendingUp';
    }
  };

  const getMetricColor = (status) => {
    switch (status) {
      case 'normal':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'critical':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'normal':
        return 'bg-success/10 text-success';
      case 'warning':
        return 'bg-warning/10 text-warning';
      case 'critical':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border shadow-healthcare">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
            <Icon name="TrendingUp" size={24} className="text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Health Metrics</h3>
            <p className="text-sm text-muted-foreground">Latest readings</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" iconName="RefreshCw">
          Sync
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Icon 
                name={getMetricIcon(metric.type)} 
                size={20} 
                className={getMetricColor(metric.status)} 
              />
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(metric.status)}`}>
                {metric.status}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{metric.name}</p>
              <p className="text-lg font-bold text-foreground">{metric.value}</p>
              <p className="text-xs text-muted-foreground">{metric.lastUpdated}</p>
            </div>
            {metric.trend && (
              <div className="flex items-center mt-2">
                <Icon 
                  name={metric.trend === 'up' ? 'TrendingUp' : metric.trend === 'down' ? 'TrendingDown' : 'Minus'} 
                  size={14} 
                  className={metric.trend === 'up' ? 'text-success' : metric.trend === 'down' ? 'text-destructive' : 'text-muted-foreground'} 
                />
                <span className="text-xs text-muted-foreground ml-1">{metric.change}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          size="sm"
          iconName="Plus"
          iconPosition="left"
          className="flex-1"
        >
          Add Reading
        </Button>
        <Button
          variant="outline"
          size="sm"
          iconName="BarChart3"
          iconPosition="left"
          className="flex-1"
        >
          View Trends
        </Button>
        <Button
          variant="outline"
          size="sm"
          iconName="Download"
          iconPosition="left"
          className="flex-1"
        >
          Export Data
        </Button>
      </div>
    </div>
  );
};

export default HealthMetricsCard;