import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import appointmentService from '../../services/appointmentService';
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
  const [appointmentStats, setAppointmentStats] = useState(null);

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
      
      // Use the appointment service
      const response = await appointmentService.getDoctorPatients({
        status: 'all',
        limit: 50,
        page: 1
      });

      if (response.success) {
        // Transform the data to match frontend expectations
        const transformedPatients = response.patients.map(patient => ({
          id: patient.id,
          name: patient.name,
          patientId: patient.patientId,
          appointmentTime: patient.appointmentTime,
          duration: patient.duration,
          reason: patient.reason,
          status: patient.status,
          priority: patient.priority,
          appointmentDate: patient.appointmentDate,
          bookingReference: patient.bookingReference,
          type: patient.type,
          mode: patient.mode,
          patient: patient.patient
        }));
        
        setPatients(transformedPatients);
        
        // Filter for today's appointments and create schedule
        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = transformedPatients.filter(patient => 
          patient.appointmentDate && new Date(patient.appointmentDate).toISOString().split('T')[0] === today
        );
        
        // Create today's schedule data
        const scheduleData = todayAppointments.slice(0, 5).map((patient, index) => ({
          id: patient.id,
          time: formatTime(patient.appointmentTime),
          patientName: patient.name,
          patientAge: calculateAge(patient.patient?.dateOfBirth),
          appointmentType: patient.type?.charAt(0).toUpperCase() + patient.type?.slice(1) || 'Consultation',
          status: patient.status,
          priority: patient.priority
        }));
        
        setTodaySchedule(scheduleData);
      } else {
        setError(response.message || 'Failed to fetch patients');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setError(error.message || 'Failed to load patient data. Please try again.');
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
      fetchAppointmentStats();
    }
  }, [user, userRole]);

  const fetchAppointmentStats = async () => {
    try {
      const response = await appointmentService.getAppointmentStats('month');
      if (response.success) {
        setAppointmentStats(response.stats);
      }
    } catch (error) {
      console.error('Error fetching appointment stats:', error);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setIsNotesPanelOpen(true);
  };

  const handleStartAppointment = async (appointmentId) => {
    try {
      // Update appointment status to in-progress
      await appointmentService.updateAppointmentStatus(appointmentId, 'in-progress');
      
      // Navigate to appointment interface
      navigate(`/appointment/${appointmentId}`);
    } catch (error) {
      console.error('Error starting appointment:', error);
      // Could show toast notification here
    }
  };

  const handleRescheduleAppointment = (appointmentId) => {
    // Navigate to reschedule interface
    navigate(`/appointment-booking?reschedule=${appointmentId}`);
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      const reason = prompt('Please enter cancellation reason:');
      if (reason) {
        await appointmentService.cancelAppointment(appointmentId, reason);
        // Refresh the appointments list
        fetchPatients();
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      // Could show toast notification here
    }
  };

  const handleCompleteAppointment = async (appointmentId) => {
    try {
      await appointmentService.updateAppointmentStatus(appointmentId, 'completed');
      // Refresh the appointments list
      fetchPatients();
    } catch (error) {
      console.error('Error completing appointment:', error);
    }
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
                  {/* Quick Stats */}
                  {appointmentStats && (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="bg-card border border-border rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <Icon name="Calendar" size={20} className="text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Today</p>
                            <p className="text-xl font-semibold text-foreground">{appointmentStats.today}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <Icon name="Clock" size={20} className="text-blue-500" />
                          <div>
                            <p className="text-sm text-muted-foreground">Upcoming</p>
                            <p className="text-xl font-semibold text-foreground">{appointmentStats.upcoming}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <Icon name="Users" size={20} className="text-green-500" />
                          <div>
                            <p className="text-sm text-muted-foreground">This Month</p>
                            <p className="text-xl font-semibold text-foreground">{appointmentStats.total}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <Icon name="DollarSign" size={20} className="text-yellow-500" />
                          <div>
                            <p className="text-sm text-muted-foreground">Revenue</p>
                            <p className="text-xl font-semibold text-foreground">${appointmentStats.totalRevenue || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Today's Schedule */}
                  <TodaySchedule 
                    appointments={todaySchedule}
                    onAppointmentClick={handleStartAppointment}
                    onReschedule={handleRescheduleAppointment}
                    onCancel={handleCancelAppointment}
                    onComplete={handleCompleteAppointment}
                  />

                  {/* Patient Management */}
              {loading ? (
                <div className="bg-card rounded-lg border border-border p-6">
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="text-muted-foreground">Loading appointments...</span>
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
                        Retry
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <PatientManagementTable 
                  patients={patients}
                  onPatientSelect={handlePatientSelect}
                  onStartAppointment={handleStartAppointment}
                  onRescheduleAppointment={handleRescheduleAppointment}
                  onCancelAppointment={handleCancelAppointment}
                  onCompleteAppointment={handleCompleteAppointment}
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