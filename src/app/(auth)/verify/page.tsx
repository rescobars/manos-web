'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

function VerifyPageContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const [hasAttempted, setHasAttempted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setError('Token no encontrado');
      return;
    }

    // Evitar múltiples intentos
    if (hasAttempted) {
      return;
    }

    const verify = async () => {
      setHasAttempted(true);
      try {
        await verifyToken(token);
        setStatus('success');
        // Redirigir a la página raíz después de 2 segundos
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } catch (err) {
        setStatus('error');
        const errorMessage = err instanceof Error ? err.message : 'Error al verificar el token';
        
        // Mensajes más amigables para errores específicos
        if (errorMessage.includes('already been used')) {
          setError('Este enlace ya ha sido utilizado. Por favor, solicita un nuevo código de acceso.');
        } else if (errorMessage.includes('expired')) {
          setError('Este enlace ha expirado. Por favor, solicita un nuevo código de acceso.');
        } else if (errorMessage.includes('invalid')) {
          setError('Enlace inválido. Por favor, verifica el enlace o solicita un nuevo código.');
        } else {
          setError(errorMessage);
        }
      }
    };

    verify();
  }, [searchParams, verifyToken, router, hasAttempted]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
            </div>
            <CardTitle className="text-xl">Verificando acceso...</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">
              Estamos verificando tu enlace de acceso
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-xl">¡Acceso exitoso!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              Tu cuenta ha sido verificada correctamente
            </p>
            <p className="text-sm text-gray-500">
              Redirigiendo al dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl">Error de verificación</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Volver al login
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Solicitar nuevo código
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
            </div>
            <CardTitle className="text-xl">Cargando...</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">
              Preparando verificación...
            </p>
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyPageContent />
    </Suspense>
  );
}
