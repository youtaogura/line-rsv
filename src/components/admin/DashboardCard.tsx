import Link from 'next/link';
import React from 'react';

interface DashboardCardProps {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  borderColor: string;
  bgColor: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  href,
  title,
  description,
  icon,
  borderColor,
  bgColor,
}) => {
  return (
    <Link
      href={href}
      className={`bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 ${borderColor}`}
    >
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 ${bgColor} rounded-full flex items-center justify-center`}>
            {icon}
          </div>
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </Link>
  );
};