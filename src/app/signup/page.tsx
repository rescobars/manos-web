'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, User, Mail, Briefcase, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Link from 'next/link';
import { useOrganizationInfo } from '@/hooks/useOrganizationInfo';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';

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
  const { colors } = useDynamicTheme();
  const { organization, loading: orgLoading, error: orgError } = useOrganizationInfo(orgUuid);

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
        // Guardar el email en localStorage para la verificación
        localStorage.setItem('pendingEmail', formData.email);
        setSuccess(true);
        // Redirigir a la página de verificación después de 2 segundos
        setTimeout(() => {
          router.push(`/verify-code?org_uuid=${orgUuid}&role=${role || 'DRIVER'}&email=${encodeURIComponent(formData.email)}`);
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
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: colors.background1 }}
      >
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: colors.background2 }}
            >
              <CheckCircle 
                className="w-8 h-8" 
                style={{ color: colors.success }}
              />
            </div>
            <h2 className="text-xl font-semibold theme-text-primary mb-2">
              ¡Registro exitoso!
            </h2>
            <p className="theme-text-secondary mb-4">
              Se ha enviado un código de verificación a tu email.
            </p>
            <div className="animate-pulse">
              <p className="text-sm theme-text-muted">
                Redirigiendo a verificación...
              </p>
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
          <CardTitle className="text-2xl theme-text-primary">Crear cuenta</CardTitle>
          <p className="theme-text-secondary mt-2">
            Únete a <span className="font-semibold">{organization?.name || 'esta organización'}</span> como {role || 'conductor'}
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
              <div 
                className="border rounded-md p-3"
                style={{
                  backgroundColor: colors.background2,
                  borderColor: colors.error,
                }}
              >
                <p className="text-sm theme-error">{error}</p>
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
            <p className="text-sm theme-text-muted">
              ¿Ya tienes cuenta?{' '}
              <Link 
                href={`/signin?org_uuid=${orgUuid}&role=${role || 'DRIVER'}`}
                className="font-medium hover:opacity-80"
                style={{ color: colors.buttonPrimary1 }}
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
