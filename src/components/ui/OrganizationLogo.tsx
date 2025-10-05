'use client';

import React from 'react';
import { useOrganizationBranding } from '@/hooks/useOrganizationBranding';

interface OrganizationLogoProps {
  className?: string;
  fallbackText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function OrganizationLogo({ 
  className = '', 
  fallbackText = 'Logo',
  size = 'md'
}: OrganizationLogoProps) {
  const { logoUrl } = useOrganizationBranding();
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };
  
  if (logoUrl) {
    return (
      <div 
        className={`${sizeClasses[size]} ${className} org-logo`}
        style={{ backgroundImage: `url(${logoUrl})` }}
        title={fallbackText}
      />
    );
  }
  
  return (
    <div 
      className={`${sizeClasses[size]} ${className} theme-bg-2 rounded-lg flex items-center justify-center theme-text-secondary font-semibold`}
      title={fallbackText}
    >
      {fallbackText.charAt(0).toUpperCase()}
    </div>
  );
}
