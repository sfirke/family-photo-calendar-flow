import React, { useState } from 'react';
import EventCard from './EventCard';
import CalendarFilters from './CalendarFilters';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const sampleEvents = [
  {
    id: 1,
    title: 'Team Building Activity',
    time: '1:00 PM - 5:00 PM',
    location: 'Adventure Park',
    attendees: 1,
    category: 'Work',
    color: 'bg-blue-500',
    description: 'Annual team building event with outdoor activities and team challenges.',
    organizer: 'HR Department',
    date: new Date(2024, 11, 15) // Today
  },
  {
    id: 2,
    title: 'Parent-Teacher Conference',
    time: '4:00 PM - 5:00 PM',
    location: 'Elementary School',
    attendees: 1,
    category: 'Kids',
    color: 'bg-orange-500',
    description: 'Quarterly parent-teacher meeting to discuss academic progress.',
    organizer: 'Ms. Johnson',
    date: new Date(2024, 11, 15) // Today
  },
  {
    id: 3,
    title: 'Book Club Meeting',
    time: '7:00 PM - 9:00 PM',
    location: 'Local Library',
    attendees: 1,
    category: 'Personal',
    color: 'bg-purple-500',
    description: 'Monthly book club discussion about "The Great Gatsby".',
    organizer: 'Library Staff',
    date: new Date(2024, 11, 16) // Tomorrow
  },
  {
    id: 4,
    title: 'Family Hiking Trip',
    time: '9:00 AM - 4:00 PM',
    location: 'State Park Trail',
    attendees: 4,
    category: 'Family',
    color: 'bg-green-500',
    description: 'Weekend family adventure exploring nature trails.',
    organizer: 'Dad',
    date: new Date(2024, 11, 17) // Day after tomorrow
  },
  {
    id: 5,
    title: 'Birthday Party',
    time: '3:00 PM - 6:00 PM',
    location: 'Community Center',
    attendees: 1,
    category: 'Personal',
    color: 'bg-purple-500',
    description: 'Celebrating Sarah\'s 8th birthday with friends and family.',
    organizer: 'Mom',
    date: new Date(2024, 11, 16) // Tomorrow
  },
  {
    id: 6,
    title: 'Weekly Meal Prep',
    time: '10:00 AM - 1:00 PM',
    location: 'Home Kitchen',
    attendees: 1,
    category: 'Personal',
    color: 'bg-purple-500',
    description: 'Preparing healthy meals for the upcoming week.',
    organizer: 'Self',
    date: new Date(2024, 11, 17) // Day after tomorrow
  }
];

const Calendar = () => {
  const [viewMode, setViewMode] = useState<'timeline' | 'week'>('timeline');
  const [activeFilters, setActiveFilters] = useState({
    Personal: true,
    Work: true,
    Family: true,
    Kids: true,
    Holidays: true
  });
  const [weekOffset, setWeekOffset] = useState(0); // New state for week navigation

  const filteredEvents = sampleEvents.filter(event => activeFilters[event.category]);

  const getNext3Days = () => {
    const today = new Date();
    const days = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getWeekDays = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7)); // Apply week offset
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const formatDate = (date: Date, format: 'short' | 'long' = 'short') => {
    if (format === 'long') {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getWeekDateRange = () => {
    const weekDays = getWeekDays();
    const firstDay = weekDays[0];
    const lastDay = weekDays[6];
    
    if (firstDay.getMonth() === lastDay.getMonth()) {
      return `${firstDay.toLocaleDateString('en-US', { month: 'long' })} ${firstDay.getDate()} - ${lastDay.getDate()}, ${firstDay.getFullYear()}`;
    } else {
      return `${firstDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${lastDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${firstDay.getFullYear()}`;
    }
  };

  const handlePreviousWeek = () => {
    setWeekOffset(prev => prev - 1);
  };

  const handleNextWeek = () => {
    setWeekOffset(prev => prev + 1);
  };

  const renderTimelineView = () => {
    const next3Days = getNext3Days();
    
    return (
      <div className="space-y-6">
        {next3Days.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <div key={index} className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className={`text-lg font-medium ${isToday ? 'text-yellow-300' : 'text-white'}`}>
                  {formatDate(date, 'long')}
                  {isToday && <span className="ml-2 text-sm text-yellow-300">(Today)</span>}
                </h3>
                <div className="flex-1 h-px bg-white/20"></div>
                <span className="text-sm text-white/60">
                  {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {dayEvents.length > 0 ? (
                <div className="space-y-3 ml-4">
                  {dayEvents.map((event) => (
                    <EventCard 
                      key={event.id} 
                      event={event}
                      className="animate-fade-in"
                    />
                  ))}
                </div>
              ) : (
                <div className="ml-4 text-white/50 text-sm italic">
                  No events scheduled
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays();
    
    return (
      <div className="space-y-4">
        {/* Week Navigation Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousWeek}
            className="text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <h3 className="text-lg font-medium text-white">
            {getWeekDateRange()}
          </h3>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextWeek}
            className="text-white hover:bg-white/20"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((date, index) => {
            const dayEvents = getEventsForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <div key={index} className="space-y-3">
                <div className="text-center">
                  <h3 className={`text-sm font-medium ${isToday ? 'text-yellow-300' : 'text-white'}`}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </h3>
                  <p className={`text-lg ${isToday ? 'text-yellow-300' : 'text-white/80'}`}>
                    {date.getDate()}
                  </p>
                  {isToday && <div className="w-2 h-2 bg-yellow-300 rounded-full mx-auto mt-1"></div>}
                </div>
                
                <div className="space-y-2">
                  {dayEvents.map((event) => (
                    <EventCard 
                      key={event.id} 
                      event={event}
                      className="animate-fade-in text-xs"
                    />
                  ))}
                  {dayEvents.length === 0 && (
                    <div className="text-white/30 text-xs text-center py-4">
                      No events
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Calendar Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <CalendarFilters 
          activeFilters={activeFilters}
          onFiltersChange={setActiveFilters}
        />
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'timeline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setViewMode('timeline');
              setWeekOffset(0); // Reset week offset when switching to timeline
            }}
            className={viewMode === 'timeline' 
              ? "bg-white/30 border-white/30 text-white hover:bg-white/40" 
              : "bg-white/20 border-white/30 text-white hover:bg-white/30"
            }
          >
            Timeline
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
            className={viewMode === 'week' 
              ? "bg-white/30 border-white/30 text-white hover:bg-white/40" 
              : "bg-white/20 border-white/30 text-white hover:bg-white/30"
            }
          >
            Week
          </Button>
        </div>

        <div className="text-sm text-white/70 ml-auto">
          Upcoming Events ({filteredEvents.length})
        </div>
      </div>

      {/* Events Display */}
      <div className="animate-fade-in">
        {viewMode === 'timeline' ? renderTimelineView() : renderWeekView()}
      </div>
    </div>
  );
};

export default Calendar;
