import { ReactNode } from 'react';

interface CardProps {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export default function Card({ title, children, icon, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        {icon && <div className="text-blue-600">{icon}</div>}
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      </div>
      <div>{children}</div>
    </div>
  );
}
