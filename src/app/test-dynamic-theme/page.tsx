'use client';

import { DynamicThemeDemo } from '@/components/ui/DynamicThemeDemo';
import { ThemeDebugger } from '@/components/ui/ThemeDebugger';
import { organizationThemes } from '@/lib/themes/organizationThemes';
import { useState, useEffect } from 'react';

export default function TestDynamicThemePage() {
  const [selectedOrg, setSelectedOrg] = useState<string>('movigo-default');
  const [isChanging, setIsChanging] = useState(false);

  const handleOrgChange = async (orgUuid: string) => {
    if (orgUuid === selectedOrg) return;
    
    setIsChanging(true);
    setSelectedOrg(orgUuid);
    
    // Simular cambio de organización
    const mockEvent = new CustomEvent('organizationChanged', { 
      detail: { uuid: orgUuid } 
    });
    window.dispatchEvent(mockEvent);
    
    // Simular delay de cambio
    setTimeout(() => {
      setIsChanging(false);
    }, 1000);
  };

  // Cargar tema inicial
  useEffect(() => {
    const mockEvent = new CustomEvent('organizationChanged', { 
      detail: { uuid: selectedOrg } 
    });
    window.dispatchEvent(mockEvent);
  }, []);

  return (
    <div className="min-h-screen theme-bg-1">
      {/* Header con toggle de tema y cerrar sesión */}
      <div className="theme-bg-2 border-b theme-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <h2 className="text-xl font-semibold theme-text-primary">Panel de Control</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium theme-text-secondary">Tema:</span>
                <div className="relative">
                  <select
                    value={selectedOrg}
                    onChange={(e) => handleOrgChange(e.target.value)}
                    disabled={isChanging}
                    className="px-4 py-2 pr-8 rounded-lg border-2 theme-border theme-bg-3 theme-text-primary text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: organizationThemes[selectedOrg]?.colors.background3,
                      borderColor: organizationThemes[selectedOrg]?.colors.border,
                      color: organizationThemes[selectedOrg]?.colors.textPrimary
                    }}
                  >
                    {Object.entries(organizationThemes).map(([uuid, config]) => (
                      <option key={uuid} value={uuid}>
                        {config.theme_name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="w-4 h-4 theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {isChanging && (
                  <div className="flex items-center gap-2 text-sm theme-text-secondary">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 theme-text-primary"></div>
                    <span>Cambiando...</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                  alert('Sesión cerrada (simulado)');
                }
              }}
              className="px-4 py-2 rounded-lg border-2 theme-border hover:opacity-80 transition-all duration-200 text-sm font-medium flex items-center gap-2 group"
              style={{
                backgroundColor: organizationThemes[selectedOrg]?.colors.buttonSecondary1,
                color: organizationThemes[selectedOrg]?.colors.textPrimary,
                borderColor: organizationThemes[selectedOrg]?.colors.border
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold theme-text-primary mb-2">
            Demostración del Tema Dinámico
          </h1>
          <p className="text-lg theme-text-secondary mb-6">
            Esta página muestra cómo funciona el sistema de temas dinámicos basado en la configuración de la organización.
          </p>
          
          {/* Selector de organización para simular */}
          <div className="theme-bg-3 p-4 rounded-lg theme-border border mb-6">
            <h3 className="text-lg font-semibold theme-text-primary mb-3">
              {isChanging ? 'Cambiando tema...' : 'Simular Organización:'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(organizationThemes).map(([uuid, config]) => (
                <button
                  key={uuid}
                  onClick={() => handleOrgChange(uuid)}
                  disabled={isChanging}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedOrg === uuid
                      ? 'theme-btn-primary text-white'
                      : 'theme-btn-secondary theme-text-primary hover:opacity-80'
                  } ${isChanging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  style={{
                    backgroundColor: selectedOrg === uuid ? config.colors.buttonPrimary1 : config.colors.buttonSecondary1,
                    borderColor: selectedOrg === uuid ? config.colors.buttonPrimary1 : config.colors.border,
                    color: selectedOrg === uuid ? 'white' : config.colors.textPrimary
                  }}
                >
                  <div className="text-sm font-medium">{config.theme_name}</div>
                  <div className="text-xs opacity-75">{uuid}</div>
                </button>
              ))}
            </div>
            {isChanging && (
              <div className="mt-3 text-center">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 theme-text-primary"></div>
                <span className="ml-2 text-sm theme-text-secondary">Aplicando tema...</span>
              </div>
            )}
          </div>
        </div>
        
        <DynamicThemeDemo />
      </div>
      
      {/* Debugger temporal */}
      <ThemeDebugger />
    </div>
  );
}
