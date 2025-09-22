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
    <header className="theme-bg-3 shadow-sm border-b theme-border h-12 flex items-center px-4 sm:px-6 lg:px-8 sticky top-0 z-[1100]">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden mr-2"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
