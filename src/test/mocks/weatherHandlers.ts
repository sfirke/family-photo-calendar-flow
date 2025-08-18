
import { http, HttpResponse } from 'msw';

export const weatherHandlers = [
  http.get('https://api.openweathermap.org/data/2.5/weather', () => {
    return HttpResponse.json({
      main: { temp: 75.2 },
      weather: [{ main: 'Clear', description: 'clear sky' }],
      name: 'Beverly Hills',
      sys: { country: 'US' }
    });
  }),

  http.get('https://api.openweathermap.org/data/2.5/forecast', () => {
    return HttpResponse.json({
      list: [
        {
          dt: Math.floor(Date.now() / 1000),
          main: { temp_max: 78, temp_min: 65 },
          weather: [{ main: 'Sunny', description: 'sunny' }],
          dt_txt: new Date().toISOString().split('T')[0]
        }
      ]
    });
  }),

  // NWS API: points endpoint
  http.get('https://api.weather.gov/points/:lat,:lon', ({ params }) => {
    const { lat, lon } = params;
    // Provide deterministic grid info for tests
    const gridId = 'TEST';
    const gridX = 1;
    const gridY = 1;
    return HttpResponse.json({
      properties: {
        forecast: `https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}/forecast`,
        observationStations: `https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}/stations`,
        gridId,
        gridX,
        gridY,
        relativeLocation: {
          properties: {
            city: 'Test City',
            state: 'TS',
            name: 'Test City, TS'
          }
        },
        forecastHourly: `https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}/forecast/hourly`
      }
    });
  }),

  // NWS API: forecast endpoint
  http.get('https://api.weather.gov/gridpoints/:office/:gridX,:gridY/forecast', ({ params }) => {
    const periods = Array.from({ length: 14 }).map((_, i) => ({
      number: i + 1,
      name: i % 2 === 0 ? 'Day' + (i/2 + 1) : 'Night' + (Math.floor(i/2) + 1),
      startTime: new Date(Date.now() + i * 6 * 3600 * 1000).toISOString(),
      endTime: new Date(Date.now() + (i + 1) * 6 * 3600 * 1000).toISOString(),
      isDaytime: i % 2 === 0,
      temperature: i % 2 === 0 ? 75 + (i % 3) : 60 + (i % 3),
      temperatureUnit: 'F',
      windSpeed: '5 mph',
      windDirection: 'NW',
      shortForecast: 'Clear',
      detailedForecast: 'Clear skies expected.'
    }));
    return HttpResponse.json({ properties: { periods } });
  }),

  // NWS API: stations list
  http.get('https://api.weather.gov/gridpoints/:office/:gridX,:gridY/stations', () => {
    return HttpResponse.json({
      features: [
        { properties: { stationIdentifier: 'TEST1', name: 'Test Station 1' } },
        { properties: { stationIdentifier: 'TEST2', name: 'Test Station 2' } }
      ]
    });
  }),

  // NWS API: latest observation
  http.get('https://api.weather.gov/stations/:stationId/observations/latest', ({ params }) => {
    return HttpResponse.json({
      properties: {
        station: params.stationId,
        name: 'Test Station 1',
        textDescription: 'Clear',
        temperature: { value: 22 }, // Celsius
        relativeHumidity: { value: 40 },
        windSpeed: { value: 2 }, // m/s
      }
    });
  }),
];
