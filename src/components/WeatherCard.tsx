import { useState, useEffect } from 'react';
import { Cloud, Droplets, Wind, Thermometer } from 'lucide-react';
import Card from './Card';
import { getSettings } from '../lib/supabase';

interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  location: string;
}

export default function WeatherCard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);

      const settings = await getSettings(['weather_api_key', 'weather_location']);
      const apiKey = settings.weather_api_key;
      const location = settings.weather_location || 'London';

      if (!apiKey) {
        setError('Weather API key not configured');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data = await response.json();

      setWeather({
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6),
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        location: data.name,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load weather');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card title="Weather" icon={<Cloud size={24} />}>
      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-pulse text-gray-400">Loading weather...</div>
        </div>
      )}

      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-3 rounded">
          {error}
          <div className="text-xs mt-1 text-gray-600">
            Configure weather API key in the admin dashboard
          </div>
        </div>
      )}

      {weather && !loading && !error && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-4xl font-bold text-gray-800">{weather.temperature}°C</div>
              <div className="text-sm text-gray-500 capitalize">{weather.description}</div>
              <div className="text-xs text-gray-400 mt-1">{weather.location}</div>
            </div>
            <img
              src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
              alt={weather.description}
              className="w-20 h-20"
            />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="flex flex-col items-center">
              <Thermometer size={20} className="text-orange-500 mb-1" />
              <div className="text-xs text-gray-500">Feels like</div>
              <div className="text-sm font-semibold">{weather.feelsLike}°C</div>
            </div>
            <div className="flex flex-col items-center">
              <Droplets size={20} className="text-blue-500 mb-1" />
              <div className="text-xs text-gray-500">Humidity</div>
              <div className="text-sm font-semibold">{weather.humidity}%</div>
            </div>
            <div className="flex flex-col items-center">
              <Wind size={20} className="text-gray-500 mb-1" />
              <div className="text-xs text-gray-500">Wind</div>
              <div className="text-sm font-semibold">{weather.windSpeed} km/h</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
