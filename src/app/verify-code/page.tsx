'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, Mail, Shield, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useOrganizationInfo } from '@/hooks/useOrganizationInfo';

export default function VerifyPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orgUuid, setOrgUuid] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  
  const { verifyCode, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Obtener información de la organización para obtener el slug
  const { organization } = useOrganizationInfo(orgUuid);

  useEffect(() => {
    // Obtener los query parameters
    const orgUuidParam = searchParams.get('org_uuid');
    const roleParam = searchParams.get('role');
    const emailParam = searchParams.get('email');
    
    setOrgUuid(orgUuidParam);
    setRole(roleParam);
    
    // Si hay email en la URL, guardarlo en localStorage como respaldo
    if (emailParam) {
      localStorage.setItem('pendingEmail', emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Obtener el email de localStorage o de los parámetros de URL
      const email = localStorage.getItem('pendingEmail') || searchParams.get('email') || '';
      
      if (!email) {
        setError('Email no encontrado. Por favor, regresa al registro.');
        return;
      }
      
      await verifyCode(email, code);
      setSuccess(true);
      // Redirigir al dashboard de la organización después de 2 segundos
      setTimeout(() => {
        if (organization?.slug) {
          // Usar el slug de la organización para la ruta correcta
          router.push(`/${organization.slug}/dashboard`);
        } else if (orgUuid) {
          // Fallback: redirigir a la página raíz si no tenemos el slug
          router.push(`/?org_uuid=${orgUuid}&role=${role || 'DRIVER'}`);
        } else {
          router.push('/');
        }
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
        <Card className="w-full max-w-md">
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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Verificar cuenta</CardTitle>
          <p className="text-gray-600 mt-2">
            Ingresa el código enviado a tu email
          </p>
          {organization?.name && (
            <p className="text-xs text-gray-500 mt-1">
              Organización: {organization.name}
            </p>
          )}
          {role && (
            <p className="text-xs text-gray-500">
              Rol: {role}
            </p>
          )}
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
              loading={loading}
              disabled={loading || code.length < 6}
            >
              Verificar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-4">
              ¿No recibiste el código?
            </p>
            <Button
              variant="ghost"
              onClick={handleResendCode}
              loading={loading}
              className="text-blue-600 hover:text-blue-800"
            >
              Reenviar código
            </Button>
          </div>

          <div className="mt-4 text-center">
            <Link 
              href={`/signin?org_uuid=${orgUuid}&role=${role || 'DRIVER'}`}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Volver al login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
