'use client';

import { DynamicThemeDemo } from '@/components/ui/DynamicThemeDemo';

export default function TestDynamicThemePage() {
  return (
    <div className="min-h-screen theme-bg-1">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold theme-text-primary mb-2">
            Demostración del Tema Dinámico
          </h1>
          <p className="text-lg theme-text-secondary">
            Esta página muestra cómo funciona el sistema de temas dinámicos basado en la configuración de la organización.
          </p>
        </div>
        
        <DynamicThemeDemo />
      </div>
    </div>
  );
}
