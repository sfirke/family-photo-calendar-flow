
export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  forecast: WeatherForecastDay[];
}

export interface WeatherForecastDay {
  date: string;
  temp?: number;
  high?: number;
  low?: number;
  condition: string;
}

export interface WeatherTestResult {
  success: boolean;
  message: string;
  data?: WeatherData;
}

export interface WeatherApiResponse {
  name: string;
  main: {
    temp: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
}

export interface WeatherForecastResponse {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      temp_min: number;
      temp_max: number;
    };
    weather: Array<{
      main: string;
      description: string;
    }>;
  }>;
}
