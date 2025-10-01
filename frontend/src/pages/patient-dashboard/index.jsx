import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import patientDashboardService from '../../utils/patientDashboardService';
import appointmentService from '../../services/appointmentService';
import prescriptionService from '../../services/prescriptionService';
import RoleBasedHeader from '../../components/ui/RoleBasedHeader';
import PatientBottomTabs from '../../components/ui/PatientBottomTabs';
import PatientSidebar from '../../components/ui/PatientSidebar';
import UpcomingAppointmentCard from './components/UpcomingAppointmentCard';
import HealthMetricsCard from './components/HealthMetricsCard';
import PrescriptionStatusCard from './components/PrescriptionStatusCard';
import QuickActionsCard from './components/QuickActionsCard';
import RecentActivityFeed from './components/RecentActivityFeed';
import AppointmentBookingWidget from './components/AppointmentBookingWidget';
import ProfileCompletionBanner from '../../components/ui/ProfileCompletionBanner';
import MedicalChatContainer from '../../components/ui/MedicalChatContainer';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user, userRole, isAuthenticated, isLoading } = useAuth();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    // Check authentication
    if (isLoading) {
      return;
    }
    
    if (!isAuthenticated || !user || userRole !== 'patient') {
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
  }, [navigate, user, userRole, isAuthenticated, isLoading]);

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
  
  // Debug: Log appointment structure
  if (upcomingAppointment) {
    console.log('Upcoming appointment:', upcomingAppointment);
    console.log('Appointment ID:', upcomingAppointment._id || upcomingAppointment.id);
  }

  const handleRescheduleAppointment = (appointmentId) => {
    navigate('/appointment-booking', { state: { reschedule: appointmentId } });
  };

  const handleBookAppointment = () => {
    navigate('/appointment-booking');
  };

  const handleCancelAppointment = (appointmentId) => {
    setAppointmentToCancel(appointmentId);
    setShowCancelModal(true);
  };

  const confirmCancelAppointment = async () => {
    if (!appointmentToCancel) return;
    
    console.log('Starting cancel appointment...', appointmentToCancel);
    setIsCancelling(true);
    
    try {
      console.log('Calling cancelAppointment API...');
      const result = await appointmentService.cancelAppointment(
        appointmentToCancel, 
        cancelReason || 'Cancelled by patient'
      );
      
      console.log('Cancel result:', result);
      
      // Refresh dashboard data
      console.log('Refreshing dashboard data...');
      const fetchDashboardData = async () => {
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
      };

      await fetchDashboardData();
      
      console.log('Dashboard refreshed successfully');
      
      // Close modal and reset state
      setShowCancelModal(false);
      setAppointmentToCancel(null);
      setCancelReason('');
      
      // Show success toast
      setToastMessage('Appointment cancelled successfully');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error) {
      console.error('Cancel appointment error:', error);
      // Show error toast
      setToastMessage(error.message || 'Failed to cancel appointment. Please try again.');
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
    } finally {
      console.log('Setting isCancelling to false');
      setIsCancelling(false);
    }
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setAppointmentToCancel(null);
    setCancelReason('');
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
                  {getGreeting()}, {user?.firstName || user?.name || 'Patient'}!
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

          {/* Profile Completion Banner */}
          <ProfileCompletionBanner user={user} className="mb-6" />

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left Column - Main Cards */}
            <div className="lg:col-span-2 space-y-6">
              {/* Upcoming Appointment */}
              <UpcomingAppointmentCard
                appointment={upcomingAppointment}
                onReschedule={handleRescheduleAppointment}
                onCancel={handleCancelAppointment}
                onBookAppointment={handleBookAppointment}
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

      {/* Medical Chat Widget */}
      <MedicalChatContainer />

      {/* Cancel Appointment Modal */}
      {showCancelModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Close modal if clicking the backdrop
            if (e.target === e.currentTarget && !isCancelling) {
              closeCancelModal();
            }
          }}
        >
          <div 
            className="bg-card rounded-lg shadow-xl max-w-md w-full border border-border animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                  <Icon name="AlertTriangle" size={20} className="text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Cancel Appointment</h3>
              </div>
              <button
                onClick={closeCancelModal}
                className="text-muted-foreground hover:text-foreground transition-colors"
                disabled={isCancelling}
              >
                <Icon name="X" size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to cancel this appointment? This action cannot be undone.
              </p>

              <div className="space-y-2">
                <label htmlFor="cancelReason" className="text-sm font-medium text-foreground">
                  Reason for cancellation (optional)
                </label>
                <textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please let us know why you're cancelling..."
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={3}
                  disabled={isCancelling}
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-3 flex items-start space-x-2">
                <Icon name="Info" size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  If you need to reschedule instead of cancelling, please use the "Reschedule" option.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-border bg-muted/20">
              <Button
                variant="outline"
                size="sm"
                onClick={closeCancelModal}
                disabled={isCancelling}
              >
                Keep Appointment
              </Button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Button clicked!', { isCancelling, appointmentToCancel });
                  confirmCancelAppointment();
                }}
                disabled={isCancelling}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCancelling ? (
                  <>
                    <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <>
                    <Icon name="Trash2" size={16} className="mr-2" />
                    <span>Cancel Appointment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-primary/10 border border-primary/20 backdrop-blur-sm px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 min-w-[320px]">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Icon name="CheckCircle2" size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-foreground">{toastMessage}</p>
            </div>
            <button
              onClick={() => setShowSuccessToast(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name="X" size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {showErrorToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-destructive/10 border border-destructive/20 backdrop-blur-sm px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 min-w-[320px]">
            <div className="w-8 h-8 bg-destructive/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Icon name="XCircle" size={20} className="text-destructive" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-foreground">{toastMessage}</p>
            </div>
            <button
              onClick={() => setShowErrorToast(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name="X" size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default PatientDashboard;