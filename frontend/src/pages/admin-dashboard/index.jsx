import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../utils/authService';
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
  const [kpiData, setKpiData] = useState([
    {
      title: 'Total Users',
      value: '...',
      change: 'Loading...',
      changeType: 'neutral',
      icon: 'Users',
      color: 'primary'
    },
    {
      title: 'Active Users',
      value: '...',
      change: 'Loading...',
      changeType: 'neutral',
      icon: 'UserCheck',
      color: 'success'
    },
    {
      title: 'Total Appointments',
      value: '...',
      change: 'Loading...',
      changeType: 'neutral',
      icon: 'Calendar',
      color: 'primary'
    },
    {
      title: 'Pending Appointments',
      value: '...',
      change: 'Loading...',
      changeType: 'neutral',
      icon: 'Clock',
      color: 'warning'
    }
  ]);
  const [metricsLoading, setMetricsLoading] = useState(true);

  // State for analytics data
  const [analyticsData, setAnalyticsData] = useState({
    appointments: []
  });
  const [appointmentTrendsData, setAppointmentTrendsData] = useState([]);
  const [appointmentTimeRange, setAppointmentTimeRange] = useState('7d');
  const [isExportingAppointments, setIsExportingAppointments] = useState(false);

  // Fetch appointment trends data
  const fetchAppointmentTrends = async (timeRange = '7d') => {
    try {
      // Generate mock data based on time range for now
      // In production, you would fetch this from your API
      const mockData = generateMockAppointmentData(timeRange);
      setAppointmentTrendsData(mockData);
    } catch (error) {
      console.error('Failed to fetch appointment trends:', error);
    }
  };

  // Generate mock appointment data for different time ranges
  const generateMockAppointmentData = (timeRange) => {
    const today = new Date();
    const data = [];
    
    switch (timeRange) {
      case '7d':
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          data.push({
            name: date.toLocaleDateString('en-US', { weekday: 'short' }),
            appointments: Math.floor(Math.random() * 20) + 10,
            completed: Math.floor(Math.random() * 15) + 8,
            cancelled: Math.floor(Math.random() * 5) + 1
          });
        }
        break;
      case '30d':
        for (let i = 29; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          if (i % 5 === 0) { // Show every 5th day
            data.push({
              name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              appointments: Math.floor(Math.random() * 50) + 20,
              completed: Math.floor(Math.random() * 40) + 18,
              cancelled: Math.floor(Math.random() * 10) + 2
            });
          }
        }
        break;
      case '90d':
        for (let i = 89; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          if (i % 15 === 0) { // Show every 15th day
            data.push({
              name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              appointments: Math.floor(Math.random() * 80) + 30,
              completed: Math.floor(Math.random() * 70) + 25,
              cancelled: Math.floor(Math.random() * 15) + 3
            });
          }
        }
        break;
      case '1y':
        for (let i = 11; i >= 0; i--) {
          const date = new Date(today);
          date.setMonth(date.getMonth() - i);
          data.push({
            name: date.toLocaleDateString('en-US', { month: 'short' }),
            appointments: Math.floor(Math.random() * 200) + 100,
            completed: Math.floor(Math.random() * 180) + 85,
            cancelled: Math.floor(Math.random() * 30) + 10
          });
        }
        break;
      default:
        break;
    }
    
    return data;
  };

  // Handle appointment trends export
  const handleExportAppointments = async () => {
    setIsExportingAppointments(true);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create CSV data
      const csvData = appointmentTrendsData.map(item => ({
        Date: item.name,
        'Total Appointments': item.appointments,
        'Completed': item.completed,
        'Cancelled': item.cancelled,
        'Completion Rate': `${((item.completed / item.appointments) * 100).toFixed(1)}%`
      }));
      
      // Convert to CSV format
      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => row[header]).join(','))
      ].join('\n');
      
      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `appointment-trends-${appointmentTimeRange}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log('Appointment trends exported successfully');
    } catch (error) {
      console.error('Failed to export appointment trends:', error);
    } finally {
      setIsExportingAppointments(false);
    }
  };

  // Handle appointment time range change
  const handleAppointmentTimeRangeChange = (newRange) => {
    setAppointmentTimeRange(newRange);
    fetchAppointmentTrends(newRange);
  };

  // Fetch dashboard metrics
  const fetchDashboardMetrics = async () => {
    try {
      setMetricsLoading(true);
      const metricsData = await authService.getDashboardMetrics();
      
      if (metricsData.success && metricsData.data.metrics) {
        const { users, appointments, activity } = metricsData.data.metrics;
        
        // Create KPI cards from real data
        const kpiCards = [
          {
            title: 'Total Users',
            value: users.total.toLocaleString(),
            change: `${users.active} Active Users`,
            changeType: users.active > 0 ? 'increase' : 'neutral',
            icon: 'Users',
            color: 'primary'
          },
          {
            title: 'Active Users',  
            value: users.active.toLocaleString(),
            change: `${users.total - users.active} Inactive`,
            changeType: users.active > (users.total - users.active) ? 'increase' : users.active < (users.total - users.active) ? 'decrease' : 'neutral',
            icon: 'UserCheck',
            color: 'success'
          },
          {
            title: 'Total Appointments',
            value: appointments.total.toLocaleString(),
            change: `${appointments.completed} Completed`,
            changeType: appointments.completed > 0 ? 'increase' : 'neutral',
            icon: 'Calendar',
            color: 'primary'
          },
          {
            title: 'Pending Appointments',
            value: appointments.pending.toLocaleString(),
            change: `${appointments.scheduled} Scheduled`,
            changeType: appointments.pending === 0 ? 'neutral' : appointments.pending > 5 ? 'decrease' : 'increase',
            icon: 'Clock',
            color: appointments.pending > 10 ? 'warning' : 'success'
          }
        ];
        
        setKpiData(kpiCards);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
      // Fallback to default metrics
      setKpiData([
        {
          title: 'Total Users',
          value: '0',
          change: 'No data',
          changeType: 'neutral',
          icon: 'Users',
          color: 'primary'
        },
        {
          title: 'Active Users',
          value: '0',
          change: 'No data',
          changeType: 'neutral',
          icon: 'UserCheck',
          color: 'success'
        },
        {
          title: 'Total Appointments',
          value: '0',
          change: 'No data',
          changeType: 'neutral',
          icon: 'Calendar',
          color: 'primary'
        },
        {
          title: 'Pending Appointments',
          value: '0',
          change: 'No data',
          changeType: 'neutral',
          icon: 'Clock',
          color: 'warning'
        }
      ]);
    } finally {
      setMetricsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch initial appointment trends data
    fetchAppointmentTrends(appointmentTimeRange);
    
    // Fetch dashboard metrics on component mount
    fetchDashboardMetrics();
  }, []); // Run only once on mount

  // Additional useEffect to refetch metrics when activeView changes to dashboard
  useEffect(() => {
    if (activeView === 'dashboard') {
      fetchDashboardMetrics();
    }
  }, [activeView]);

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
                {metricsLoading ? (
                  // Loading skeleton for KPI cards
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="bg-card rounded-lg p-6 border border-border">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-muted animate-pulse"></div>
                        <div className="w-16 h-4 bg-muted rounded animate-pulse"></div>
                      </div>
                      <div>
                        <div className="w-20 h-8 bg-muted rounded mb-1 animate-pulse"></div>
                        <div className="w-24 h-4 bg-muted rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))
                ) : (
                  kpiData.map((kpi, index) => (
                    <KPICard key={index} {...kpi} />
                  ))
                )}
              </div>

              {/* Main Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Left Column - Analytics */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Appointment Trends Chart */}
                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Appointment Trends</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Track appointment bookings, completions, and cancellations
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Time Range Selector */}
                        <div className="flex bg-muted rounded-lg p-1">
                          {[
                            { value: '7d', label: '7 Days' },
                            { value: '30d', label: '30 Days' },
                            { value: '90d', label: '90 Days' },
                            { value: '1y', label: '1 Year' }
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleAppointmentTimeRangeChange(option.value)}
                              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                appointmentTimeRange === option.value
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          iconName="Download"
                          loading={isExportingAppointments}
                          onClick={handleExportAppointments}
                        >
                          Export
                        </Button>
                      </div>
                    </div>
                    
                    {/* Chart */}
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={appointmentTrendsData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="name" 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                          />
                          <YAxis 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="appointments" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={3}
                            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                            name="Total Appointments"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="completed" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                            name="Completed"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="cancelled" 
                            stroke="#ef4444" 
                            strokeWidth={2}
                            dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
                            name="Cancelled"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {appointmentTrendsData.reduce((sum, item) => sum + item.appointments, 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Appointments</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {appointmentTrendsData.reduce((sum, item) => sum + item.completed, 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {appointmentTrendsData.reduce((sum, item) => sum + item.cancelled, 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Cancelled</div>
                      </div>
                    </div>
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
                <UserManagementTable onUserAction={handleUserAction} />
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
            <UserManagementTable onUserAction={handleUserAction} />
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