'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Settings, X } from 'lucide-react';

interface MobileControlsButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  driverCount: number;
  totalDrivers: number;
  wsConnected: boolean;
}

export function MobileControlsButton({ 
  isOpen, 
  onToggle, 
  driverCount, 
  totalDrivers, 
  wsConnected 
}: MobileControlsButtonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const buttonContent = (
    <div className="lg:hidden">
      {/* Floating Action Button */}
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-[9999] bg-blue-600 hover:bg-blue-700 text-white p-3 sm:p-4 rounded-full shadow-xl transition-all duration-200 hover:scale-105"
        style={{ zIndex: 9999 }}
      >
        {isOpen ? (
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        ) : (
          <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
        )}
      </button>
      
      {/* Quick Stats - Only show when drawer is closed */}
      {!isOpen && (
        <div className="fixed bottom-4 left-2 sm:left-4 z-[9998] theme-bg-3/95 dark:bg-gray-800/95 backdrop-blur-sm border theme-border dark:border-gray-700 rounded-lg shadow-xl p-2 sm:p-3 max-w-[180px] sm:max-w-[200px]">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              {wsConnected && (
                <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-30"></div>
              )}
            </div>
            <div className="text-xs sm:text-sm font-medium theme-text-primary dark:text-gray-100 truncate">
              {driverCount} de {totalDrivers}
            </div>
          </div>
          <div className="text-xs theme-text-secondary dark:text-gray-300 mt-1 truncate">
            {wsConnected ? 'Conectado' : 'Desconectado'}
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(buttonContent, document.body);
}
