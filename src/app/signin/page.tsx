'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, ArrowRight, CheckCircle, Key, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useOrganizationInfo } from '@/hooks/useOrganizationInfo';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';

export default function SigninPage() {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [orgUuid, setOrgUuid] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  
  const { login, verifyCode } = useAuth();
  const { colors } = useDynamicTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { organization, loading: orgLoading, error: orgError } = useOrganizationInfo(orgUuid);

  useEffect(() => {
    // Obtener los query parameters
    const orgUuidParam = searchParams.get('org_uuid');
    const roleParam = searchParams.get('role');
    
    setOrgUuid(orgUuidParam);
    setRole(roleParam);
  }, [searchParams]);

  // Función para validar email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // Verificar si el botón debe estar habilitado
  const isButtonEnabled = email.trim().length > 0 && isValidEmail(email);
  const isCodeButtonEnabled = verificationCode.trim().length === 6;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isButtonEnabled) return;
    
    setIsLoading(true);
    setError('');

    try {
      await login(email.trim());
      setIsEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isCodeButtonEnabled) return;
    
    setIsVerifying(true);
    setError('');

    try {
      await verifyCode(email, verificationCode.trim());
      // Redirigir al dashboard de la organización específica
      if (orgUuid) {
        router.push(`/dashboard?org_uuid=${orgUuid}&role=${role || 'DRIVER'}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código inválido');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError(''); // Limpiar errores cuando el usuario empiece a escribir
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Solo números, máximo 6 dígitos
    setVerificationCode(value);
    setError(''); // Limpiar errores cuando el usuario empiece a escribir
  };

  const handleBackToEmail = () => {
    setIsEmailSent(false);
    setEmail('');
    setVerificationCode('');
    setError('');
  };

  if (isEmailSent) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: colors.background1 }}
      >
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div 
              className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: colors.background2 }}
            >
              <Key 
                className="w-6 h-6" 
                style={{ color: colors.buttonPrimary1 }}
              />
            </div>
            <CardTitle className="text-xl theme-text-primary">Ingresa tu código</CardTitle>
            <p className="theme-text-secondary mt-2">
              Hemos enviado un código de 6 dígitos a <strong>{email}</strong>
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <Input
                label="Código de verificación"
                type="text"
                placeholder="123456"
                value={verificationCode}
                onChange={handleCodeChange}
                maxLength={6}
                required
                error={error}
                className="text-center text-2xl font-mono tracking-widest"
              />
              <Button
                type="submit"
                loading={isVerifying}
                disabled={!isCodeButtonEnabled}
                className="w-full"
              >
                Verificar y continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
            
            <div className="mt-6 space-y-3">
              <Button
                variant="outline"
                onClick={handleBackToEmail}
                className="w-full"
              >
                Cambiar email
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  // Reenviar el código
                  handleSubmit({ preventDefault: () => {} } as any);
                }}
                className="w-full"
              >
                Reenviar código
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: colors.background1 }}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div 
            className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: colors.background2 }}
          >
            {organization?.logo_url ? (
              <img 
                src={organization.logo_url} 
                alt={`${organization.name} logo`}
                className="w-6 h-6 object-cover rounded"
              />
            ) : (
              <Building2 
                className="w-6 h-6" 
                style={{ color: colors.buttonPrimary1 }}
              />
            )}
          </div>
          <CardTitle className="text-2xl theme-text-primary">Iniciar Sesión</CardTitle>
          <p className="theme-text-secondary mt-2">
            Accede a tu cuenta de <span className="font-semibold">{organization?.name || 'organización'}</span>
          </p>
          {orgLoading && (
            <p className="text-xs theme-text-muted mt-1">
              Cargando información de la organización...
            </p>
          )}
          {orgError && (
            <p className="text-xs theme-error mt-1">
              Error al cargar la organización
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={handleEmailChange}
              required
              error={error}
            />
            <Button
              type="submit"
              loading={isLoading}
              disabled={!isButtonEnabled}
              className="w-full"
            >
              Continuar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm theme-text-muted">
              ¿No tienes cuenta?{' '}
              <Link
                href={`/signup?org_uuid=${orgUuid}&role=${role || 'DRIVER'}`}
                className="font-medium hover:opacity-80"
                style={{ color: colors.buttonPrimary1 }}
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
