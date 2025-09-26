import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RecentActivity = ({ activities: propActivities }) => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // Generate mock recent activities
  const generateMockActivities = () => {
    const mockActivities = [
      {
        id: '1',
        type: 'user_created',
        user: 'Admin',
        description: 'created a new doctor account',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        metadata: 'Dr. Sarah Johnson'
      },
      {
        id: '2',
        type: 'appointment_booked',
        user: 'John Smith',
        description: 'booked an appointment',
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        metadata: 'Cardiology - Tomorrow 2:00 PM'
      },
      {
        id: '3',
        type: 'user_updated',
        user: 'Dr. Michael Brown',
        description: 'updated profile information',
        timestamp: new Date(Date.now() - 32 * 60 * 1000), // 32 minutes ago
        metadata: 'Contact details'
      },
      {
        id: '4',
        type: 'backup_completed',
        user: 'System',
        description: 'completed automated backup',
        timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        metadata: '2.3 GB'
      },
      {
        id: '5',
        type: 'appointment_cancelled',
        user: 'Emma Wilson',
        description: 'cancelled appointment',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        metadata: 'Dermatology - Today 3:30 PM'
      },
      {
        id: '6',
        type: 'login',
        user: 'Dr. David Lee',
        description: 'logged into the system',
        timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
        metadata: 'Mobile app'
      },
      {
        id: '7',
        type: 'user_deleted',
        user: 'Admin',
        description: 'removed inactive patient account',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        metadata: 'Patient ID: 12345'
      },
      {
        id: '8',
        type: 'system_update',
        user: 'System',
        description: 'applied security patch',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        metadata: 'Version 2.1.4'
      },
      {
        id: '9',
        type: 'appointment_booked',
        user: 'Lisa Anderson',
        description: 'booked an appointment',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        metadata: 'Pediatrics - Next week'
      },
      {
        id: '10',
        type: 'logout',
        user: 'Dr. Jennifer White',
        description: 'logged out of the system',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        metadata: 'Desktop app'
      }
    ];

    return mockActivities;
  };

  useEffect(() => {
    // Simulate loading
    setLoading(true);
    setTimeout(() => {
      const mockData = generateMockActivities();
      setActivities(propActivities || mockData);
      setLoading(false);
    }, 500);
  }, [propActivities]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_created':
        return 'UserPlus';
      case 'user_updated':
        return 'UserCheck';
      case 'user_deleted':
        return 'UserX';
      case 'appointment_booked':
        return 'Calendar';
      case 'appointment_cancelled':
        return 'CalendarX';
      case 'system_update':
        return 'Settings';
      case 'backup_completed':
        return 'Database';
      case 'login':
        return 'LogIn';
      case 'logout':
        return 'LogOut';
      default:
        return 'Activity';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'user_created': case 'appointment_booked': case 'backup_completed': case 'login':
        return 'text-green-600 bg-green-100';
      case 'user_deleted': case 'appointment_cancelled':
        return 'text-red-600 bg-red-100';
      case 'user_updated': case 'system_update': case 'logout':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleViewAll = () => {
    // Navigate to activity logs page or show modal
    navigate('/admin/activity-logs');
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      const mockData = generateMockActivities();
      setActivities(mockData);
      setLoading(false);
    }, 500);
  };

  const displayedActivities = showAll ? activities : activities.slice(0, 5);

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">Recent Activity</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">Loading activities...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">Recent Activity</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-6 w-6 p-0"
          >
            <Icon name="RefreshCw" size={12} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewAll}
            className="text-xs text-primary hover:text-primary/80"
          >
            View All
          </Button>
        </div>
      </div>
      
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {displayedActivities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
              <Icon name={getActivityIcon(activity.type)} size={12} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground">
                <span className="font-medium">{activity.user}</span> {activity.description}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(activity.timestamp)}
                </span>
                {activity.metadata && (
                  <>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {activity.metadata}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {activities.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Icon name="Clock" size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activities</p>
          </div>
        )}
      </div>

      {activities.length > 5 && !showAll && (
        <div className="mt-3 pt-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(true)}
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            Show {activities.length - 5} more activities
            <Icon name="ChevronDown" size={12} className="ml-1" />
          </Button>
        </div>
      )}

      {showAll && (
        <div className="mt-3 pt-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(false)}
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            Show less
            <Icon name="ChevronUp" size={12} className="ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;