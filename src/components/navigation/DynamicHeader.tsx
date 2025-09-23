'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Menu } from 'lucide-react';

interface DynamicHeaderProps {
  onMenuClick: () => void;
  currentSlug?: string;
}

export default function DynamicHeader({ onMenuClick, currentSlug }: DynamicHeaderProps) {
  return (
    <header className="theme-header-bg shadow-sm border-b theme-header-border h-12 flex items-center justify-between px-3 sm:px-4 lg:px-6 xl:px-8 sticky top-0 z-[1100]">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden mr-2 theme-header-text hover:opacity-75"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="hidden sm:block">
          <h1 className="text-lg font-semibold theme-header-text truncate">
            {currentSlug ? currentSlug.charAt(0).toUpperCase() + currentSlug.slice(1) : 'Dashboard'}
          </h1>
        </div>
      </div>
      
      {/* Mobile title */}
      <div className="sm:hidden">
        <h1 className="text-sm font-medium theme-header-text truncate">
          {currentSlug ? currentSlug.charAt(0).toUpperCase() + currentSlug.slice(1) : 'Dashboard'}
        </h1>
      </div>
    </header>
  );
}
