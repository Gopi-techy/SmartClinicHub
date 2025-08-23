import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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

  // Mock data for upcoming appointment
  const upcomingAppointment = {
    id: "APT-2025-001",
    doctor: "Dr. Sarah Johnson",
    location: "City Medical Center - Room 205",
    date: "January 22, 2025",
    time: "10:30 AM",
    type: "General Checkup",
    status: "confirmed",
    notes: "Annual physical examination and health screening"
  };

  // Mock data for health metrics
  const healthMetrics = [
    {
      type: "blood_pressure",
      name: "Blood Pressure",
      value: "120/80 mmHg",
      status: "normal",
      lastUpdated: "2 hours ago",
      trend: "stable",
      change: "No change"
    },
    {
      type: "heart_rate",
      name: "Heart Rate",
      value: "72 bpm",
      status: "normal",
      lastUpdated: "2 hours ago",
      trend: "down",
      change: "-3 bpm"
    },
    {
      type: "weight",
      name: "Weight",
      value: "165 lbs",
      status: "normal",
      lastUpdated: "1 week ago",
      trend: "up",
      change: "+2 lbs"
    },
    {
      type: "blood_sugar",
      name: "Blood Sugar",
      value: "95 mg/dL",
      status: "normal",
      lastUpdated: "4 hours ago",
      trend: "stable",
      change: "Normal range"
    },
    {
      type: "temperature",
      name: "Temperature",
      value: "98.6°F",
      status: "normal",
      lastUpdated: "6 hours ago",
      trend: "stable",
      change: "Normal"
    }
  ];

  // Mock data for prescriptions
  const prescriptions = [
    {
      medication: "Lisinopril 10mg",
      dosage: "10mg",
      frequency: "Once daily",
      status: "active",
      prescribedDate: "Dec 15, 2024",
      refillsLeft: "2",
      nextDose: "Tomorrow 8:00 AM"
    },
    {
      medication: "Metformin 500mg",
      dosage: "500mg",
      frequency: "Twice daily",
      status: "refill_needed",
      prescribedDate: "Nov 20, 2024",
      refillsLeft: "0",
      nextDose: "Today 6:00 PM"
    },
    {
      medication: "Vitamin D3 1000IU",
      dosage: "1000IU",
      frequency: "Once daily",
      status: "active",
      prescribedDate: "Jan 10, 2025",
      refillsLeft: "5",
      nextDose: "Tomorrow 9:00 AM"
    }
  ];

  // Mock data for recent activities
  const recentActivities = [
    {
      type: "appointment",
      title: "Appointment Confirmed",
      description: "Your appointment with Dr. Sarah Johnson has been confirmed for January 22, 2025 at 10:30 AM",
      timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      status: "confirmed",
      actionable: true
    },
    {
      type: "prescription",
      title: "Prescription Refill Reminder",
      description: "Metformin 500mg refill is due soon. Contact your pharmacy to request a refill.",
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      status: "action_needed",
      actionable: true
    },
    {
      type: "test_result",
      title: "Lab Results Available",
      description: "Your blood work results from January 18, 2025 are now available for review.",
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      status: "new",
      actionable: true
    },
    {
      type: "document",
      title: "Insurance Card Updated",
      description: "Your insurance information has been successfully updated in our system.",
      timestamp: new Date(Date.now() - 172800000), // 2 days ago
      status: "completed",
      actionable: false
    },
    {
      type: "payment",
      title: "Payment Processed",
      description: "Payment of $45.00 for your December 20, 2024 visit has been processed.",
      timestamp: new Date(Date.now() - 259200000), // 3 days ago
      status: "completed",
      actionable: false
    }
  ];

  const handleRescheduleAppointment = (appointmentId) => {
    navigate('/appointment-booking', { state: { reschedule: appointmentId } });
  };

  const handleCancelAppointment = (appointmentId) => {
    // Mock cancel functionality
    console.log('Cancelling appointment:', appointmentId);
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

  return (
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
  );
};

export default PatientDashboard;