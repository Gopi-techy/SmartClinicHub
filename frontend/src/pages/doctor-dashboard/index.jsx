import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import RoleBasedHeader from '../../components/ui/RoleBasedHeader';
import ProviderSidebar from '../../components/ui/ProviderSidebar';
import TodaySchedule from './components/TodaySchedule';
import PatientManagementTable from './components/PatientManagementTable';
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

  // Initialize with mock data
  useEffect(() => {
    if (user && userRole === 'doctor') {
      // Mock today's schedule
      setTodaySchedule([
        {
          id: 1,
          time: '09:00 AM',
          patientName: 'John Smith',
          patientAge: 34,
          appointmentType: 'Consultation',
          status: 'confirmed',
          priority: 'normal'
        },
        {
          id: 2,
          time: '10:30 AM',
          patientName: 'Sarah Johnson',
          patientAge: 28,
          appointmentType: 'Follow-up',
          status: 'confirmed',
          priority: 'normal'
        },
        {
          id: 3,
          time: '02:00 PM',
          patientName: 'Michael Brown',
          patientAge: 45,
          appointmentType: 'Emergency',
          status: 'urgent',
          priority: 'high'
        }
      ]);

      // Mock patients
      setPatients([
        {
          id: 1,
          name: 'John Smith',
          patientId: 'P001',
          appointmentTime: '09:00 AM',
          duration: 30,
          reason: 'Hypertension Follow-up',
          status: 'confirmed',
          priority: 'normal'
        },
        {
          id: 2,
          name: 'Sarah Johnson',
          patientId: 'P002',
          appointmentTime: '10:30 AM',
          duration: 45,
          reason: 'Diabetes Consultation',
          status: 'waiting',
          priority: 'normal'
        },
        {
          id: 3,
          name: 'Michael Brown',
          patientId: 'P003',
          appointmentTime: '02:00 PM',
          duration: 60,
          reason: 'Chest Pain Emergency',
          status: 'in-progress',
          priority: 'high'
        }
      ]);


    }
  }, [user, userRole]);

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

  const handleScheduleAppointment = () => {
    // Navigate to appointment scheduling
    navigate('/appointment-booking');
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
    <>
      <Helmet>
        <title>Doctor Dashboard - SmartClinicHub</title>
        <meta name="description" content="Doctor dashboard for SmartClinicHub - manage patient appointments, view schedules, update availability, and handle patient care." />
        <meta name="keywords" content="doctor dashboard, healthcare provider, patient management, appointments, medical practice, clinic management" />
      </Helmet>

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
                  {getGreeting()}, Dr. {user.firstName || 'Doctor'}!
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            {/* Left Column - Schedule and Patients */}
            <div className="lg:col-span-3 space-y-6">
              {/* Today's Schedule */}
              <TodaySchedule 
                appointments={todaySchedule}
                onAppointmentClick={handleStartAppointment}
                onReschedule={handleRescheduleAppointment}
              />

              {/* Patient Management */}
              <PatientManagementTable 
                patients={patients}
                onPatientSelect={handlePatientSelect}
                onCreatePrescription={(patient) => console.log('Create prescription for:', patient)}
              />
            </div>

            {/* Right Column - Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Quick Actions */}
              <QuickActions 
                onScheduleAppointment={handleScheduleAppointment}
                onCreatePrescription={(patient) => console.log('Create prescription for:', patient)}
                onAccessEmergency={() => console.log('Access emergency')}
              />
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
    </>
  );
};

export default DoctorDashboard;