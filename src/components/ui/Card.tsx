import React from 'react';
import { clsx } from 'clsx';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  const { colors } = useDynamicTheme();
  
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    none: '',
  };

  return (
    <div
      className={clsx(
        'theme-bg-3 rounded-lg shadow-sm border theme-border',
        paddingClasses[padding],
        className
      )}
      style={{
        backgroundColor: colors.background3,
        borderColor: colors.border,
      }}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  const { colors } = useDynamicTheme();
  
  return (
    <div 
      className={clsx('border-b theme-divider pb-4 mb-4', className)}
      style={{ borderColor: colors.divider }}
    >
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={clsx('text-lg font-semibold theme-text-primary', className)}>
      {children}
    </h3>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={clsx('theme-text-secondary', className)}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  const { colors } = useDynamicTheme();
  
  return (
    <div 
      className={clsx('border-t theme-divider pt-4 mt-4', className)}
      style={{ borderColor: colors.divider }}
    >
      {children}
    </div>
  );
}
