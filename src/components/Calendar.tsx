import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, format, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Settings, Sun, Moon } from 'lucide-react';
import { useLocalEvents } from '@/hooks/useLocalEvents';
import { useCalendarSelection } from '@/hooks/useCalendarSelection';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';

const Calendar = () => {
  const { user } = useAuth();
  const { events, isLoading, refreshEvents } = useLocalEvents();
  const { selectedCalendarIds } = useCalendarSelection();
  const { settings } = useSettings();
  const { theme, toggleTheme } = useTheme();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Filter events based on selected calendars
  const filteredEvents = useMemo(() => {
    return events.filter(event => selectedCalendarIds.includes(event.calendarId));
  }, [events, selectedCalendarIds]);

  // Get events for the selected date
  const eventsForSelectedDate = useMemo(() => {
    return filteredEvents.filter(event => {
      const eventDate = event.date instanceof Date ? event.date : parseISO(event.date);
      return isSameDay(eventDate, selectedDate);
    });
  }, [filteredEvents, selectedDate]);

  // Generate calendar grid for current month
  const calendarGrid = useMemo(() => {
    const startMonth = startOfMonth(currentMonth);
    const endMonth = endOfMonth(currentMonth);
    const startDate = startOfWeek(startMonth, { weekStartsOn: 0 });
    const endDate = endOfWeek(endMonth, { weekStartsOn: 0 });

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = new Date(day.getTime() + 24 * 60 * 60 * 1000); // Add one day
    }

    return days;
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
  };

  const getBackgroundStyle = useCallback(() => {
    if (settings.backgroundImage) {
      return {
        backgroundImage: `url(${settings.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return {};
  }, [settings.backgroundImage]);

  return (
    <div className="calendar-app min-h-screen" style={getBackgroundStyle()}>
      <div className="max-w-5xl mx-auto p-4">
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePrevMonth}
              aria-label="Previous Month"
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <button
              onClick={handleNextMonth}
              aria-label="Next Month"
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-800" />}
            </button>
            <button
              onClick={refreshEvents}
              aria-label="Refresh Events"
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              aria-label="Settings"
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={() => {
                // Open settings modal or navigate to settings page
                // This can be implemented as needed
              }}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="uppercase tracking-wide">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarGrid.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = isSameDay(day, selectedDate);
            const dayEvents = filteredEvents.filter(event => {
              const eventDate = event.date instanceof Date ? event.date : parseISO(event.date);
              return isSameDay(eventDate, day);
            });

            return (
              <button
                key={index}
                onClick={() => handleDateClick(day)}
                className={`relative p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1
                  ${isCurrentMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600'}
                  ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}
                `}
                aria-current={isSelected ? 'date' : undefined}
              >
                <time dateTime={format(day, 'yyyy-MM-dd')}>
                  {format(day, 'd')}
                </time>
                {dayEvents.length > 0 && (
                  <span className="absolute bottom-1 left-1 right-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        <section className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Events on {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          {isLoading ? (
            <p className="text-gray-600 dark:text-gray-400">Loading events...</p>
          ) : eventsForSelectedDate.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No events for this day.</p>
          ) : (
            <ul className="space-y-2">
              {eventsForSelectedDate.map((event) => (
                <li
                  key={event.id}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                >
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{event.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{event.time || format(event.date, 'p')}</p>
                  {event.location && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">Location: {event.location}</p>
                  )}
                  {event.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{event.description}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default Calendar;
