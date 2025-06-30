
export const mockWeatherData = {
  temperature: 75,
  condition: 'Sunny',
  location: 'Beverly Hills, US',
  forecast: [
    {
      date: new Date().toISOString().split('T')[0],
      high: 78,
      low: 65,
      condition: 'Sunny',
      temp: 75
    }
  ]
};

export const mockEvents = [
  {
    id: '1',
    title: 'Test Event',
    start: new Date(),
    end: new Date(Date.now() + 3600000),
    allDay: false,
    calendarId: 'test-calendar'
  }
];

export const mockCalendar = {
  id: 'test-calendar',
  name: 'Test Calendar',
  color: '#3B82F6',
  visible: true,
  type: 'local' as const
};

export const mockPhotoData = [
  {
    id: 'test-photo-1',
    url: 'https://lh3.googleusercontent.com/test1.jpg',
    width: 1920,
    height: 1080
  }
];
