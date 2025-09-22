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
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold theme-text-primary">{title}</h1>
          {subtitle && (
            <p className="theme-text-secondary">{subtitle}</p>
          )}
        </div>
        
        {headerActions && (
          <div className="flex items-center space-x-3">
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
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {Icon && (
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: colors.background2 }}
          >
            <Icon 
              className="w-6 h-6" 
              style={{ color: colors.buttonPrimary1 }}
            />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold theme-text-primary">{title}</h1>
          {subtitle && (
            <p className="theme-text-secondary">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center space-x-3">
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
