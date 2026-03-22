import { useMemo } from 'react';
import { SolarMetrics } from '../types/solar';

interface HistoryChartProps {
  history: SolarMetrics[];
  metric: 'battery_voltage' | 'battery_soc' | 'solar_power' | 'battery_power';
  title: string;
  color: string;
  unit: string;
}

export function HistoryChart({ history, metric, title, color, unit }: HistoryChartProps) {
  const chartData = useMemo(() => {
    if (history.length === 0) return { values: [], max: 0, min: 0 };

    const values = history
      .map(h => h[metric] ?? 0)
      .filter(v => typeof v === 'number');

    const max = Math.max(...values);
    const min = Math.min(...values);

    return { values, max, min };
  }, [history, metric]);

  const getYPosition = (value: number) => {
    const { max, min } = chartData;
    const range = max - min || 1;
    return 100 - ((value - min) / range) * 100;
  };

  const pathData = useMemo(() => {
    if (chartData.values.length === 0) return '';

    const width = 100;
    const step = width / (chartData.values.length - 1 || 1);

    return chartData.values
      .map((value, index) => {
        const x = index * step;
        const y = getYPosition(value);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [chartData.values]);

  const latestValue = chartData.values[chartData.values.length - 1] ?? 0;

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">
            {latestValue.toFixed(1)}
            <span className="text-sm text-gray-600 ml-1">{unit}</span>
          </p>
        </div>
      </div>

      <div className="relative h-48 bg-gray-50 rounded-lg overflow-hidden">
        {chartData.values.length > 0 ? (
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            <defs>
              <linearGradient id={`gradient-${metric}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={color} stopOpacity="0.05" />
              </linearGradient>
            </defs>

            <path
              d={`${pathData} L 100 100 L 0 100 Z`}
              fill={`url(#gradient-${metric})`}
            />

            <path
              d={pathData}
              fill="none"
              stroke={color}
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-400">No data available</p>
          </div>
        )}
      </div>

      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>
          {history.length > 0
            ? new Date(history[0].timestamp).toLocaleTimeString()
            : '--:--'}
        </span>
        <span>
          {history.length > 0
            ? new Date(history[history.length - 1].timestamp).toLocaleTimeString()
            : '--:--'}
        </span>
      </div>
    </div>
  );
}
