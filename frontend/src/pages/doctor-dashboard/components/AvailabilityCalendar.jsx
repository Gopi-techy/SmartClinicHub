import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AvailabilityCalendar = ({ availability, onUpdateAvailability, onQuickNote }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
  const [showNotes, setShowNotes] = useState(false);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  const getWeekDates = (date) => {
    const week = [];
    const startDate = new Date(date);
    const day = startDate.getDay();
    startDate.setDate(startDate.getDate() - day);

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      week.push(currentDate);
    }
    return week;
  };

  const getMonthDates = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const dates = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= lastDay || dates.length % 7 !== 0) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  const isAvailable = (date, time) => {
    const dateStr = date.toISOString().split('T')[0];
    return availability[dateStr]?.includes(time) || false;
  };

  const toggleAvailability = (date, time) => {
    const dateStr = date.toISOString().split('T')[0];
    const currentSlots = availability[dateStr] || [];
    const newSlots = currentSlots.includes(time)
      ? currentSlots.filter(slot => slot !== time)
      : [...currentSlots, time];
    
    onUpdateAvailability(dateStr, newSlots);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setSelectedDate(newDate);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  const weekDates = getWeekDates(selectedDate);
  const monthDates = getMonthDates(selectedDate.getFullYear(), selectedDate.getMonth());

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground flex items-center">
          <Icon name="Calendar" size={24} className="mr-2 text-primary" />
          Availability Calendar
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            variant={showNotes ? 'default' : 'outline'}
            size="sm"
            iconName="StickyNote"
            onClick={() => setShowNotes(!showNotes)}
          />
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="px-3"
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
              className="px-3"
            >
              Month
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          size="sm"
          iconName="ChevronLeft"
          onClick={() => viewMode === 'week' ? navigateWeek(-1) : navigateMonth(-1)}
        />
        <h3 className="text-lg font-medium text-foreground">
          {viewMode === 'week' 
            ? `Week of ${formatDate(weekDates[0])}`
            : `${months[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
          }
        </h3>
        <Button
          variant="outline"
          size="sm"
          iconName="ChevronRight"
          onClick={() => viewMode === 'week' ? navigateWeek(1) : navigateMonth(1)}
        />
      </div>

      {viewMode === 'week' ? (
        /* Week View */
        <div className="space-y-4">
          <div className="grid grid-cols-8 gap-2 text-sm">
            <div className="font-medium text-muted-foreground">Time</div>
            {weekDates.map((date, index) => (
              <div key={index} className="text-center">
                <div className="font-medium text-foreground">{daysOfWeek[date.getDay()]}</div>
                <div className="text-muted-foreground">{date.getDate()}</div>
              </div>
            ))}
          </div>
          
          <div className="max-h-64 overflow-y-auto space-y-1">
            {timeSlots.map((time) => (
              <div key={time} className="grid grid-cols-8 gap-2">
                <div className="text-sm text-muted-foreground py-2">{time}</div>
                {weekDates.map((date, index) => (
                  <button
                    key={index}
                    onClick={() => toggleAvailability(date, time)}
                    className={`p-2 rounded text-xs transition-healthcare ${
                      isAvailable(date, time)
                        ? 'bg-success text-success-foreground'
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    }`}
                  >
                    {isAvailable(date, time) ? 'Available' : 'Blocked'}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Month View */
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-2 text-sm">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {monthDates.map((date, index) => {
              const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
              const isToday = date.toDateString() === currentDate.toDateString();
              const dateStr = date.toISOString().split('T')[0];
              const availableSlots = availability[dateStr]?.length || 0;
              
              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={`p-3 rounded-lg text-sm transition-healthcare ${
                    isCurrentMonth
                      ? isToday
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card hover:bg-muted text-foreground' :'text-muted-foreground'
                  } ${selectedDate.toDateString() === date.toDateString() ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className="font-medium">{date.getDate()}</div>
                  {isCurrentMonth && availableSlots > 0 && (
                    <div className="text-xs text-success mt-1">
                      {availableSlots} slots
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Notes Section */}
      {showNotes && (
        <div className="mt-6 pt-6 border-t border-border">
          <h4 className="font-medium text-foreground mb-3 flex items-center">
            <Icon name="StickyNote" size={16} className="mr-2" />
            Quick Notes
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            <div className="text-sm bg-muted p-3 rounded-lg">
              <div className="font-medium text-foreground">Today's Reminders</div>
              <div className="text-muted-foreground mt-1">
                • Follow up with Patient #1234 about test results\n
                • Update availability for next week\n
                • Review prescription refill requests
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            iconName="Plus"
            onClick={onQuickNote}
            className="mt-3"
          >
            Add Note
          </Button>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-success rounded"></div>
            <span className="text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-muted rounded"></div>
            <span className="text-muted-foreground">Blocked</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-primary rounded"></div>
            <span className="text-muted-foreground">Today</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;