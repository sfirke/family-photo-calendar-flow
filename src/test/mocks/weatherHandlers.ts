
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
];
