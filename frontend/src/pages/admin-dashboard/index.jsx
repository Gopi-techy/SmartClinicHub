import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import RoleBasedHeader from '../../components/ui/RoleBasedHeader';
import AnalyticsChart from './components/AnalyticsChart';
import KPICard from './components/KPICard';
import QuickActions from './components/QuickActions';
import RecentActivity from './components/RecentActivity';
import SystemStatusIndicator from './components/SystemStatusIndicator';
import UserManagementTable from './components/UserManagementTable';
import PatientManagement from './components/PatientManagement';
import DoctorManagement from './components/DoctorManagement';
import DoctorVerification from './DoctorVerification';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStatus, setSystemStatus] = useState('operational');
  
  // Get current view based on URL path
  const getCurrentView = () => {
    if (location.pathname.includes('/doctor-verification')) {
      return 'doctor-verification';
    } else if (location.pathname.includes('/user-management')) {
      return 'user-management';
    } else if (location.pathname.includes('/patient-management')) {
      return 'patient-management';
    } else if (location.pathname.includes('/doctor-management')) {
      return 'doctor-management';
    }
    return 'dashboard';
  };
  
  const activeView = getCurrentView();

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
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-shrink-0">
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
              <div className="flex items-center justify-end flex-1 ml-8">
                <div className="ml-auto">
                  <SystemStatusIndicator status={systemStatus} />
                </div>
              </div>
            </div>
          </div>

          {/* Page Title based on current view */}
          <div className="mb-8">
            <div className="flex items-center space-x-2">
              {activeView === 'dashboard' && (
                <>
                  <Icon name="LayoutDashboard" size={20} className="text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Dashboard Overview</h2>
                </>
              )}
              {activeView === 'doctor-verification' && (
                <>
                  <Icon name="Shield" size={20} className="text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Doctor Verification</h2>
                </>
              )}
              {activeView === 'user-management' && (
                <>
                  <Icon name="Users" size={20} className="text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">User Management</h2>
                </>
              )}
              {activeView === 'patient-management' && (
                <>
                  <Icon name="Heart" size={20} className="text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Patient Management</h2>
                </>
              )}
              {activeView === 'doctor-management' && (
                <>
                  <Icon name="Stethoscope" size={20} className="text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Doctor Management</h2>
                </>
              )}
            </div>
          </div>

          {/* Conditional Content Based on Active View */}
          {activeView === 'dashboard' && (
            <>
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
                  <QuickActions onDoctorVerificationClick={() => setActiveView('doctor-verification')} />

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
            </>
          )}

          {activeView === 'doctor-verification' && (
            <DoctorVerification />
          )}

          {activeView === 'user-management' && (
            <div className="space-y-6">
              <UserManagementTable users={users} onUserAction={handleUserAction} />
            </div>
          )}

          {activeView === 'patient-management' && (
            <PatientManagement />
          )}

          {activeView === 'doctor-management' && (
            <DoctorManagement />
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default AdminDashboard;