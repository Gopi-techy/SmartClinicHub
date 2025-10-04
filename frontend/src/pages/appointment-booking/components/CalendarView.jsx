import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CalendarView = ({ selectedDate, onDateSelect, availableSlots, onTimeSelect, selectedTime, isDoctorView = false, onSaveAvailability }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState({});

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isDateAvailable = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Allow dates from today onwards (time slots will be filtered to 1 hour from now)
    return date >= today;
  };
  
  const filterAvailableTimeSlots = (slots, selectedDate) => {
    // If selected date is not today, return all slots
    const today = new Date();
    const isToday = selectedDate && 
      selectedDate.getDate() === today.getDate() && 
      selectedDate.getMonth() === today.getMonth() && 
      selectedDate.getFullYear() === today.getFullYear();
      
    if (!isToday) return slots;
    
    // If it is today, filter out past times (plus 30 min buffer)
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes() + 30; // Add 30 min buffer
    
    return slots.filter(slot => {
      const [slotHours, slotMinutes] = slot.split(':').map(Number);
      if (slotHours > currentHour) return true;
      if (slotHours === currentHour && slotMinutes > currentMinute) return true;
      return false;
    });
  };

  const isDateSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const formatTimeSlot = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const groupTimeSlots = (slots) => {
    // Make sure we display all slots
    const allSlots = [...slots];
    
    const morning = allSlots.filter(slot => {
      const hour = parseInt(slot.split(':')[0]);
      return hour >= 6 && hour < 12;
    });
    
    const afternoon = allSlots.filter(slot => {
      const hour = parseInt(slot.split(':')[0]);
      return hour >= 12 && hour < 17;
    });
    
    const evening = allSlots.filter(slot => {
      const hour = parseInt(slot.split(':')[0]);
      return hour >= 17 && hour <= 22;
    });

    return { morning, afternoon, evening };
  };

  const days = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);
  
  // Support both array of strings and array of objects with startTime
  const slotStrings = useMemo(() => {
    return Array.isArray(availableSlots) && availableSlots.length > 0 && typeof availableSlots[0] === 'object'
      ? availableSlots.map(slot => slot.startTime)
      : availableSlots;
  }, [availableSlots]);
    
  // Filter out past time slots for today
  const filteredSlots = useMemo(() => {
    return filterAvailableTimeSlots(slotStrings, selectedDate);
  }, [slotStrings, selectedDate]);
  
  // Group time slots by morning, afternoon, evening
  const { morning, afternoon, evening } = useMemo(() => {
    return groupTimeSlots(filteredSlots);
  }, [filteredSlots]);
  
  // Initialize selected slots from available slots if in doctor view
  useEffect(() => {
    if (isDoctorView && selectedDate) {
      const initialSelectedSlots = {};
      // Use availableSlots directly instead of derived filteredSlots
      const slotsToProcess = Array.isArray(availableSlots) ? availableSlots : [];
      
      slotsToProcess.forEach(slot => {
        // If it's an object with startTime property
        if (typeof slot === 'object' && slot.startTime) {
          initialSelectedSlots[slot.startTime] = slot.available !== false;
        } else {
          // If it's just a string time
          initialSelectedSlots[slot] = true;
        }
      });
      
      setSelectedSlots(initialSelectedSlots);
    }
  }, [isDoctorView, selectedDate, availableSlots]);

  // In the simplified UI, we don't need to toggle slot availability
  const toggleSlotAvailability = (time, isAvailable) => {
    // No-op in simplified view
    if (isDoctorView && onTimeSelect) {
      onTimeSelect(time);
    }
  };
  
  const getSelectedSlotsData = () => {
    if (!selectedDate || !isDoctorView) return [];
    
    // Format as YYYY-MM-DD
    const dateString = selectedDate.toISOString().split('T')[0];
    
    return Object.entries(selectedSlots).map(([time, isAvailable]) => ({
      date: dateString,
      startTime: time,
      endTime: calculateEndTime(time, 30),
      available: isAvailable
    }));
  };
  
  // Calculate end time helper function
  const calculateEndTime = (startTime, duration) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration;
    
    const endHours = Math.floor(endMinutes / 60);
    const remainingMinutes = endMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            iconName="ChevronLeft"
            onClick={() => navigateMonth(-1)}
          />
          <Button
            variant="outline"
            size="sm"
            iconName="ChevronRight"
            onClick={() => navigateMonth(1)}
          />
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card rounded-lg border border-border p-4">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {daysOfWeek.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => (
            <button
              key={index}
              onClick={() => date && isDateAvailable(date) && onDateSelect(date)}
              disabled={!date || !isDateAvailable(date)}
              className={`p-2 h-10 text-sm rounded-lg transition-healthcare ${
                !date
                  ? 'invisible'
                  : isDateSelected(date)
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : isDateAvailable(date)
                  ? 'hover:bg-muted text-foreground'
                  : 'text-muted-foreground cursor-not-allowed opacity-50'
              }`}
            >
              {date?.getDate()}
            </button>
          ))}
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Available Time Slots</h3>
          </div>
          
          {morning.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                <Icon name="Sunrise" size={16} className="mr-2" />
                Morning (6:00 AM - 12:00 PM)
              </h4>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2">
                {morning.map((time) => (
                  <div
                    key={time}
                    className={`p-2 text-sm rounded-lg border transition-healthcare ${
                      selectedTime === time
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-foreground hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <span className="font-medium">{formatTimeSlot(time)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {afternoon.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                <Icon name="Sun" size={16} className="mr-2" />
                Afternoon (12:00 PM - 5:00 PM)
              </h4>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2">
                {afternoon.map((time) => (
                  <div
                    key={time}
                    className={`p-2 text-sm rounded-lg border transition-healthcare ${
                      selectedTime === time
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-foreground hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <span className="font-medium">{formatTimeSlot(time)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {evening.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                <Icon name="Moon" size={16} className="mr-2" />
                Evening (5:00 PM - 10:00 PM)
              </h4>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2">
                {evening.map((time) => (
                  <div
                    key={time}
                    className={`p-2 text-sm rounded-lg border transition-healthcare ${
                      selectedTime === time
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-foreground hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <span className="font-medium">{formatTimeSlot(time)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {morning.length === 0 && afternoon.length === 0 && evening.length === 0 && (
            <div className="text-center py-8">
              <Icon name="Calendar" size={48} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No available slots for this date</p>
              <p className="text-sm text-muted-foreground">Please select another date</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarView;