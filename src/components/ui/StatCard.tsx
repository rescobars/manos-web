'use client';

import React from 'react';
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
    label?: string;
  };
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-100',
  trend,
  onClick,
  className = ''
}: StatCardProps) {
  const cardClasses = `
    bg-white rounded-2xl shadow-sm border border-gray-100 p-6 
    hover:shadow-md transition-all duration-200 cursor-pointer
    ${onClick ? 'hover:scale-105' : ''}
    ${className}
  `;

  return (
    <div className={cardClasses} onClick={onClick}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`p-3 rounded-xl ${iconBgColor} ${iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
        
        {trend && (
          <div className={`text-right ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <div className="flex items-center gap-1 text-sm font-medium">
              <span className={trend.isPositive ? '↑' : '↓'}>
                {trend.isPositive ? '↑' : '↓'}
              </span>
              {Math.abs(trend.value)}%
            </div>
            {trend.label && (
              <p className="text-xs text-gray-500">{trend.label}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
