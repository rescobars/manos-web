'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

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
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
          {subtitle && (
            <p className="text-gray-600 dark:text-gray-300">{subtitle}</p>
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
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-gray-600">{subtitle}</p>
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
