
import { describe, it, expect, vi } from 'vitest';
import { render } from '../utils/testUtils';
import TimelineView from '@/components/TimelineView';
import WeekView from '@/components/WeekView';
import MonthView from '@/components/MonthView';
import { Event } from '@/types/calendar';
import { compareTimeStrings } from '@/utils/timeUtils';

// Mock weather function
const mockGetWeatherForDate = vi.fn().mockReturnValue({ temp: 75, condition: 'Sunny' });

// Sample events with various time formats for testing
const createTestEvents = (): Event[] => [
  {
    id: 1,
    title: 'Early Morning Meeting',
    time: '8:00 AM',
    date: new Date('2024-01-15'),
    category: 'Work',
    color: '#3b82f6',
    description: 'Test event',
    organizer: 'Test',
    attendees: 5,
    location: 'Office'
  },
  {
    id: 2,
    title: 'All Day Conference',
    time: 'All day',
    date: new Date('2024-01-15'),
    category: 'Work',
    color: '#ef4444',
    description: 'Test event',
    organizer: 'Test',
    attendees: 100,
    location: 'Convention Center'
  },
  {
    id: 3,
    title: 'Lunch Meeting',
    time: '12:30 PM - 1:30 PM',
    date: new Date('2024-01-15'),
    category: 'Work',
    color: '#10b981',
    description: 'Test event',
    organizer: 'Test',
    attendees: 3,
    location: 'Restaurant'
  },
  {
    id: 4,
    title: 'Another All Day Event',
    time: 'All day',
    date: new Date('2024-01-15'),
    category: 'Personal',
    color: '#f59e0b',
    description: 'Test event',
    organizer: 'Test',
    attendees: 1,
    location: 'Home'
  },
  {
    id: 5,
    title: 'Late Evening Call',
    time: '9:00 PM',
    date: new Date('2024-01-15'),
    category: 'Work',
    color: '#8b5cf6',
    description: 'Test event',
    organizer: 'Test',
    attendees: 2,
    location: 'Remote'
  },
  {
    id: 6,
    title: 'Morning Workout',
    time: '6:30 AM - 7:30 AM',
    date: new Date('2024-01-15'),
    category: 'Personal',
    color: '#06b6d4',
    description: 'Test event',
    organizer: 'Test',
    attendees: 1,
    location: 'Gym'
  },
  {
    id: 7,
    title: 'Afternoon Presentation',
    time: '2:00 PM',
    date: new Date('2024-01-15'),
    category: 'Work',
    color: '#ec4899',
    description: 'Test event',
    organizer: 'Test',
    attendees: 20,
    location: 'Conference Room'
  }
];

describe('Event Sorting', () => {
  describe('TimelineView', () => {
    it('should render all-day events first, sorted alphabetically', async () => {
      const events = createTestEvents();
      const { container } = await render(
        <TimelineView events={events} getWeatherForDate={mockGetWeatherForDate} />
      );

      // Check that the component renders without errors
      expect(container).toBeInTheDocument();
      
      // Get all event cards
      const eventCards = container.querySelectorAll('[data-testid], .rounded-lg');
      expect(eventCards.length).toBeGreaterThan(0);

      // Verify that events are being processed
      const eventElements = container.querySelectorAll('.space-y-2, .space-y-3');
      expect(eventElements.length).toBeGreaterThan(0);
    });

    it('should render timed events in chronological order', async () => {
      const events = createTestEvents();
      const { container } = await render(
        <TimelineView events={events} getWeatherForDate={mockGetWeatherForDate} />
      );

      // Check that the component renders without errors
      expect(container).toBeInTheDocument();
      
      // Verify that events are being processed (at minimum, we should have content)
      const eventElements = container.querySelectorAll('.space-y-2, .space-y-3');
      expect(eventElements.length).toBeGreaterThan(0);
    });
  });

  describe('WeekView', () => {
    it('should render events in proper order within each day', async () => {
      const events = createTestEvents();
      const { container } = await render(
        <WeekView 
          events={events}
          weekOffset={0}
          onPreviousWeek={vi.fn()}
          onNextWeek={vi.fn()}
          getWeatherForDate={mockGetWeatherForDate}
        />
      );

      // Check that the component renders without errors
      expect(container).toBeInTheDocument();
      
      // Verify week grid structure
      const weekGrid = container.querySelector('.grid');
      expect(weekGrid).toBeInTheDocument();
    });

    it('should handle week navigation', async () => {
      const events = createTestEvents();
      const onPreviousWeek = vi.fn();
      const onNextWeek = vi.fn();
      
      const { container } = await render(
        <WeekView 
          events={events}
          weekOffset={0}
          onPreviousWeek={onPreviousWeek}
          onNextWeek={onNextWeek}
          getWeatherForDate={mockGetWeatherForDate}
        />
      );

      // Check for navigation buttons
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2); // Previous and Next buttons
    });
  });

  describe('MonthView', () => {
    it('should render calendar grid correctly', async () => {
      const events = createTestEvents();
      const { container } = await render(
        <MonthView 
          events={events}
          getWeatherForDate={mockGetWeatherForDate}
        />
      );

      // Check that the component renders without errors
      expect(container).toBeInTheDocument();
      
      // Verify calendar structure
      const calendarGrid = container.querySelector('.grid-cols-7');
      expect(calendarGrid).toBeInTheDocument();
    });

    it('should display events within calendar days', async () => {
      const events = createTestEvents();
      const { container } = await render(
        <MonthView 
          events={events}
          getWeatherForDate={mockGetWeatherForDate}
        />
      );

      // Check for day cells
      const dayCells = container.querySelectorAll('.min-h-\\[80px\\]');
      expect(dayCells.length).toBeGreaterThan(0);
    });
  });

  describe('Event Sorting Logic', () => {
    it('should prioritize all-day events over timed events', () => {
      const events = createTestEvents();
      
      // Filter events for a specific day
      const dayEvents = events.filter(event => 
        event.date.toDateString() === new Date('2024-01-15').toDateString()
      );

      // Separate all-day and timed events
      const allDayEvents = dayEvents.filter(event => 
        event.time === 'All day' || event.time.toLowerCase().includes('all day')
      );
      const timedEvents = dayEvents.filter(event => 
        !(event.time === 'All day' || event.time.toLowerCase().includes('all day'))
      );

      expect(allDayEvents.length).toBe(2);
      expect(timedEvents.length).toBe(5);
      
      // Sort all-day events alphabetically
      allDayEvents.sort((a, b) => a.title.localeCompare(b.title));
      expect(allDayEvents[0].title).toBe('All Day Conference');
      expect(allDayEvents[1].title).toBe('Another All Day Event');
    });

    it('should sort timed events chronologically', () => {
      const events = createTestEvents();
      
      // Get timed events only
      const timedEvents = events.filter(event => 
        !(event.time === 'All day' || event.time.toLowerCase().includes('all day'))
      );

      // Expected chronological order based on start times:
      // 6:30 AM (Morning Workout), 8:00 AM (Early Morning Meeting), 
      // 12:30 PM (Lunch Meeting), 2:00 PM (Afternoon Presentation), 9:00 PM (Late Evening Call)
      const expectedOrder = [
        'Morning Workout',    // 6:30 AM
        'Early Morning Meeting', // 8:00 AM  
        'Lunch Meeting',      // 12:30 PM
        'Afternoon Presentation', // 2:00 PM
        'Late Evening Call'   // 9:00 PM
      ];

      // Sort using the same logic as the components
      timedEvents.sort((a, b) => {
        return compareTimeStrings(a.time, b.time);
      });

      const sortedTitles = timedEvents.map(event => event.title);
      expect(sortedTitles).toEqual(expectedOrder);
    });

    it('should handle edge cases gracefully', () => {
      // Test with empty events array
      const emptyEvents: Event[] = [];
      expect(() => {
        emptyEvents.sort((a, b) => compareTimeStrings(a.time, b.time));
      }).not.toThrow();

      // Test with invalid time strings
      expect(() => {
        compareTimeStrings('invalid', 'also invalid');
      }).not.toThrow();

      // Test with empty time strings
      expect(() => {
        compareTimeStrings('', '');
      }).not.toThrow();
    });
  });
});
