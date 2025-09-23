'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/ui/Sidebar';
import DynamicHeader from '@/components/navigation/DynamicHeader';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
  currentSlug?: string;
  isFullScreen?: boolean;
  rightSidebar?: React.ReactNode;
}

export function DashboardLayout({ children, user, onLogout, currentSlug, isFullScreen = false, rightSidebar }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen theme-bg-1 flex">
      {/* Sidebar - Fixed on desktop */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        user={user}
        onLogout={onLogout}
        currentSlug={currentSlug}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Top Header - Fixed */}
        <DynamicHeader 
          onMenuClick={() => setSidebarOpen(true)}
          currentSlug={currentSlug}
        />

        {/* Content Area with optional right sidebar */}
        <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-3rem)]">
          {/* Page Content */}
          <main className={`flex-1 overflow-y-auto ${isFullScreen ? 'p-0' : 'p-2 sm:p-4 lg:p-6 xl:p-8'} ${rightSidebar ? 'pr-0 lg:pr-0' : ''}`}>
            {children}
          </main>
          
          {/* Right Sidebar for controls - Hidden on mobile, visible on desktop */}
          {rightSidebar && (
            <div className="hidden lg:block w-72 p-3 overflow-y-auto border-l theme-border theme-bg-2">
              {rightSidebar}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
