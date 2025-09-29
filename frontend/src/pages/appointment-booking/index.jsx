import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import RoleBasedHeader from '../../components/ui/RoleBasedHeader';
import PatientBottomTabs from '../../components/ui/PatientBottomTabs';
import PatientSidebar from '../../components/ui/PatientSidebar';
import ProviderSidebar from '../../components/ui/ProviderSidebar';
import EmergencyModeNavigation from '../../components/ui/EmergencyModeNavigation';
import ProviderCard from './components/ProviderCard';
import SpecialtyFilter from './components/SpecialtyFilter';
import CalendarView from './components/CalendarView';
import AppointmentTypeSelector from './components/AppointmentTypeSelector';
import BookingConfirmation from './components/BookingConfirmation';
import BookingProgressIndicator from './components/BookingProgressIndicator';
import AppointmentStatusModal from './components/AppointmentStatusModal';
import BookingLoadingModal from './components/BookingLoadingModal';
import MedicalChatContainer from '../../components/ui/MedicalChatContainer';
import appointmentService from '../../services/appointmentService';
import { useAuth } from '../../contexts/AuthContext';
import doctorService from '../../services/doctorService';

const AppointmentBooking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [userRole, setUserRole] = useState('patient');
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [appointmentType, setAppointmentType] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalType, setStatusModalType] = useState('success');
  const [statusModalData, setStatusModalData] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'patient';
    setUserRole(role);
  }, []);

  // Fetch doctors on component mount and when specialty changes
  useEffect(() => {
    fetchDoctors();
  }, [selectedSpecialty]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() !== '') {
        fetchDoctors();
      } else if (searchQuery === '') {
        fetchDoctors(); // Reset to show all when search is cleared
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Fetch available slots when provider and date are selected
  useEffect(() => {
    if (selectedProvider && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedProvider, selectedDate]);

  const fetchAvailableSlots = async () => {
    if (!selectedProvider || !selectedDate) return;

    try {
      setLoading(true);
      const dateString = selectedDate.toISOString().split('T')[0];
      const response = await appointmentService.getAvailableSlots(selectedProvider.id, dateString);
      
      if (response.success) {
        setAvailableSlots(response.availableSlots);
      } else {
        // Fallback to default slots if API fails
        setAvailableSlots(defaultTimeSlots.map(time => ({
          startTime: time,
          endTime: calculateEndTime(time, 30),
          available: true
        })));
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      // Fallback to default slots
      setAvailableSlots(defaultTimeSlots.map(time => ({
        startTime: time,
        endTime: calculateEndTime(time, 30),
        available: true
      })));
    } finally {
      setLoading(false);
    }
  };

  const calculateEndTime = (startTime, duration = 30) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration;
    
    const endHours = Math.floor(endMinutes / 60);
    const remainingMinutes = endMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {
        page: 1,
        limit: 20,
        sortBy: 'rating',
        sortOrder: 'desc'
      };

      if (searchQuery.trim()) {
        filters.query = searchQuery.trim();
      }

      if (selectedSpecialty && selectedSpecialty !== 'all') {
        // Map specialty filter to backend format
        const specialtyMap = {
          'cardiology': 'cardiology',
          'dermatology': 'dermatology',
          'neurology': 'neurology',
          'orthopedics': 'orthopedics',
          'pediatrics': 'pediatrics',
          'psychiatry': 'psychiatry',
          'radiology': 'radiology',
          'surgery': 'surgery'
        };
        filters.specialization = specialtyMap[selectedSpecialty] || selectedSpecialty;
      }

      const response = await doctorService.getDoctors(filters);
      const transformedData = doctorService.transformDoctorData(response);
      
      setDoctors(transformedData.doctors);
      setPagination(transformedData.pagination);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Failed to load doctors. Please try again.');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const specialties = [
    { id: 'cardiology', name: 'Cardiology', icon: 'Heart' },
    { id: 'dermatology', name: 'Dermatology', icon: 'Sparkles' },
    { id: 'neurology', name: 'Neurology', icon: 'Brain' },
    { id: 'orthopedics', name: 'Orthopedics', icon: 'Bone' },
    { id: 'pediatrics', name: 'Pediatrics', icon: 'Baby' },
    { id: 'psychiatry', name: 'Psychiatry', icon: 'HeartHandshake' },
    { id: 'radiology', name: 'Radiology', icon: 'Scan' },
    { id: 'surgery', name: 'Surgery', icon: 'Scissors' }
  ];

  const defaultTimeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "18:00", "18:30", "19:00", "19:30"
  ];

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const handleAppointmentTypeSelect = (type) => {
    setAppointmentType(type);
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBookingConfirm = async (bookingData) => {
    try {
      setBookingLoading(true);
      setBookingError(null);

      // Prepare appointment data
      const appointmentData = {
        doctorId: selectedProvider.id,
        appointmentDate: selectedDate.toISOString().split('T')[0],
        startTime: selectedTime,
        endTime: calculateEndTime(selectedTime, 30),
        duration: 30,
        type: 'consultation',
        mode: appointmentType === 'telehealth' ? 'online' : 'in-person',
        chiefComplaint: bookingData.specialRequests || '',
        urgencyLevel: 'medium',
        consultationFee: selectedProvider.consultationFee || 0
      };

      // Validate appointment data
      const validation = appointmentService.validateAppointmentData(appointmentData);
      if (!validation.isValid) {
        setBookingError(validation.errors.join(', '));
        return;
      }

      // Book the appointment
      const response = await appointmentService.bookAppointment(appointmentData);
      
      if (response.success) {
        // Show success status modal
        const appointmentInfo = {
          bookingReference: response.data.bookingReference || `APT-${Date.now()}`,
          doctorName: selectedProvider.name,
          date: selectedDate.toISOString(),
          time: selectedTime,
          mode: appointmentType,
          meetingUrl: response.data.appointment?.meetingUrl
        };
        setStatusModalData(appointmentInfo);
        setStatusModalType('success');
        setShowStatusModal(true);
      } else {
        // Check if it's a conflict error
        if (response.message?.includes('conflict') || response.message?.includes('not available')) {
          setStatusModalData({
            date: selectedDate.toISOString(),
            time: selectedTime
          });
          setStatusModalType('conflict');
          setShowStatusModal(true);
        } else {
          setStatusModalData(null);
          setStatusModalType('error');
          setShowStatusModal(true);
        }
        setBookingError(response.message || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Booking confirmation error:', error);
      setStatusModalData(null);
      setStatusModalType('error');
      setShowStatusModal(true);
      setBookingError(error.message || 'An error occurred while booking the appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleEditStep = (step) => {
    switch (step) {
      case 'provider':
        setCurrentStep(1);
        break;
      case 'datetime':
        setCurrentStep(2);
        break;
      case 'type':
        setCurrentStep(3);
        break;
      case 'patient':
        // Handle patient info edit
        break;
      default:
        break;
    }
  };

  const handleStatusModalClose = () => {
    setShowStatusModal(false);
    setStatusModalData(null);
    setBookingError(null);
    
    // If it was a success, navigate to dashboard
    if (statusModalType === 'success') {
      navigate('/patient-dashboard');
    } else if (statusModalType === 'conflict') {
      // Go back to time selection
      setCurrentStep(2);
      setSelectedTime(null);
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return selectedProvider !== null;
      case 2:
        return selectedDate !== null && selectedTime !== null;
      case 3:
        return appointmentType !== null;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Select Healthcare Provider";
      case 2:
        return "Choose Date & Time";
      case 3:
        return "Select Appointment Type";
      case 4:
        return "Confirm Appointment";
      default:
        return "Book Appointment";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return "Choose from our network of qualified healthcare professionals";
      case 2:
        return "Pick a convenient date and time for your appointment";
      case 3:
        return "Select whether you prefer an in-person visit or telehealth consultation";
      case 4:
        return "Review and confirm your appointment details";
      default:
        return "";
    }
  };

  if (isEmergencyMode) {
    return (
      <EmergencyModeNavigation
        isActive={isEmergencyMode}
        onExit={() => setIsEmergencyMode(false)}
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>Book Appointment - SmartClinicHub</title>
        <meta name="description" content="Book appointments with healthcare providers at SmartClinicHub. Choose from available doctors, select appointment times, and manage your healthcare schedule." />
        <meta name="keywords" content="book appointment, healthcare providers, doctor booking, medical appointment, clinic scheduling" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <RoleBasedHeader />
      
      {userRole === 'patient' && <PatientBottomTabs />}
      {userRole === 'patient' && <PatientSidebar />}
      {(userRole === 'doctor' || userRole === 'admin') && <ProviderSidebar />}

      <main className={`pt-16 ${
        userRole === 'patient' ?'pb-20 md:pb-4 md:pl-64' :'md:pl-80'
      }`}>
        <BookingProgressIndicator currentStep={currentStep} totalSteps={4} />

        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                  {getStepTitle()}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {getStepDescription()}
                </p>
              </div>
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  iconName="ArrowLeft"
                  iconPosition="left"
                  onClick={handlePreviousStep}
                >
                  Back
                </Button>
              )}
            </div>
          </div>

          {/* Step Content */}
          <div className="space-y-6">
            {currentStep === 1 && (
              <div className="space-y-6">
                <SpecialtyFilter
                  specialties={specialties}
                  selectedSpecialty={selectedSpecialty}
                  onSpecialtyChange={setSelectedSpecialty}
                />

                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Icon name="Search" size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search doctors by name or specialty..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                  <Button variant="outline" iconName="Filter" size="sm">
                    Filters
                  </Button>
                </div>

                {/* Loading State */}
                {loading && (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading doctors...</p>
                  </div>
                )}

                {/* Error State */}
                {error && !loading && (
                  <div className="text-center py-12">
                    <Icon name="AlertCircle" size={48} className="mx-auto text-destructive mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Doctors</h3>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <Button onClick={fetchDoctors} variant="outline">
                      Try Again
                    </Button>
                  </div>
                )}

                {/* Doctors Grid */}
                {!loading && !error && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {doctors.map((provider) => (
                      <ProviderCard
                        key={provider.id}
                        provider={provider}
                        isSelected={selectedProvider?.id === provider.id}
                        onSelect={handleProviderSelect}
                      />
                    ))}
                  </div>
                )}

                {/* No Results */}
                {!loading && !error && doctors.length === 0 && (
                  <div className="text-center py-12">
                    <Icon name="UserX" size={48} className="mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No doctors found</h3>
                    <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && selectedProvider && (
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={selectedProvider.image}
                      alt={selectedProvider.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-foreground">{selectedProvider.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedProvider.specialty}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      iconName="Edit"
                      onClick={() => handleEditStep('provider')}
                    >
                      Change
                    </Button>
                  </div>
                </div>

                <CalendarView
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  availableSlots={availableSlots.length > 0 ? availableSlots : defaultTimeSlots.map(time => ({
                    startTime: time,
                    available: true
                  }))}
                  onTimeSelect={handleTimeSelect}
                  selectedTime={selectedTime}
                  loading={loading}
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {selectedDate?.toLocaleDateString()} at {selectedTime && 
                          (() => {
                            const [hours, minutes] = selectedTime.split(':');
                            const hour = parseInt(hours);
                            const ampm = hour >= 12 ? 'PM' : 'AM';
                            const displayHour = hour % 12 || 12;
                            return `${displayHour}:${minutes} ${ampm}`;
                          })()
                        }
                      </h3>
                      <p className="text-sm text-muted-foreground">with {selectedProvider?.name}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      iconName="Edit"
                      onClick={() => handleEditStep('datetime')}
                    >
                      Change
                    </Button>
                  </div>
                </div>

                <AppointmentTypeSelector
                  selectedType={appointmentType}
                  onTypeSelect={handleAppointmentTypeSelect}
                />
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                {bookingError && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Icon name="AlertCircle" size={20} className="text-destructive" />
                      <p className="text-destructive font-medium">Booking Error</p>
                    </div>
                    <p className="text-destructive mt-1">{bookingError}</p>
                  </div>
                )}
                
                <BookingConfirmation
                  bookingData={{
                    selectedProvider,
                    selectedDate,
                    selectedTime,
                    appointmentType
                  }}
                  onConfirm={handleBookingConfirm}
                  onEdit={handleEditStep}
                  loading={bookingLoading}
                />
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          {currentStep < 4 && (
            <div className="flex justify-end mt-8">
              <Button
                variant="primary"
                iconName="ArrowRight"
                iconPosition="right"
                onClick={handleNextStep}
                disabled={!canProceedToNextStep()}
                size="lg"
              >
                Continue
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Medical Chat Widget */}
      <MedicalChatContainer />
      
      {/* Loading Modal */}
      <BookingLoadingModal
        isOpen={bookingLoading}
        message="Processing your appointment booking..."
      />
      
      {/* Status Modal */}
      <AppointmentStatusModal
        isOpen={showStatusModal}
        onClose={handleStatusModalClose}
        status={statusModalType}
        appointmentData={statusModalData}
      />
    </div>
    </>
  );
};

export default AppointmentBooking;