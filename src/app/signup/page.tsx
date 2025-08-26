'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, User, Mail, Briefcase, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Link from 'next/link';

interface RegisterFormData {
  email: string;
  name: string;
  title: string;
}

export default function SignupPage() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    name: '',
    title: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orgUuid, setOrgUuid] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Obtener los query parameters
    const orgUuidParam = searchParams.get('org_uuid');
    const roleParam = searchParams.get('role');
    
    setOrgUuid(orgUuidParam);
    setRole(roleParam);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!orgUuid) {
      setError('Organización no especificada');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/organization-members/public-create-with-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_uuid: orgUuid,
          email: formData.email,
          name: formData.name,
          title: formData.title
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        // Redirigir a la página de verificación después de 2 segundos
        setTimeout(() => {
          router.push(`/verify?org_uuid=${orgUuid}&role=${role || 'DRIVER'}`);
        }, 2000);
      } else {
        setError(data.error || data.message || 'Error al registrar usuario');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
              ¡Registro exitoso!
            </h2>
            <p className="text-gray-600 mb-4">
              Se ha enviado un código de verificación a tu email.
            </p>
            <div className="animate-pulse">
              <p className="text-sm text-gray-500">
                Redirigiendo a verificación...
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
          <CardTitle className="text-2xl">Crear cuenta</CardTitle>
          <p className="text-gray-600 mt-2">
            Únete a esta organización como {role || 'conductor'}
          </p>
          {orgUuid && (
            <p className="text-xs text-gray-500 mt-1">
              Organización: {orgUuid}
            </p>
          )}
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nombre completo"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Juan Pérez"
              required={true}
              disabled={loading}
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="juan@ejemplo.com"
              required={true}
              disabled={loading}
            />

            <Input
              label="Cargo/Título"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Conductor"
              required={true}
              disabled={loading}
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
              disabled={loading}
            >
              Crear cuenta
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              ¿Ya tienes cuenta?{' '}
              <Link 
                href={`/signin?org_uuid=${orgUuid}&role=${role || 'DRIVER'}`}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
