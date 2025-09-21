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
}

export function DashboardLayout({ children, user, onLogout, currentSlug, isFullScreen = false }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
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

        {/* Page Content - Scrollable */}
        <main className={`flex-1 overflow-y-auto h-[calc(100vh-3rem)] ${isFullScreen ? 'p-0' : 'p-4 sm:p-6 lg:p-8'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
