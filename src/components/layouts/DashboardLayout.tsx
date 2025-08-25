import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Sidebar } from '@/components/ui/Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
}

export function DashboardLayout({ children, user, onLogout }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        user={user}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 h-12 flex items-center px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-2"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-medium text-gray-900">
            Dashboard
          </h2>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
