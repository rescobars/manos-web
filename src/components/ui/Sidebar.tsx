import React from 'react';
import { clsx } from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Building2, 
  Users, 
  Truck, 
  Package, 
  BarChart3, 
  Settings, 
  Menu, 
  X,
  LogOut,
  User
} from 'lucide-react';
import { Button } from './Button';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  user: any;
  onLogout: () => void;
  currentSlug?: string;
}

const getMenuItems = (slug: string) => [
  {
    label: 'Dashboard',
    icon: BarChart3,
    href: `/${slug}/dashboard`
  },
  {
    label: 'Organizaciones',
    icon: Building2,
    href: `/${slug}/organizations`
  },
  {
    label: 'Miembros',
    icon: Users,
    href: `/${slug}/members`
  },
  {
    label: 'Conductores',
    icon: Truck,
    href: `/${slug}/drivers`
  },
  {
    label: 'Pedidos',
    icon: Package,
    href: `/${slug}/orders`
  },
  {
    label: 'Configuración',
    icon: Settings,
    href: `/${slug}/settings`
  }
];

export function Sidebar({ isOpen, onToggle, user, onLogout, currentSlug }: SidebarProps) {
  const pathname = usePathname();
  const menuItems = getMenuItems(currentSlug || '');
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={clsx(
        'w-64 bg-white border-r border-gray-200 flex flex-col h-screen',
        'fixed lg:fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between h-12 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <Building2 className="w-8 h-8 text-primary-600 mr-3" />
            <h1 className="text-xl font-semibold text-gray-900">moviGo</h1>
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
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || 'Usuario'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || 'usuario@email.com'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={clsx(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200">
          <Button
            variant="ghost"
            onClick={onLogout}
            className="w-full justify-start text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </>
  );
}
