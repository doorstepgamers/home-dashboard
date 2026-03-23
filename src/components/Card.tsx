import { ReactNode } from 'react';

interface CardProps {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export default function Card({ title, children, icon, className = '' }: CardProps) {
  return (
    <div className={`glass-card rounded-xl p-6 hover:shadow-xl transition-all duration-300 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        {icon && <div className="text-blue-600">{icon}</div>}
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="text-gray-700">{children}</div>
    </div>
  );
}
