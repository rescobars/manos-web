'use client';

import React, { useState, useEffect } from 'react';
import { Organization, CreateOrganizationFormData, UpdateOrganizationFormData } from '@/types';
import { Button } from './Button';
import { Input } from './Input';
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
    plan_type: 'FREE' // Cambiado a FREE como valor por defecto más seguro
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
          plan_type: organization.plan_type as any || 'FREE'
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
          plan_type: 'FREE'
        });
      }
      setErrors({});
    }
  }, [isOpen, organization]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Campos obligatorios según las instrucciones
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'El slug es requerido';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'El slug solo puede contener letras minúsculas, números y guiones';
    }

    // Validaciones opcionales
    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Email inválido';
    }

    if (formData.website_url && !/^https?:\/\/.+/.test(formData.website_url)) {
      newErrors.website_url = 'URL inválida (debe comenzar con http:// o https://)';
    }

    // Validar plan_type
    const validPlanTypes = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
    if (formData.plan_type && !validPlanTypes.includes(formData.plan_type)) {
      newErrors.plan_type = 'Tipo de plan inválido';
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

    // Log de los datos que se van a enviar
    console.log('Datos del formulario a enviar:', cleanData);

    try {
      await onSubmit(cleanData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
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

  console.log('OrganizationModal render:', { isOpen, organization: organization?.name });
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Nombre de la organización"
                error={errors.name}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug *
              </label>
              <Input
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                placeholder="mi-empresa"
                error={errors.slug}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descripción de la organización"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Información de contacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email de contacto
              </label>
              <Input
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                placeholder="contacto@empresa.com"
                error={errors.contact_email}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono de contacto
              </label>
              <Input
                value={formData.contact_phone}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                placeholder="+502 5000-0000"
                disabled={loading}
              />
            </div>
          </div>

          {/* Información web */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dominio
              </label>
              <Input
                value={formData.domain}
                onChange={(e) => handleInputChange('domain', e.target.value)}
                placeholder="empresa.com"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sitio web
              </label>
              <Input
                value={formData.website_url}
                onChange={(e) => handleInputChange('website_url', e.target.value)}
                placeholder="https://empresa.com"
                error={errors.website_url}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL del logo
            </label>
            <Input
              value={formData.logo_url}
              onChange={(e) => handleInputChange('logo_url', e.target.value)}
              placeholder="https://example.com/logo.png"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Dirección completa de la organización"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de plan
            </label>
            <select
              value={formData.plan_type}
              onChange={(e) => handleInputChange('plan_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="FREE">FREE</option>
              <option value="BASIC">BASIC</option>
              <option value="PRO">PRO</option>
              <option value="ENTERPRISE">ENTERPRISE</option>
            </select>
          </div>

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
