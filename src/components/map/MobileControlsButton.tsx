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
        className="fixed bottom-4 right-4 z-[9999] bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl transition-all duration-200 hover:scale-105"
        style={{ zIndex: 9999 }}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Settings className="w-6 h-6" />
        )}
      </button>
      
      {/* Quick Stats - Only show when drawer is closed */}
      {!isOpen && (
        <div className="fixed bottom-4 left-4 z-[9998] bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-xl p-3 max-w-[200px]">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              {wsConnected && (
                <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-30"></div>
              )}
            </div>
            <div className="text-sm font-medium text-gray-900">
              {driverCount} de {totalDrivers}
            </div>
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {wsConnected ? 'Conectado' : 'Desconectado'}
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(buttonContent, document.body);
}
