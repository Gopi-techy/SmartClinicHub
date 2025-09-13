import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import RoleBasedHeader from '../../components/ui/RoleBasedHeader';
import ProviderSidebar from '../../components/ui/ProviderSidebar';
import TodaySchedule from './components/TodaySchedule';
import PatientManagementTable from './components/PatientManagementTable';
import AvailabilityCalendar from './components/AvailabilityCalendar';
import QuickActions from './components/QuickActions';
import PatientNotesPanel from './components/PatientNotesPanel';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(false);

  useEffect(() => {
    // Check authentication
    if (!user || userRole !== 'doctor') {
      navigate('/login-registration');
      return;
    }

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, [navigate, user, userRole]);

  // State for today's schedule
  const [todaySchedule, setTodaySchedule] = useState([]);

  // State for patient management
  const [patients, setPatients] = useState([]);

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setIsNotesPanelOpen(true);
  };

  const handleStartAppointment = (appointmentId) => {
    // Navigate to appointment interface
    navigate(`/appointment/${appointmentId}`);
  };

  const handleRescheduleAppointment = (appointmentId) => {
    // Open reschedule modal
    console.log('Reschedule appointment:', appointmentId);
  };

  const handleCancelAppointment = (appointmentId) => {
    // Cancel appointment
    console.log('Cancel appointment:', appointmentId);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (!user || userRole !== 'doctor') {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <RoleBasedHeader />
      <ProviderSidebar />
      
      {/* Main Content */}
      <div className="pt-16 md:ml-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                  {getGreeting()}, Dr. {user.lastName || 'Doctor'}!
                </h1>
                <p className="text-muted-foreground">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Specialization: {user.specialization || 'General Medicine'}
                </p>
              </div>
              <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Calendar"
                  onClick={() => navigate('/appointment-booking')}
                >
                  Manage Schedule
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Users"
                  onClick={() => navigate('/health-records-management')}
                >
                  Patient Records
                </Button>
              </div>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left Column - Schedule and Patients */}
            <div className="lg:col-span-2 space-y-6">
              {/* Today's Schedule */}
              <TodaySchedule 
                schedule={todaySchedule}
                onStartAppointment={handleStartAppointment}
                onReschedule={handleRescheduleAppointment}
                onCancel={handleCancelAppointment}
              />

              {/* Patient Management */}
              <PatientManagementTable 
                patients={patients}
                onPatientSelect={handlePatientSelect}
              />
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <QuickActions />

              {/* Availability Calendar */}
              <AvailabilityCalendar />
            </div>
          </div>

          {/* Emergency Alerts */}
          <div className="mb-8">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center">
                    <Icon name="AlertTriangle" size={24} className="text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Emergency Response</h3>
                    <p className="text-sm text-muted-foreground">
                      Quick access to emergency protocols and patient alerts
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

      {/* Patient Notes Panel */}
      {isNotesPanelOpen && selectedPatient && (
        <PatientNotesPanel
          patient={selectedPatient}
          isOpen={isNotesPanelOpen}
          onClose={() => {
            setIsNotesPanelOpen(false);
            setSelectedPatient(null);
          }}
        />
      )}
    </div>
  );
};

export default DoctorDashboard;