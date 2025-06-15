
import React, { useState } from 'react';
import EventCard from './EventCard';
import CalendarFilters from './CalendarFilters';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const sampleEvents = [
  {
    id: 1,
    title: 'Team Building Activity',
    time: '1:00 PM - 5:00 PM',
    location: 'Adventure Park',
    attendees: 1,
    category: 'Work',
    color: 'bg-blue-500'
  },
  {
    id: 2,
    title: 'Parent-Teacher Conference',
    time: '4:00 PM - 5:00 PM',
    location: 'Elementary School',
    attendees: 1,
    category: 'Kids',
    color: 'bg-orange-500'
  },
  {
    id: 3,
    title: 'Book Club Meeting',
    time: '7:00 PM - 9:00 PM',
    location: 'Local Library',
    attendees: 1,
    category: 'Personal',
    color: 'bg-purple-500'
  },
  {
    id: 4,
    title: 'Family Hiking Trip',
    time: '9:00 AM - 4:00 PM',
    location: 'State Park Trail',
    attendees: 4,
    category: 'Family',
    color: 'bg-green-500'
  },
  {
    id: 5,
    title: 'Birthday Party',
    time: '3:00 PM - 6:00 PM',
    location: 'Community Center',
    attendees: 1,
    category: 'Personal',
    color: 'bg-purple-500'
  },
  {
    id: 6,
    title: 'Weekly Meal Prep',
    time: '10:00 AM - 1:00 PM',
    location: 'Home Kitchen',
    attendees: 1,
    category: 'Personal',
    color: 'bg-purple-500'
  }
];

const Calendar = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    Personal: true,
    Work: true,
    Family: true,
    Kids: true,
    Holidays: true
  });

  const filteredEvents = sampleEvents.filter(event => activeFilters[event.category]);

  return (
    <div className="space-y-6">
      {/* Calendar Filters Toggle */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => setShowFilters(!showFilters)}
          className="text-white hover:bg-white/20 flex items-center gap-2"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          Calendars ({Object.values(activeFilters).filter(Boolean).length})
        </Button>
        <div className="text-sm text-white/70">
          Upcoming Events ({filteredEvents.length})
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="animate-fade-in">
          <CalendarFilters 
            activeFilters={activeFilters}
            onFiltersChange={setActiveFilters}
          />
        </div>
      )}

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.map((event) => (
          <EventCard 
            key={event.id} 
            event={event}
            className="animate-fade-in"
          />
        ))}
      </div>
    </div>
  );
};

export default Calendar;
