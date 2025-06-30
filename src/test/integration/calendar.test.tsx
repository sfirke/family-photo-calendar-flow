
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../utils/testUtils';
import { BrowserRouter } from 'react-router-dom';
import Index from '@/pages/Index';

// Mock the calendar storage
vi.mock('@/services/calendarStorage', () => ({
  getCalendars: vi.fn().mockResolvedValue([
    {
      id: 'test-calendar',
      name: 'Test Calendar',
      color: '#3B82F6',
      visible: true,
      type: 'local'
    }
  ]),
  getEvents: vi.fn().mockResolvedValue([
    {
      id: '1',
      title: 'Test Event',
      start: new Date(),
      end: new Date(Date.now() + 3600000),
      allDay: false,
      calendarId: 'test-calendar'
    }
  ]),
}));

// Mock the weather context
vi.mock('@/contexts/WeatherContext', () => ({
  useWeather: () => ({
    weatherData: {
      temperature: 75,
      condition: 'Sunny',
      location: 'Beverly Hills, US'
    },
    isLoading: false,
    getWeatherForDate: vi.fn().mockReturnValue({ temp: 75, condition: 'Sunny' }),
    getCurrentWeather: vi.fn().mockReturnValue({ temp: 75, condition: 'Sunny', location: 'Beverly Hills, US' }),
    refreshWeather: vi.fn(),
  }),
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
