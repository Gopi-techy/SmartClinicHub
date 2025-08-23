import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const AppointmentBooking = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [userRole, setUserRole] = useState('patient');
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [appointmentType, setAppointmentType] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'patient';
    setUserRole(role);
  }, []);

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

  const mockProviders = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      specialty: "Cardiology",
      specialtyId: "cardiology",
      hospital: "City General Hospital",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face",
      rating: 4.8,
      reviewCount: 127,
      experience: "12 years",
      consultationFee: 150,
      nextAvailable: new Date(Date.now() + 86400000),
      isOnline: true,
      specializations: ["Heart Surgery", "Cardiac Imaging", "Preventive Cardiology"]
    },
    {
      id: 2,
      name: "Dr. Michael Chen",
      specialty: "Dermatology",
      specialtyId: "dermatology",
      hospital: "Metro Medical Center",
      image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face",
      rating: 4.9,
      reviewCount: 89,
      experience: "8 years",
      consultationFee: 120,
      nextAvailable: new Date(Date.now() + 172800000),
      isOnline: false,
      specializations: ["Skin Cancer", "Cosmetic Dermatology", "Acne Treatment"]
    },
    {
      id: 3,
      name: "Dr. Emily Rodriguez",
      specialty: "Pediatrics",
      specialtyId: "pediatrics",
      hospital: "Children\'s Healthcare",
      image: "https://images.unsplash.com/photo-1594824804732-ca8db4394b5e?w=400&h=400&fit=crop&crop=face",
      rating: 4.7,
      reviewCount: 156,
      experience: "15 years",
      consultationFee: 100,
      nextAvailable: new Date(Date.now() + 259200000),
      isOnline: true,
      specializations: ["Child Development", "Vaccinations", "Pediatric Emergency"]
    },
    {
      id: 4,
      name: "Dr. James Wilson",
      specialty: "Orthopedics",
      specialtyId: "orthopedics",
      hospital: "Sports Medicine Institute",
      image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face",
      rating: 4.6,
      reviewCount: 203,
      experience: "20 years",
      consultationFee: 180,
      nextAvailable: new Date(Date.now() + 345600000),
      isOnline: true,
      specializations: ["Joint Replacement", "Sports Injuries", "Spine Surgery"]
    }
  ];

  const availableSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "18:00", "18:30", "19:00", "19:30"
  ];

  const filteredProviders = mockProviders.filter(provider => {
    const matchesSpecialty = selectedSpecialty === 'all' || provider.specialtyId === selectedSpecialty;
    const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         provider.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpecialty && matchesSearch;
  });

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

  const handleBookingConfirm = (bookingData) => {
    // Handle booking confirmation
    console.log('Booking confirmed:', bookingData);
    // Navigate to success page or dashboard
    navigate('/patient-dashboard');
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredProviders.map((provider) => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      isSelected={selectedProvider?.id === provider.id}
                      onSelect={handleProviderSelect}
                    />
                  ))}
                </div>

                {filteredProviders.length === 0 && (
                  <div className="text-center py-12">
                    <Icon name="UserX" size={48} className="mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No providers found</h3>
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
                  availableSlots={availableSlots}
                  onTimeSelect={handleTimeSelect}
                  selectedTime={selectedTime}
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
              <BookingConfirmation
                bookingData={{
                  selectedProvider,
                  selectedDate,
                  selectedTime,
                  appointmentType
                }}
                onConfirm={handleBookingConfirm}
                onEdit={handleEditStep}
              />
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
    </div>
  );
};

export default AppointmentBooking;