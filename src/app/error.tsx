'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const { colors } = useDynamicTheme();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div 
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
            ¡Ups! Algo salió mal
          </h1>
          <p 
            className="text-lg mb-4"
            style={{ color: colors.textSecondary }}
          >
            Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left">
              <summary 
                className="cursor-pointer text-sm font-medium mb-2"
                style={{ color: colors.textMuted }}
              >
                Detalles del error (desarrollo)
              </summary>
              <pre 
                className="text-xs p-4 rounded border overflow-auto"
                style={{ 
                  backgroundColor: colors.background3,
                  borderColor: colors.border,
                  color: colors.textPrimary
                }}
              >
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            onClick={reset}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Intentar de nuevo
          </Button>
          
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Ir al inicio
          </Button>
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
    </div>
  );
}
