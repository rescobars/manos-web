import React from 'react';
import { clsx } from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X,
  LogOut,
  User
} from 'lucide-react';
import { Button } from './Button';
import NavigationSelector, { NavigationItem } from '@/components/navigation/NavigationSelector';
import { useAuth } from '@/contexts/AuthContext';
import { ModeToggle } from './mode-toggle';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  user: any;
  onLogout: () => void;
  currentSlug?: string;
}



export function Sidebar({ isOpen, onToggle, user, onLogout, currentSlug }: SidebarProps) {
  const pathname = usePathname();
  const { currentOrganization } = useAuth();
  const menuItems = NavigationSelector({ slug: currentSlug || '' });
  
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[1050] lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={clsx(
        'w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen',
        'fixed lg:fixed inset-y-0 left-0 z-[1100] transform transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between h-12 px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            {currentOrganization?.logo_url ? (
              <img 
                src={currentOrganization.logo_url} 
                alt={`${currentOrganization.name} logo`}
                className="w-8 h-8 rounded-lg object-cover mr-3"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">
                  {currentOrganization?.name?.charAt(0) || 'O'}
                </span>
              </div>
            )}
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {currentOrganization?.name || 'Organización'}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="lg:hidden"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* User Info */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {user?.name || 'Usuario'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email || 'usuario@email.com'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {menuItems.map((item: NavigationItem) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={clsx(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                )}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {/* Theme Toggle */}
          <div className="mb-2">
            <ModeToggle />
          </div>
          
          {/* Logout Button */}
          <Button
            variant="ghost"
            onClick={onLogout}
            className="w-full justify-start text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </>
  );
}
