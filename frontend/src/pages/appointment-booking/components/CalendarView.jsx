import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CalendarView = ({ selectedDate, onDateSelect, availableSlots, onTimeSelect, selectedTime }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
    const morning = slots.filter(slot => {
      const hour = parseInt(slot.split(':')[0]);
      return hour >= 6 && hour < 12;
    });
    
    const afternoon = slots.filter(slot => {
      const hour = parseInt(slot.split(':')[0]);
      return hour >= 12 && hour < 17;
    });
    
    const evening = slots.filter(slot => {
      const hour = parseInt(slot.split(':')[0]);
      return hour >= 17 && hour < 22;
    });

    return { morning, afternoon, evening };
  };

  const days = getDaysInMonth(currentMonth);
  // Support both array of strings and array of objects with startTime
  const slotStrings = Array.isArray(availableSlots) && availableSlots.length > 0 && typeof availableSlots[0] === 'object'
    ? availableSlots.map(slot => slot.startTime)
    : availableSlots;
  const { morning, afternoon, evening } = groupTimeSlots(slotStrings);

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
          <h3 className="text-lg font-semibold text-foreground">Available Time Slots</h3>
          
          {morning.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                <Icon name="Sunrise" size={16} className="mr-2" />
                Morning (6:00 AM - 12:00 PM)
              </h4>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {morning.map((time) => (
                  <button
                    key={time}
                    onClick={() => onTimeSelect(time)}
                    className={`p-2 text-sm rounded-lg border transition-healthcare ${
                      selectedTime === time
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-foreground hover:border-primary/50'
                    }`}
                  >
                    {formatTimeSlot(time)}
                  </button>
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
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {afternoon.map((time) => (
                  <button
                    key={time}
                    onClick={() => onTimeSelect(time)}
                    className={`p-2 text-sm rounded-lg border transition-healthcare ${
                      selectedTime === time
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-foreground hover:border-primary/50'
                    }`}
                  >
                    {formatTimeSlot(time)}
                  </button>
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
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {evening.map((time) => (
                  <button
                    key={time}
                    onClick={() => onTimeSelect(time)}
                    className={`p-2 text-sm rounded-lg border transition-healthcare ${
                      selectedTime === time
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-foreground hover:border-primary/50'
                    }`}
                  >
                    {formatTimeSlot(time)}
                  </button>
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