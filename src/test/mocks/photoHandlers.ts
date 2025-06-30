
import { http, HttpResponse } from 'msw';

export const photoHandlers = [
  http.get('https://lh3.googleusercontent.com/*', () => {
    return HttpResponse.text(`
      <script>
        window.viewerData = {
          "photos": [
            {
              "id": "test-photo-1",
              "url": "https://lh3.googleusercontent.com/test1.jpg",
              "width": 1920,
              "height": 1080
            }
          ]
        };
      </script>
    `);
  }),
];
