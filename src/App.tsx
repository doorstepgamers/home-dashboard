import { Home } from 'lucide-react';
import WeatherCard from './components/WeatherCard';
import SystemStatsCard from './components/SystemStatsCard';

function App() {
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Home size={28} className="text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">Home Dashboard</h1>
            </div>
            <div className="text-sm text-gray-600">{currentTime}</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <WeatherCard />
          <SystemStatsCard />
        </div>
      </main>
    </div>
  );
}

export default App;
