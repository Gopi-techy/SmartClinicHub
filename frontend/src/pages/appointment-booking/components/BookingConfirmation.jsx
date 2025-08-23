import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const BookingConfirmation = ({ bookingData, onConfirm, onEdit }) => {
  const [specialRequests, setSpecialRequests] = useState('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const generateQRCode = () => {
    setIsGeneratingQR(true);
    // Simulate QR code generation
    setTimeout(() => {
      setIsGeneratingQR(false);
    }, 2000);
  };

  const handleConfirmBooking = () => {
    const finalBookingData = {
      ...bookingData,
      specialRequests,
      qrCode: 'QR_CODE_DATA_HERE',
      confirmationNumber: `APT-${Date.now().toString().slice(-6)}`
    };
    onConfirm(finalBookingData);
  };

  const addToCalendar = () => {
    const startDate = new Date(bookingData.selectedDate);
    const [hours, minutes] = bookingData.selectedTime.split(':');
    startDate.setHours(parseInt(hours), parseInt(minutes));
    
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + (bookingData.appointmentType === 'telehealth' ? 30 : 45));

    const event = {
      title: `Appointment with Dr. ${bookingData.selectedProvider.name}`,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      description: `${bookingData.appointmentType === 'telehealth' ? 'Telehealth' : 'In-person'} appointment`
    };

    // Create calendar event URL
    const calendarUrl = `data:text/calendar;charset=utf8,BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${event.start.replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${event.end.replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${event.title}
DESCRIPTION:${event.description}
END:VEVENT
END:VCALENDAR`;

    const link = document.createElement('a');
    link.href = calendarUrl;
    link.download = 'appointment.ics';
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Icon name="CheckCircle" size={48} className="mx-auto text-success mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">Confirm Your Appointment</h3>
        <p className="text-muted-foreground">Please review your appointment details below</p>
      </div>

      {/* Appointment Summary */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h4 className="font-semibold text-foreground flex items-center">
          <Icon name="Calendar" size={20} className="mr-2" />
          Appointment Details
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Doctor</label>
              <div className="flex items-center space-x-3 mt-1">
                <img
                  src={bookingData.selectedProvider.image}
                  alt={bookingData.selectedProvider.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-foreground">{bookingData.selectedProvider.name}</p>
                  <p className="text-sm text-muted-foreground">{bookingData.selectedProvider.specialty}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
              <p className="font-medium text-foreground">{formatDate(bookingData.selectedDate)}</p>
              <p className="text-sm text-muted-foreground">{formatTime(bookingData.selectedTime)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Appointment Type</label>
              <div className="flex items-center space-x-2 mt-1">
                <Icon 
                  name={bookingData.appointmentType === 'telehealth' ? 'Video' : 'Building2'} 
                  size={16} 
                  className="text-primary" 
                />
                <p className="font-medium text-foreground">
                  {bookingData.appointmentType === 'telehealth' ? 'Telehealth Consultation' : 'In-Person Visit'}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Duration</label>
              <p className="font-medium text-foreground">
                {bookingData.appointmentType === 'telehealth' ? '15-30 minutes' : '30-45 minutes'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Consultation Fee</label>
              <p className="font-medium text-foreground">${bookingData.selectedProvider.consultationFee}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Information */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-foreground flex items-center">
            <Icon name="User" size={20} className="mr-2" />
            Patient Information
          </h4>
          <Button variant="outline" size="sm" iconName="Edit" onClick={() => onEdit('patient')}>
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Full Name</label>
            <p className="font-medium text-foreground">John Smith</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
            <p className="font-medium text-foreground">March 15, 1985</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
            <p className="font-medium text-foreground">(555) 123-4567</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <p className="font-medium text-foreground">john.smith@email.com</p>
          </div>
        </div>
      </div>

      {/* Special Requests */}
      <div className="space-y-3">
        <Input
          label="Special Requests or Notes (Optional)"
          type="textarea"
          placeholder="Any specific concerns, symptoms, or requests you'd like to mention..."
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          description="This information will be shared with your healthcare provider"
        />
      </div>

      {/* QR Code Section */}
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <h4 className="font-semibold text-foreground mb-4">Quick Check-in</h4>
        {isGeneratingQR ? (
          <div className="space-y-3">
            <div className="w-32 h-32 mx-auto bg-muted rounded-lg flex items-center justify-center">
              <Icon name="Loader2" size={32} className="animate-spin text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Generating QR code...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-32 h-32 mx-auto bg-muted rounded-lg flex items-center justify-center">
              <Icon name="QrCode" size={48} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">QR code will be generated after confirmation</p>
            <Button variant="outline" size="sm" onClick={generateQRCode}>
              Preview QR Code
            </Button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          fullWidth
          iconName="Calendar"
          iconPosition="left"
          onClick={addToCalendar}
        >
          Add to Calendar
        </Button>
        <Button
          variant="primary"
          fullWidth
          iconName="Check"
          iconPosition="left"
          onClick={handleConfirmBooking}
        >
          Confirm Appointment
        </Button>
      </div>

      {/* Terms and Conditions */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          By confirming this appointment, you agree to our{' '}
          <button className="text-primary hover:underline">Terms of Service</button> and{' '}
          <button className="text-primary hover:underline">Privacy Policy</button>
        </p>
      </div>
    </div>
  );
};

export default BookingConfirmation;