
import React from 'react';
import { format, addDays, startOfWeek, isSameDay, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Event } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import EventCard from './EventCard';
import WeatherDisplay from './WeatherDisplay';

import { compareTimeStrings } from '@/utils/timeUtils';

interface WeekViewProps {
  events: Event[];
  weekOffset: number;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  getWeatherForDate: (date: Date) => { temp: number; condition: string; highTemp?: number; lowTemp?: number };
  onNotionEventClick?: (event: Event) => void;
}

const WeekView = ({ events, weekOffset, onPreviousWeek, onNextWeek, getWeatherForDate, onNotionEventClick }: WeekViewProps) => {
  try {
    const today = new Date();
    const weekStart = addDays(startOfWeek(today, { weekStartsOn: 0 }), weekOffset * 7);
    
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    // Helper function to check if an event is all-day
    const isAllDayEvent = (event: Event) => {
      try {
        return event.time === 'All day' || event.time.toLowerCase().includes('all day');
      } catch (error) {
        console.warn('Error checking if event is all-day:', error);
        return false;
      }
    };

    // Helper function to check if an event spans multiple days - VERY CONSERVATIVE
    const isMultiDayEvent = (event: Event) => {
      try {
        // Only return true if the event explicitly has isMultiDay property set to true
        return 'isMultiDay' in event && event.isMultiDay === true;
      } catch (error) {
        console.warn('Error checking if event is multi-day:', error);
        return false;
      }
    };

    // Get events for each day - STRICT date matching with proper multi-day range checking
    const getEventsForDay = (day: Date) => {
      try {
        if (!events || !Array.isArray(events)) return [];
        
        const dayStart = startOfDay(day);
        
        return events.filter(event => {
          try {
            if (!event || !event.date) return false;
            
            const eventDate = startOfDay(new Date(event.date));
            
            // For explicitly multi-day events, we need to check if this day falls within their range
            if (isMultiDayEvent(event)) {
              // For now, we'll be conservative and only show on the exact event date
              // TODO: Implement proper date range checking when we have end dates
              return eventDate.getTime() === dayStart.getTime();
            }
            
            // For single-day events, ONLY show on the exact date
            return eventDate.getTime() === dayStart.getTime();
          } catch (error) {
            console.warn('Error filtering event for day:', error);
            return false;
          }
        });
      } catch (error) {
        console.warn('Error getting events for day:', error);
        return [];
      }
    };

    // Group events by day and categorize them
    const eventsByDay = weekDays.map(day => {
      try {
        const dayEvents = getEventsForDay(day);
        
        // Separate all-day events from timed events
        const allDayEvents = dayEvents.filter(isAllDayEvent);
        const timedEvents = dayEvents.filter(event => !isAllDayEvent(event));
        
        // Sort all-day events alphabetically by title
        allDayEvents.sort((a, b) => {
          try {
            return (a.title || '').localeCompare(b.title || '');
          } catch (error) {
            console.warn('Error sorting all-day events:', error);
            return 0;
          }
        });
        
        // Sort timed events chronologically by start time
        timedEvents.sort((a, b) => {
          try {
            return compareTimeStrings(a.time || '', b.time || '');
          } catch (error) {
            console.warn('Error sorting timed events:', error);
            return 0;
          }
        });
        
        return { 
          day, 
          allDayEvents,
          timedEvents,
          totalEvents: dayEvents.length
        };
      } catch (error) {
        console.warn('Error grouping events for day:', error);
        return { 
          day, 
          allDayEvents: [],
          timedEvents: [],
          totalEvents: 0
        };
      }
    });

    return (
      <div className="space-y-4">
        {/* Responsive Week Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousWeek}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-600/20 h-9 w-9 sm:h-10 sm:w-auto sm:px-4"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Previous</span>
          </Button>
          
          <div className="text-center px-2">
            <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white">
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </h2>
            
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onNextWeek}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-600/20 h-9 w-9 sm:h-10 sm:w-auto sm:px-4"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Next</span>
          </Button>
        </div>

        {/* Responsive Week Grid - Stack on mobile, grid on larger screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2 sm:gap-3 md:gap-4">
          {eventsByDay.map(({ day, allDayEvents, timedEvents }, index) => {
            try {
              return (
                <div key={index} className="rounded-lg p-2 sm:p-3 md:p-4 min-h-[200px] sm:min-h-[250px] lg:min-h-[300px] overflow-hidden">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="text-center sm:text-left">
                      <div className="text-xs sm:text-sm font-medium text-white">
                        {format(day, 'EEE')}
                      </div>
                      <div className="text-base sm:text-lg font-bold text-white">
                        {format(day, 'd')}
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <WeatherDisplay 
                        weather={getWeatherForDate(day)}
                        className="text-xs"
                        forceWhite={true}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1 sm:space-y-2 overflow-hidden">
                    {/* All-day events at the top */}
                    {allDayEvents.map(event => (
                      <div key={`${event.id}-${format(day, 'yyyy-MM-dd')}`} className="truncate">
                        <EventCard 
                          event={event} 
                          viewMode="week" 
                          isMultiDayDisplay={isMultiDayEvent(event)}
                          onNotionEventClick={onNotionEventClick}
                        />
                      </div>
                    ))}
                    
                    {/* Timed events below */}
                    {timedEvents.map(event => (
                      <div key={event.id} className="truncate">
                        <EventCard event={event} viewMode="week" onNotionEventClick={onNotionEventClick} />
                      </div>
                    ))}
                    
                    {allDayEvents.length === 0 && timedEvents.length === 0 && (
                      <p className="text-xs text-white/70 italic">No events</p>
                    )}
                  </div>
                </div>
              );
            } catch (error) {
              console.warn('Error rendering day in week view:', error);
              return (
                <div key={index} className="rounded-lg p-2 sm:p-3 md:p-4 min-h-[200px] sm:min-h-[250px] lg:min-h-[300px] overflow-hidden">
                  <p className="text-xs text-white/70 italic">Error loading day</p>
                </div>
              );
            }
          })}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Critical error in WeekView:', error);
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm sm:text-base">Unable to display week view</p>
      </div>
    );
  }
};

export default WeekView;
