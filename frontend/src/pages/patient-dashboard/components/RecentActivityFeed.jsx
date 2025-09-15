import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RecentActivityFeed = ({ activities = [] }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'appointment':
        return 'Calendar';
      case 'prescription':
        return 'Pill';
      case 'document':
        return 'FileText';
      case 'test_result':
        return 'Activity';
      case 'payment':
        return 'CreditCard';
      case 'message':
        return 'MessageSquare';
      default:
        return 'Bell';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'appointment':
        return 'bg-primary/10 text-primary';
      case 'prescription':
        return 'bg-accent/10 text-accent';
      case 'document':
        return 'bg-secondary/10 text-secondary';
      case 'test_result':
        return 'bg-success/10 text-success';
      case 'payment':
        return 'bg-warning/10 text-warning';
      case 'message':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border shadow-healthcare">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center">
            <Icon name="Clock" size={24} className="text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
            <p className="text-sm text-muted-foreground">Your latest healthcare updates</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" iconName="MoreHorizontal" />
      </div>

      <div className="space-y-4 mb-6">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="Inbox" size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <div key={index} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                <Icon name={getActivityIcon(activity.type)} size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-1">{activity.title}</p>
                    <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>{formatTimeAgo(activity.timestamp)}</span>
                      {activity.status && (
                        <span className="px-2 py-1 bg-muted rounded-full">{activity.status}</span>
                      )}
                    </div>
                  </div>
                  {activity.actionable && (
                    <Button variant="ghost" size="xs" iconName="ChevronRight" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-center">
        <Button variant="outline" size="sm" iconName="Eye" iconPosition="left">
          View All Activity
        </Button>
      </div>
    </div>
  );
};

export default RecentActivityFeed;