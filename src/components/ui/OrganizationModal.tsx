'use client';

import React, { useState, useEffect } from 'react';
import { Organization, CreateOrganizationFormData, UpdateOrganizationFormData } from '@/types';
import { Button } from './Button';
import { Input } from './Input';
import { TextArea } from './TextArea';
import { Select } from './Select';
import { X, Building2, Save, Loader2 } from 'lucide-react';

interface OrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization?: Organization | null;
  onSubmit: (data: CreateOrganizationFormData | UpdateOrganizationFormData) => Promise<void>;
  loading?: boolean;
}

export function OrganizationModal({
  isOpen,
  onClose,
  organization,
  onSubmit,
  loading = false
}: OrganizationModalProps) {
    const [formData, setFormData] = useState<CreateOrganizationFormData>({
    name: '',
    slug: '',
    description: '',
    domain: '',
    logo_url: '',
    website_url: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    status: 'ACTIVE',
    plan_type: 'FREE',
    subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 año por defecto
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (organization) {
        setFormData({
          name: organization.name || '',
          slug: organization.slug || '',
          description: organization.description || '',
          domain: organization.domain || '',
          logo_url: organization.logo_url || '',
          website_url: organization.website_url || '',
          contact_email: organization.contact_email || '',
          contact_phone: organization.contact_phone || '',
          address: organization.address || '',
          status: organization.status as any || 'ACTIVE',
          plan_type: organization.plan_type as any || 'FREE',
          subscription_expires_at: organization.subscription_expires_at || ''
        });
      } else {
        setFormData({
          name: '',
          slug: '',
          description: '',
          domain: '',
          logo_url: '',
          website_url: '',
          contact_email: '',
          contact_phone: '',
          address: '',
          status: 'ACTIVE',
          plan_type: 'FREE',
          subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 año por defecto
        });
      }
      setErrors({});
    }
  }, [isOpen, organization]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Campos obligatorios según las instrucciones del endpoint
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 1) {
      newErrors.name = 'El nombre debe tener al menos 1 carácter';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'El nombre no puede exceder 100 caracteres';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'El slug es requerido';
    } else if (formData.slug.length < 1) {
      newErrors.slug = 'El slug debe tener al menos 1 carácter';
    } else if (formData.slug.length > 100) {
      newErrors.slug = 'El slug no puede exceder 100 caracteres';
    }

    // Validar descripción (requerido)
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    // Validar dominio (opcional, texto plano según endpoint)
    // No se valida formato ya que el endpoint especifica "texto plano"

    // Validar email de contacto (requerido, email válido)
    if (!formData.contact_email.trim()) {
      newErrors.contact_email = 'El email de contacto es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Email inválido';
    }

    // Validar teléfono (requerido, texto plano)
    if (!formData.contact_phone.trim()) {
      newErrors.contact_phone = 'El teléfono de contacto es requerido';
    }

    // Validar sitio web (opcional, URL válida según endpoint)
    if (formData.website_url && !/^https?:\/\/.+/.test(formData.website_url)) {
      newErrors.website_url = 'URL inválida (debe comenzar con http:// o https://)';
    }

    // Validar URL del logo (requerido, URL válida)
    if (!formData.logo_url.trim()) {
      newErrors.logo_url = 'La URL del logo es requerida';
    } else if (!/^https?:\/\/.+/.test(formData.logo_url)) {
      newErrors.logo_url = 'URL del logo inválida';
    }

    // Validar dirección (requerido, texto plano)
    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida';
    }

    // Validar status (requerido, valores específicos)
    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
    if (!formData.status || !validStatuses.includes(formData.status)) {
      newErrors.status = 'Estado inválido';
    }

    // Validar plan_type (requerido, valores específicos)
    const validPlanTypes = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
    if (!formData.plan_type || !validPlanTypes.includes(formData.plan_type)) {
      newErrors.plan_type = 'Tipo de plan inválido';
    }

    // Validar fecha de expiración (requerido, formato ISO 8601)
    if (!formData.subscription_expires_at) {
      newErrors.subscription_expires_at = 'La fecha de expiración es requerida';
    } else {
      const expirationDate = new Date(formData.subscription_expires_at);
      
      if (isNaN(expirationDate.getTime())) {
        newErrors.subscription_expires_at = 'Fecha de expiración inválida (formato ISO 8601 requerido)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Limpiar campos vacíos antes de enviar
    const cleanData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [
        key, 
        typeof value === 'string' ? value.trim() : value
      ]).filter(([key, value]) => {
        // Mantener campos obligatorios siempre
        if (key === 'name' || key === 'slug' || key === 'plan_type') {
          return true;
        }
        // Filtrar campos opcionales vacíos
        return value !== '' && value !== null && value !== undefined;
      })
    );

    try {
      await onSubmit(cleanData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      // No cerrar el modal ni limpiar el formulario en caso de error
    }
  };

  const handleInputChange = (field: keyof CreateOrganizationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Generar slug automáticamente desde el nombre
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (value: string) => {
    handleInputChange('name', value);
    
    // Generar slug automáticamente si está vacío
    if (!formData.slug && value) {
      const generatedSlug = generateSlug(value);
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-bold">
              {organization ? 'Editar Organización' : 'Crear Organización'}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Nombre de la organización"
              error={errors.name}
              required={true}
              disabled={loading}
            />

            <Input
              label="Slug"
              value={formData.slug}
              onChange={(e) => handleInputChange('slug', e.target.value)}
              placeholder="mi-empresa"
              error={errors.slug}
              required={true}
              disabled={loading}
            />
          </div>

                    <TextArea
            label="Descripción"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Descripción de la organización"
            error={errors.description}
            required={true}
            rows={3}
            disabled={loading}
          />

          {/* Información de contacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email de contacto"
              type="email"
              value={formData.contact_email}
              onChange={(e) => handleInputChange('contact_email', e.target.value)}
              placeholder="contacto@empresa.com"
              error={errors.contact_email}
              required={true}
              disabled={loading}
            />

            <Input
              label="Teléfono de contacto"
              value={formData.contact_phone}
              onChange={(e) => handleInputChange('contact_phone', e.target.value)}
              placeholder="+502 5000-0000"
              error={errors.contact_phone}
              required={true}
              disabled={loading}
            />
          </div>

          {/* Información web */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Dominio"
              value={formData.domain}
              onChange={(e) => handleInputChange('domain', e.target.value)}
              placeholder="empresa.com"
              error={errors.domain}
              required={false}
              disabled={loading}
            />

            <Input
              label="Sitio web"
              value={formData.website_url}
              onChange={(e) => handleInputChange('website_url', e.target.value)}
              placeholder="https://empresa.com"
              error={errors.website_url}
              required={false}
              disabled={loading}
            />
          </div>

                    <Input
            label="URL del logo"
            value={formData.logo_url}
            onChange={(e) => handleInputChange('logo_url', e.target.value)}
            placeholder="https://example.com/logo.png"
            error={errors.logo_url}
            required={true}
            disabled={loading}
          />

                    <TextArea
            label="Dirección"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Dirección completa de la organización"
            error={errors.address}
            required={true}
            rows={2}
            disabled={loading}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Estado"
              value={formData.status}
              onChange={(value) => handleInputChange('status', value)}
              options={[
                { value: 'ACTIVE', label: 'ACTIVE' },
                { value: 'INACTIVE', label: 'INACTIVE' },
                { value: 'SUSPENDED', label: 'SUSPENDED' }
              ]}
              error={errors.status}
              required={true}
              disabled={loading}
            />

            <Select
              label="Tipo de plan"
              value={formData.plan_type}
              onChange={(value) => handleInputChange('plan_type', value)}
              options={[
                { value: 'FREE', label: 'FREE' },
                { value: 'BASIC', label: 'BASIC' },
                { value: 'PRO', label: 'PRO' },
                { value: 'ENTERPRISE', label: 'ENTERPRISE' }
              ]}
              error={errors.plan_type}
              required={true}
              disabled={loading}
            />
          </div>

          <Input
            label="Fecha de expiración de suscripción"
            type="datetime-local"
            value={formData.subscription_expires_at ? formData.subscription_expires_at.slice(0, 16) : ''}
            onChange={(e) => {
              const date = e.target.value;
              const isoDate = date ? new Date(date).toISOString() : '';
              handleInputChange('subscription_expires_at', isoDate);
            }}
            error={errors.subscription_expires_at}
            required={true}
            disabled={loading}
            helperText="Deja vacío para usar la fecha por defecto"
          />

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {organization ? 'Actualizar' : 'Crear'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
