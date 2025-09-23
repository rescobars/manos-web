'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';

interface PageProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
}

export function Page({
  title,
  subtitle,
  icon: Icon,
  children,
  headerActions,
  className = ''
}: PageProps) {
  const { colors } = useDynamicTheme();
  
  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold theme-text-primary truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs sm:text-sm theme-text-secondary truncate mt-1">{subtitle}</p>
          )}
        </div>
        
        {headerActions && (
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            {headerActions}
          </div>
        )}
      </div>

      {/* Content */}
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, icon: Icon, actions }: PageHeaderProps) {
  const { colors } = useDynamicTheme();
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        {Icon && (
          <div 
            className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: colors.background2 }}
          >
            <Icon 
              className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" 
              style={{ color: colors.buttonPrimary1 }}
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold theme-text-primary truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs sm:text-sm theme-text-secondary truncate mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

interface PageContentProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContent({ children, className = '' }: PageContentProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
