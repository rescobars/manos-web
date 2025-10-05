import React, { useState } from 'react';
import { clsx } from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X,
  LogOut,
  User,
  Palette
} from 'lucide-react';
import { Button } from './Button';
import NavigationSelector, { NavigationItem } from '@/components/navigation/NavigationSelector';
import { useAuth } from '@/contexts/AuthContext';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';
import { organizationThemes } from '@/lib/themes/organizationThemes';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  user: any;
  onLogout: () => void;
  currentSlug?: string;
}



export function Sidebar({ isOpen, onToggle, user, onLogout, currentSlug }: SidebarProps) {
  const pathname = usePathname();
  const [selectedTheme, setSelectedTheme] = useState<string>('cruz-verde-guatemala');
  const [isChangingTheme, setIsChangingTheme] = useState(false);
  
  const { currentOrganization } = useAuth();
  const { colors } = useDynamicTheme();
  const menuItems = NavigationSelector({ slug: currentSlug || '' });

  const handleThemeChange = async (themeUuid: string) => {
    if (themeUuid === selectedTheme) return;
    
    setIsChangingTheme(true);
    setSelectedTheme(themeUuid);
    
    // Simular cambio de tema
    const mockEvent = new CustomEvent('organizationChanged', { 
      detail: { uuid: themeUuid } 
    });
    window.dispatchEvent(mockEvent);
    
    // Simular delay de cambio
    setTimeout(() => {
      setIsChangingTheme(false);
    }, 1000);
  };
  
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
          'w-64 theme-sidebar-bg border-r theme-sidebar-border flex flex-col h-screen',
          'fixed lg:fixed inset-y-0 left-0 z-[1100] transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{
          backgroundColor: colors.sidebarBackground,
          borderColor: colors.sidebarBorder,
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
                <span className="theme-text-primary font-bold text-lg">
                  {currentOrganization?.name?.charAt(0) || 'O'}
                </span>
              </div>
            )}
            <h1 className="text-lg font-semibold theme-sidebar-text truncate" style={{ color: colors.sidebarText }}>
              {currentOrganization?.name || 'Organización'}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="lg:hidden theme-sidebar-text hover:opacity-75"
            style={{ color: colors.sidebarText }}
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
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors theme-sidebar-item',
                  isActive
                    ? 'theme-sidebar-text active'
                    : 'theme-sidebar-text hover:opacity-75'
                )}
                style={{
                  backgroundColor: isActive ? colors.sidebarItemActive : 'transparent',
                  color: isActive ? colors.buttonText : colors.sidebarText,
                }}
              >
                <span 
                  className="w-5 h-5 mr-3"
                  style={{ 
                    color: isActive ? colors.buttonText : colors.sidebarText 
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
          className="p-3 border-t theme-divider"
          style={{ borderColor: colors.divider }}
        >

          {/* Theme Selector */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Palette className="w-4 h-4 theme-sidebar-text" style={{ color: colors.sidebarText }} />
              <span className="text-xs font-medium theme-sidebar-text" style={{ color: colors.sidebarText }}>Organización:</span>
            </div>
            <select
              value={selectedTheme}
              onChange={(e) => handleThemeChange(e.target.value)}
              disabled={isChangingTheme}
              className="w-full px-3 py-2 text-xs rounded border theme-sidebar-border theme-bg-3 theme-sidebar-text focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: colors.background3,
                borderColor: colors.sidebarBorder,
                color: colors.sidebarText
              }}
            >
              {Object.entries(organizationThemes).map(([uuid, config]) => (
                <option key={uuid} value={uuid}>
                  {config.theme_name}
                </option>
              ))}
            </select>
            {isChangingTheme && (
              <div className="flex items-center gap-1 mt-1 text-xs theme-sidebar-text" style={{ color: colors.sidebarText }}>
                <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                <span>Cambiando...</span>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <Button
            variant="ghost"
            onClick={onLogout}
            className="w-full justify-start theme-sidebar-text hover:opacity-75"
            style={{ color: colors.sidebarText }}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </>
  );
}
