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
import { useDynamicTheme } from '@/hooks/useDynamicTheme';
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
  const { colors } = useDynamicTheme();
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
      <div 
        className={clsx(
          'w-64 theme-menu-bg border-r theme-border flex flex-col h-screen',
          'fixed lg:fixed inset-y-0 left-0 z-[1100] transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{
          backgroundColor: colors.menuBackground1,
          borderColor: colors.border,
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between h-12 px-4 border-b theme-divider"
          style={{ borderColor: colors.divider }}
        >
          <div className="flex items-center">
            {currentOrganization?.logo_url ? (
              <img 
                src={currentOrganization.logo_url} 
                alt={`${currentOrganization.name} logo`}
                className="w-8 h-8 rounded-lg object-cover mr-3"
              />
            ) : (
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                style={{ backgroundColor: colors.buttonPrimary1 }}
              >
                <span className="text-white font-bold text-lg">
                  {currentOrganization?.name?.charAt(0) || 'O'}
                </span>
              </div>
            )}
            <h1 className="text-lg font-semibold theme-text-primary truncate">
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
        <div 
          className="p-3 border-b theme-divider"
          style={{ borderColor: colors.divider }}
        >
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: colors.background2 }}
            >
              <User 
                className="w-5 h-5" 
                style={{ color: colors.buttonPrimary1 }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium theme-text-primary truncate">
                {user?.name || 'Usuario'}
              </p>
              <p className="text-xs theme-text-muted truncate">
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
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors theme-menu-item',
                  isActive
                    ? 'theme-text-primary'
                    : 'theme-text-secondary hover:theme-text-primary'
                )}
                style={{
                  backgroundColor: isActive ? colors.menuItemHover : 'transparent',
                }}
              >
                <span 
                  className="w-5 h-5 mr-3"
                  style={{ 
                    color: isActive ? colors.buttonPrimary1 : colors.textSecondary 
                  }}
                >
                  <Icon className="w-5 h-5" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div 
          className="p-3 border-t theme-divider space-y-2"
          style={{ borderColor: colors.divider }}
        >
          {/* Theme Toggle */}
          <div className="mb-2">
            <ModeToggle />
          </div>
          
          {/* Logout Button */}
          <Button
            variant="ghost"
            onClick={onLogout}
            className="w-full justify-start theme-text-secondary hover:theme-text-primary"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </>
  );
}
