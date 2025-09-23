'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowRight, CheckCircle, Key } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const { login, verifyCode } = useAuth();
  const router = useRouter();

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
      // Si la verificación es exitosa, redirigir a la página raíz
      // que manejará la redirección al dashboard correcto
      router.push('/');
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
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-3 sm:p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center p-4 sm:p-6">
            <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <Key className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
            </div>
            <CardTitle className="text-lg sm:text-xl">Ingresa tu código</CardTitle>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Hemos enviado un código de 6 dígitos a <strong className="break-all">{email}</strong>
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-3 sm:p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center p-4 sm:p-6">
          <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
          </div>
          <CardTitle className="text-xl sm:text-2xl">Bienvenido a moviGo</CardTitle>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Ingresa tu email para acceder a tu cuenta
          </p>
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
            <p className="text-sm text-gray-500">
              ¿No tienes cuenta?{' '}
              <button
                onClick={() => router.push('/register')}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Regístrate aquí
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
