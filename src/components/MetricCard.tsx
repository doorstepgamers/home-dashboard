import { Video as LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  status?: 'good' | 'warning' | 'critical';
  subtitle?: string;
}

export function MetricCard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  status = 'good',
  subtitle
}: MetricCardProps) {
  const statusColors = {
    good: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    critical: 'bg-red-50 border-red-200'
  };

  const iconColors = {
    good: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600'
  };

  return (
    <div className={`rounded-xl border-2 p-6 transition-all hover:shadow-lg ${statusColors[status]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">
              {typeof value === 'number' ? value.toFixed(1) : value}
            </span>
            {unit && <span className="text-lg text-gray-600">{unit}</span>}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-white ${iconColors[status]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}
