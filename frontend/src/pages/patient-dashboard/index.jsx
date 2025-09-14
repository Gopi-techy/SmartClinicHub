import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import patientDashboardService from '../../utils/patientDashboardService';
import RoleBasedHeader from '../../components/ui/RoleBasedHeader';
import PatientBottomTabs from '../../components/ui/PatientBottomTabs';
import PatientSidebar from '../../components/ui/PatientSidebar';
import UpcomingAppointmentCard from './components/UpcomingAppointmentCard';
import HealthMetricsCard from './components/HealthMetricsCard';
import PrescriptionStatusCard from './components/PrescriptionStatusCard';
import QuickActionsCard from './components/QuickActionsCard';
import RecentActivityFeed from './components/RecentActivityFeed';
import AppointmentBookingWidget from './components/AppointmentBookingWidget';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check authentication
    if (!user || userRole !== 'patient') {
      navigate('/login-registration');
      return;
    }

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Check for dark mode preference
    const darkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    }

    return () => clearInterval(timer);
  }, [navigate, user, userRole]);

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all dashboard data in parallel
        const [
          appointmentsData,
          healthMetricsData,
          prescriptionsData,
          activitiesData
        ] = await Promise.all([
          patientDashboardService.getUpcomingAppointments(),
          patientDashboardService.getHealthMetrics(),
          patientDashboardService.getPrescriptionStatus(),
          patientDashboardService.getRecentActivities()
        ]);

        setDashboardData({
          appointments: appointmentsData,
          healthMetrics: healthMetricsData,
          prescriptions: prescriptionsData,
          activities: activitiesData
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    if (user && userRole === 'patient') {
      fetchDashboardData();
    }
  }, [user, userRole]);

  // Extract data from dashboardData for individual components
  const upcomingAppointment = dashboardData?.appointments?.[0] || null;
  const healthMetrics = dashboardData?.healthMetrics || [];
  const prescriptions = dashboardData?.prescriptions || [];
  const recentActivities = dashboardData?.activities || [];

  const handleRescheduleAppointment = (appointmentId) => {
    navigate('/appointment-booking', { state: { reschedule: appointmentId } });
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      // TODO: Implement real API call to cancel appointment
      console.log('Cancelling appointment:', appointmentId);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (!user || userRole !== 'patient') {
    return null; // Will redirect in useEffect
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <RoleBasedHeader />
        <PatientSidebar />
        <PatientBottomTabs />
        
        <div className="pt-16 pb-20 md:pb-8 md:ml-64">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your dashboard...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <RoleBasedHeader />
        <PatientSidebar />
        <PatientBottomTabs />
        
        <div className="pt-16 pb-20 md:pb-8 md:ml-64">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <Icon name="AlertTriangle" className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Unable to Load Dashboard</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                  iconName="RefreshCw"
                >
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Patient Dashboard - SmartClinicHub</title>
        <meta name="description" content="Patient dashboard for SmartClinicHub - manage appointments, view health metrics, prescriptions, and recent activity." />
        <meta name="keywords" content="patient dashboard, healthcare, appointments, health metrics, prescriptions, medical records" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <RoleBasedHeader />
        <PatientSidebar />
        <PatientBottomTabs />
      
      {/* Main Content */}
      <div className="pt-16 pb-20 md:pb-8 md:ml-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                  {getGreeting()}, {user.firstName || 'Patient'}!
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
                <Button
                  variant="ghost"
                  size="sm"
                  iconName={isDarkMode ? "Sun" : "Moon"}
                  onClick={toggleDarkMode}
                />
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Bell"
                  className="relative"
                >
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left Column - Main Cards */}
            <div className="lg:col-span-2 space-y-6">
              {/* Upcoming Appointment */}
              <UpcomingAppointmentCard
                appointment={upcomingAppointment}
                onReschedule={handleRescheduleAppointment}
                onCancel={handleCancelAppointment}
              />

              {/* Health Metrics */}
              <HealthMetricsCard metrics={healthMetrics} />

              {/* Prescription Status */}
              <PrescriptionStatusCard prescriptions={prescriptions} />
            </div>

            {/* Right Column - Sidebar Cards */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <QuickActionsCard />

              {/* Appointment Booking Widget */}
              <AppointmentBookingWidget />
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="mb-8">
            <RecentActivityFeed activities={recentActivities} />
          </div>

          {/* Emergency Access Banner */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center">
                  <Icon name="AlertTriangle" size={24} className="text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Emergency Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Quick access to emergency information and contacts
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                iconName="Shield"
                iconPosition="left"
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                Emergency Mode
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default PatientDashboard;