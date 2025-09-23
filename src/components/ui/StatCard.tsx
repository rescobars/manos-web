'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';

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
  const { colors } = useDynamicTheme();
  
  const cardClasses = `
    theme-bg-3 rounded-2xl shadow-sm border theme-border p-4 sm:p-6 
    hover:shadow-md transition-all duration-200 cursor-pointer
    ${onClick ? 'hover:scale-105' : ''}
    ${className}
  `;

  return (
    <div 
      className={cardClasses} 
      onClick={onClick}
      style={{
        backgroundColor: colors.background3,
        borderColor: colors.border,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center min-w-0 flex-1">
          <div 
            className="p-2 sm:p-3 rounded-xl flex-shrink-0"
            style={{ 
              backgroundColor: iconBgColor,
              color: iconColor
            }}
          >
            <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="ml-3 sm:ml-4 min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium theme-text-secondary truncate">{title}</p>
            <p className="text-lg sm:text-2xl font-bold theme-text-primary">{value}</p>
          </div>
        </div>
        
        {trend && (
          <div 
            className="text-right"
            style={{ 
              color: trend.isPositive ? colors.success : colors.error 
            }}
          >
            <div className="flex items-center gap-1 text-sm font-medium">
              <span className={trend.isPositive ? '↑' : '↓'}>
                {trend.isPositive ? '↑' : '↓'}
              </span>
              {Math.abs(trend.value)}%
            </div>
            {trend.label && (
              <p className="text-xs theme-text-muted">{trend.label}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
