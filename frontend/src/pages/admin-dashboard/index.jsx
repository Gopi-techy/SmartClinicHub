import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import RoleBasedHeader from '../../components/ui/RoleBasedHeader';
import AnalyticsChart from './components/AnalyticsChart';
import KPICard from './components/KPICard';
import QuickActions from './components/QuickActions';
import RecentActivity from './components/RecentActivity';
import SystemStatusIndicator from './components/SystemStatusIndicator';
import UserManagementTable from './components/UserManagementTable';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStatus, setSystemStatus] = useState('operational');

  useEffect(() => {
    // Check authentication
    if (!user || userRole !== 'admin') {
      navigate('/login-registration');
      return;
    }

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, [navigate, user, userRole]);

  // State for KPI data
  const [kpiData, setKpiData] = useState([]);

  // State for analytics data
  const [analyticsData, setAnalyticsData] = useState({});

  // State for user management data
  const [users, setUsers] = useState([]);

  // State for recent activities
  const [recentActivities, setRecentActivities] = useState([]);

  const handleUserAction = (action, userId) => {
    console.log(`${action} user:`, userId);
  };

  const handleSystemAction = (action) => {
    console.log(`System action:`, action);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (!user || userRole !== 'admin') {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - SmartClinicHub</title>
        <meta name="description" content="Administrator dashboard for SmartClinicHub - manage users, view analytics, system monitoring, and overall clinic administration." />
        <meta name="keywords" content="admin dashboard, healthcare administration, user management, system analytics, clinic management, healthcare analytics" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <RoleBasedHeader />
      
      {/* Main Content */}
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                  {getGreeting()}, {user.firstName || 'Admin'}!
                </h1>
                <p className="text-muted-foreground">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                <SystemStatusIndicator status={systemStatus} />
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Settings"
                  onClick={() => navigate('/admin/settings')}
                >
                  System Settings
                </Button>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpiData.map((kpi, index) => (
              <KPICard key={index} {...kpi} />
            ))}
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left Column - Analytics */}
            <div className="lg:col-span-2 space-y-6">
              {/* Analytics Charts */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Appointment Trends</h3>
                <AnalyticsChart data={analyticsData.appointments} />
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Revenue Overview</h3>
                <AnalyticsChart data={analyticsData.revenue} />
              </div>
            </div>

            {/* Right Column - Quick Actions & Recent Activity */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <QuickActions />

              {/* Recent Activity */}
              <RecentActivity activities={recentActivities} />
            </div>
          </div>

          {/* User Management */}
          <div className="mb-8">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">User Management</h3>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="UserPlus"
                  onClick={() => navigate('/admin/users/new')}
                >
                  Add User
                </Button>
              </div>
              <UserManagementTable 
                users={users}
                onUserAction={handleUserAction}
              />
            </div>
          </div>

          {/* System Alerts */}
          <div className="mb-8">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center">
                    <Icon name="AlertTriangle" size={24} className="text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">System Monitoring</h3>
                    <p className="text-sm text-muted-foreground">
                      Monitor system health and performance metrics
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  iconName="Shield"
                  iconPosition="left"
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  View Logs
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default AdminDashboard;