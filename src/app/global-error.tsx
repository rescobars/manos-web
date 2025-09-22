'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const { colors } = useDynamicTheme();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="es">
      <body 
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: colors.background1 }}
      >
        <div className="max-w-md w-full text-center">
          {/* Error Icon */}
          <div className="mb-8">
            <div 
              className="w-32 h-32 mx-auto rounded-full flex items-center justify-center"
              style={{ backgroundColor: colors.background2 }}
            >
              <AlertTriangle 
                className="w-16 h-16"
                style={{ color: colors.error }}
              />
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <h1 
              className="text-3xl font-bold mb-4"
              style={{ color: colors.textPrimary }}
            >
              Error crítico
            </h1>
            <p 
              className="text-lg mb-4"
              style={{ color: colors.textSecondary }}
            >
              Ha ocurrido un error crítico en la aplicación. Por favor, recarga la página.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={reset}
              className="w-full px-4 py-2 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: colors.buttonPrimary1,
                color: 'white',
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2 inline" />
              Recargar aplicación
            </button>
          </div>

          {/* Additional Help */}
          <div className="mt-8">
            <p 
              className="text-sm"
              style={{ color: colors.textMuted }}
            >
              Si el problema persiste, contacta al soporte técnico.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
