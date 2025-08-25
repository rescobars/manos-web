import React from 'react';
import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-100',
  trend 
}: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={clsx('p-2 rounded-lg', iconBgColor)}>
          <Icon className={clsx('w-6 h-6', iconColor)} />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-center">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <div className={clsx(
                'ml-2 flex items-center text-sm',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                <span className={clsx(
                  'mr-1',
                  trend.isPositive ? '↑' : '↓'
                )}>
                  {trend.isPositive ? '↑' : '↓'}
                </span>
                {Math.abs(trend.value)}%
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
