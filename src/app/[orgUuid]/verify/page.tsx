'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Building2, Mail, Shield, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function OrganizationVerifyPage() {
  const params = useParams();
  const router = useRouter();
  const { verifyCode, isLoading } = useAuth();
  
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const orgUuid = params.orgUuid as string;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await verifyCode(code, code);
      setSuccess(true);
      // Redirigir al dashboard de la organización después de 2 segundos
      setTimeout(() => {
        router.push(`/${orgUuid}/dashboard`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar el código');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setLoading(true);

    try {
      // Aquí puedes implementar la lógica para reenviar el código
      // Por ahora solo simulamos el envío
      setTimeout(() => {
        setLoading(false);
        // Mostrar mensaje de éxito
        setError(null);
      }, 1000);
    } catch (err) {
      setError('Error al reenviar el código');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl">
            <CardContent className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                ¡Verificación exitosa!
              </h2>
              <p className="text-gray-600 mb-4">
                Tu cuenta ha sido verificada correctamente.
              </p>
              <div className="animate-pulse">
                <p className="text-sm text-gray-500">
                  Redirigiendo al dashboard...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y título de la organización */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verificar cuenta
          </h1>
          <p className="text-gray-600">
            Ingresa el código enviado a tu email
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">Código de verificación</CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Código de verificación"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                required={true}
                disabled={loading}
                maxLength={6}
              />

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || code.length < 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    Verificar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-4">
                ¿No recibiste el código?
              </p>
              <Button
                variant="ghost"
                onClick={handleResendCode}
                disabled={loading}
                className="text-blue-600 hover:text-blue-800"
              >
                Reenviar código
              </Button>
            </div>

            <div className="mt-4 text-center">
              <Link 
                href={`/${orgUuid}/login`}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Volver al login
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            Organización ID: {orgUuid}
          </p>
        </div>
      </div>
    </div>
  );
}
