import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AppointmentBookingWidget = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  // Mock available time slots for the next 7 days
  const getAvailableSlots = () => {
    const slots = [];
    const today = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const timeSlots = [
        '09:00 AM', '10:00 AM', '11:00 AM', 
        '02:00 PM', '03:00 PM', '04:00 PM'
      ].filter(() => Math.random() > 0.3); // Randomly make some slots unavailable
      
      slots.push({
        date: date.toISOString().split('T')[0],
        displayDate: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        timeSlots
      });
    }
    
    return slots;
  };

  const availableSlots = getAvailableSlots();

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const handleBookAppointment = () => {
    if (selectedDate && selectedTime) {
      navigate('/appointment-booking', { 
        state: { 
          preselectedDate: selectedDate, 
          preselectedTime: selectedTime 
        } 
      });
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border shadow-healthcare">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Icon name="CalendarPlus" size={24} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Quick Booking</h3>
            <p className="text-sm text-muted-foreground">Book your next appointment</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          iconName="ExternalLink"
          onClick={() => navigate('/appointment-booking')}
        >
          Full Calendar
        </Button>
      </div>

      {/* Date Selection */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-foreground mb-3">Select Date</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          {availableSlots.map((slot, index) => (
            <button
              key={index}
              onClick={() => handleDateSelect(slot.date)}
              className={`p-3 rounded-lg border text-center transition-all duration-200 hover-scale ${
                selectedDate === slot.date
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary/50 bg-background'
              }`}
            >
              <div className="text-xs font-medium">{slot.displayDate}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {slot.timeSlots.length} slots
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Time Selection */}
      {selectedDate && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-foreground mb-3">Select Time</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {availableSlots
              .find(slot => slot.date === selectedDate)
              ?.timeSlots.map((time, index) => (
                <button
                  key={index}
                  onClick={() => handleTimeSelect(time)}
                  className={`p-3 rounded-lg border text-center transition-all duration-200 hover-scale ${
                    selectedTime === time
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/50 bg-background'
                  }`}
                >
                  <div className="text-sm font-medium">{time}</div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Booking Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant={selectedDate && selectedTime ? "default" : "outline"}
          size="sm"
          iconName="Calendar"
          iconPosition="left"
          onClick={handleBookAppointment}
          disabled={!selectedDate || !selectedTime}
          className="flex-1"
        >
          {selectedDate && selectedTime ? 'Book Appointment' : 'Select Date & Time'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          iconName="Video"
          iconPosition="left"
          className="flex-1"
        >
          Virtual Visit
        </Button>
      </div>

      {selectedDate && selectedTime && (
        <div className="mt-4 p-3 bg-primary/5 rounded-lg">
          <div className="flex items-center space-x-2">
            <Icon name="CheckCircle" size={16} className="text-primary" />
            <span className="text-sm font-medium text-primary">
              Selected: {availableSlots.find(s => s.date === selectedDate)?.displayDate} at {selectedTime}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentBookingWidget;