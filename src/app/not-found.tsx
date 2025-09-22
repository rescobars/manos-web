'use client';

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';

export default function NotFound() {
  const { colors } = useDynamicTheme();

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: colors.background1 }}
    >
      <div className="max-w-md w-full text-center">
        {/* 404 Icon */}
        <div className="mb-8">
          <div 
            className="w-32 h-32 mx-auto rounded-full flex items-center justify-center"
            style={{ backgroundColor: colors.background2 }}
          >
            <span 
              className="text-6xl font-bold"
              style={{ color: colors.buttonPrimary1 }}
            >
              404
            </span>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h1 
            className="text-3xl font-bold mb-4"
            style={{ color: colors.textPrimary }}
          >
            Página no encontrada
          </h1>
          <p 
            className="text-lg"
            style={{ color: colors.textSecondary }}
          >
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver atrás
          </Button>
          
          <Link href="/">
            <Button className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Ir al inicio
            </Button>
          </Link>
        </div>

        {/* Additional Help */}
        <div className="mt-8">
          <p 
            className="text-sm"
            style={{ color: colors.textMuted }}
          >
            Si crees que esto es un error, contacta al administrador.
          </p>
        </div>
      </div>
    </div>
  );
}
