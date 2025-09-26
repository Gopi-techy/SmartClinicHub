import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import RoleBasedHeader from '../../components/ui/RoleBasedHeader';
import ProviderSidebar from '../../components/ui/ProviderSidebar';
import TodaySchedule from './components/TodaySchedule';
import PatientManagementTable from './components/PatientManagementTable';
import AllPatients from './components/AllPatients';
import QuickActions from './components/QuickActions';
import PatientNotesPanel from './components/PatientNotesPanel';
import ProfileCompletionBanner from '../../components/ui/ProfileCompletionBanner';
import VerificationStatusBanner from '../../components/ui/VerificationStatusBanner';
import ToastManager from '../../components/ui/ToastManager';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real patient data from backend
  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch('/api/appointments/doctor/patients', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Transform the data to match frontend expectations
        const transformedPatients = data.patients.map(patient => ({
          id: patient.id,
          name: patient.name,
          patientId: patient.patientId,
          appointmentTime: formatTime(patient.appointmentTime),
          duration: patient.duration,
          reason: patient.reason,
          status: mapStatus(patient.status),
          priority: patient.priority === 'high' ? 'high' : patient.priority === 'medium' ? 'medium' : 'low',
          bookingReference: patient.bookingReference,
          type: patient.type,
          mode: patient.mode,
          patient: patient.patient
        }));
        
        setPatients(transformedPatients);
        
        // Also update today's schedule with the same data
        const scheduleData = transformedPatients.slice(0, 5).map((patient, index) => ({
          id: patient.id,
          time: patient.appointmentTime,
          patientName: patient.name,
          patientAge: calculateAge(patient.patient?.dateOfBirth),
          appointmentType: patient.type?.charAt(0).toUpperCase() + patient.type?.slice(1) || 'Consultation',
          status: patient.status,
          priority: patient.priority
        }));
        
        setTodaySchedule(scheduleData);
      } else {
        setError(data.message || 'Failed to fetch patients');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setError('Failed to load patient data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const mapStatus = (status) => {
    const statusMap = {
      'scheduled': 'confirmed',
      'confirmed': 'confirmed',
      'in-progress': 'in-progress',
      'waiting': 'waiting',
      'completed': 'completed',
      'cancelled': 'cancelled'
    };
    return statusMap[status] || status;
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Fetch data when component mounts and user is authenticated
  useEffect(() => {
    if (user && userRole === 'doctor') {
      fetchPatients();
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
      <div className="pt-16 md:ml-80">
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

          {/* Profile Completion Banner */}
          <ProfileCompletionBanner user={user} className="mb-6" />

          {/* Verification Status Banner */}
          <VerificationStatusBanner user={user} className="mb-6" />

          {/* Conditional Content Based on Route */}
          {location.pathname === '/doctor-dashboard/all-patients' ? (
            <AllPatients />
          ) : (
            <>
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
              {loading ? (
                <div className="bg-card rounded-lg border border-border p-6">
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="text-muted-foreground">Loading patients...</span>
                    </div>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-card rounded-lg border border-border p-6">
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Icon name="AlertCircle" size={48} className="mx-auto text-destructive mb-4" />
                      <p className="text-destructive mb-4">{error}</p>
                      <Button
                        variant="outline"
                        onClick={fetchPatients}
                        iconName="RefreshCw"
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <PatientManagementTable 
                  patients={patients}
                  onPatientSelect={handlePatientSelect}
                  onCreatePrescription={(patient) => console.log('Create prescription for:', patient)}
                />
              )}
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
            </>
          )}
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

      {/* Toast Notifications for real-time updates */}
      <ToastManager />
    </div>
    </>
  );
};

export default DoctorDashboard;