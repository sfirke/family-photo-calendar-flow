
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../utils/testUtils';
import { BrowserRouter } from 'react-router-dom';
import Index from '@/pages/Index';

// Mock the calendar storage with all exports and methods
vi.mock('@/services/calendarStorage', () => ({
  calendarStorageService: {
    init: vi.fn().mockResolvedValue(undefined),
    addCalendar: vi.fn().mockResolvedValue(undefined),
    updateCalendar: vi.fn().mockResolvedValue(undefined),
    deleteCalendar: vi.fn().mockResolvedValue(undefined),
    getAllCalendars: vi.fn().mockResolvedValue([
      {
        id: 'test-calendar',
        name: 'Test Calendar',
        url: 'https://example.com/calendar.ics',
        color: '#3B82F6',
        enabled: true,
        lastSync: new Date().toISOString(),
        eventCount: 5,
      }
    ]),
    getCalendar: vi.fn().mockResolvedValue({
      id: 'test-calendar',
      name: 'Test Calendar',
      url: 'https://example.com/calendar.ics',
      color: '#3B82F6',
      enabled: true,
    }),
  },
  CalendarFeed: vi.fn(),
}));

// Mock local events and calendars
vi.mock('@/hooks/useLocalEvents', () => ({
  useLocalEvents: vi.fn(() => ({
    events: [
      {
        id: '1',
        title: 'Test Event',
        start: new Date(),
        end: new Date(Date.now() + 3600000),
        allDay: false,
        calendarId: 'test-calendar'
      }
    ],
    isLoading: false,
    error: null,
    addEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
  })),
}));

vi.mock('@/hooks/useLocalCalendars', () => ({
  useLocalCalendars: vi.fn(() => ({
    calendars: [
      {
        id: 'test-calendar',
        name: 'Test Calendar',
        color: '#3B82F6',
        visible: true,
        type: 'local'
      }
    ],
    isLoading: false,
    addCalendar: vi.fn(),
    updateCalendar: vi.fn(),
    deleteCalendar: vi.fn(),
  })),
}));

// Mock the weather context with all exports
vi.mock('@/contexts/WeatherContext', () => ({
  WeatherProvider: ({ children }: { children: React.ReactNode }) => children,
  useWeather: vi.fn(() => ({
    weatherData: {
      temperature: 75,
      condition: 'Sunny',
      location: 'Beverly Hills, US',
      forecast: []
    },
    isLoading: false,
    error: null,
    getWeatherForDate: vi.fn().mockReturnValue({ temp: 75, condition: 'Sunny' }),
    getCurrentWeather: vi.fn().mockReturnValue({ temp: 75, condition: 'Sunny', location: 'Beverly Hills, US' }),
    refreshWeather: vi.fn(),
  })),
}));

describe('Calendar Integration', () => {
  const renderCalendar = () => {
    return render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );
  };

  it('should render the calendar application', async () => {
    renderCalendar();

    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    // Check for key calendar components
    expect(screen.getByText(/family calendar/i)).toBeInTheDocument();
  });

  it('should display weather information', async () => {
    renderCalendar();

    await waitFor(() => {
      expect(screen.getByText(/75/)).toBeInTheDocument();
      expect(screen.getByText(/sunny/i)).toBeInTheDocument();
    });
  });
});
