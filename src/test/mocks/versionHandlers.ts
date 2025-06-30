
import { http, HttpResponse } from 'msw';

export const versionHandlers = [
  http.get('/version.json', () => {
    return HttpResponse.json({
      version: '1.4.2',
      buildDate: '2024-01-01T00:00:00.000Z',
      gitHash: 'abc123',
      buildNumber: 1,
      environment: 'test'
    });
  }),
];
