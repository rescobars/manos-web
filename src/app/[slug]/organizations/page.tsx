'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizations } from '@/hooks/useApi';
import { useToast } from '@/hooks/useToast';
import { useOrganizationSearch } from '@/hooks/useOrganizationSearch';
import { Organization, OrganizationFilters } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { OrganizationModal } from '@/components/ui/OrganizationModal';
import { OrganizationDetail } from '@/components/ui/OrganizationDetail';
import { OrganizationActions } from '@/components/ui/OrganizationActions';
import { OrganizationFiltersComponent } from '@/components/ui/OrganizationFilters';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { 
  Building2, 
  Plus,
  Shield,
  Crown,
  Calendar,
  Globe,
  Users,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  X
} from 'lucide-react';

export default function OrganizationsPage() {
  const { 
    organizations: userOrganizations, 
    currentOrganization,
    hasPermission,
    setCurrentOrganization
  } = useAuth();

  const {
    loading,
    error,
    getOrganizations,
    createOrganization,
    updateOrganization,
    updateOrganizationStatus,
    deleteOrganization,
    clearError
  } = useOrganizations();

  const { toasts, removeToast, success, error: showError, warning, info } = useToast();

  // Hook de búsqueda de organizaciones
  const {
    filters,
    organizations,
    loading: searchLoading,
    error: searchError,
    updateFilters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    reload
  } = useOrganizationSearch({
    searchFunction: getOrganizations,
    initialOrganizations: userOrganizations,
    debounceDelay: 500,
    onError: (error) => {
      showError('Error al cargar organizaciones', error.message);
    }
  });

  // Estados locales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [organizationToDelete, setOrganizationToDelete] = useState<Organization | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Permisos
  const canCreateOrganizations = hasPermission('organizations', 'create');
  const canEditOrganizations = hasPermission('organizations', 'update');
  const canDeleteOrganizations = hasPermission('organizations', 'delete');
  const canChangeStatus = hasPermission('organizations', 'suspend') || hasPermission('organizations', 'activate');
  const canViewOrganizations = hasPermission('organizations', 'read');





  const handleCreateOrganization = async (data: any) => {
    setActionLoading(true);
    try {
      const response = await createOrganization(data);
      
      if (response.success) {
        await reload();
        setShowCreateModal(false);
        success('Organización creada', 'La organización se ha creado exitosamente');
      } else {
        throw new Error(response.error || response.message || 'Error al crear organización');
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      showError('Error al crear organización', (error as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateOrganization = async (data: any) => {
    if (!selectedOrganization) return;
    
    setActionLoading(true);
    try {
      const response = await updateOrganization(selectedOrganization.uuid, data);
      if (response.success) {
        await reload();
        setShowEditModal(false);
        setSelectedOrganization(null);
        success('Organización actualizada', 'La organización se ha actualizado exitosamente');
      } else {
        throw new Error(response.error || 'Error al actualizar organización');
      }
    } catch (error) {
      console.error('Error updating organization:', error);
      showError('Error al actualizar organización', (error as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (org: Organization, newStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
    setActionLoading(true);
    try {
      const response = await updateOrganizationStatus(org.uuid, newStatus);
      if (response.success) {
        await reload();
        success('Estado actualizado', `El estado de "${org.name}" se ha cambiado a ${newStatus}`);
      } else {
        throw new Error(response.error || 'Error al cambiar estado');
      }
    } catch (error) {
      console.error('Error changing status:', error);
      showError('Error al cambiar estado', (error as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteOrganization = async () => {
    if (!organizationToDelete) return;
    
    setActionLoading(true);
    try {
      const response = await deleteOrganization(organizationToDelete.uuid);
      if (response.success) {
        await reload();
        setShowDeleteDialog(false);
        setOrganizationToDelete(null);
        success('Organización eliminada', `La organización "${organizationToDelete.name}" se ha eliminado exitosamente`);
      } else {
        throw new Error(response.error || 'Error al eliminar organización');
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
      showError('Error al eliminar organización', (error as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (org: Organization) => {
    setSelectedOrganization(org);
    setShowEditModal(true);
  };

  const handleView = (org: Organization) => {
    setSelectedOrganization(org);
    setShowDetailModal(true);
  };

  const handleDelete = (org: Organization) => {
    setOrganizationToDelete(org);
    setShowDeleteDialog(true);
  };

  const handleFiltersChange = (newFilters: OrganizationFilters) => {
    updateFilters(newFilters);
  };

  const handleClearFilters = () => {
    clearFilters();
  };

  const handleSwitchOrganization = (org: Organization) => {
    setCurrentOrganization(org);
  };

  if (loading && organizations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Cargando organizaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizaciones</h1>
          <p className="text-gray-600">
            Gestiona todas tus organizaciones
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={reload}
            disabled={searchLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${searchLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          
          {/* Temporalmente habilitado para testing */}
          <Button onClick={() => {
            console.log('Abriendo modal de crear organización');
            setShowCreateModal(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Organización
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <OrganizationFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        loading={searchLoading}
      />

      {/* Mensaje de error */}
      {(error || searchError) && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-800">{error || searchError}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Grid de organizaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organizations.map((org) => (
          <Card 
            key={org.uuid} 
            className={`hover:shadow-md transition-shadow ${
              currentOrganization?.uuid === org.uuid ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {org.logo_url ? (
                    <img 
                      src={org.logo_url} 
                      alt={`${org.name} logo`}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                  )}
                  
                  <div>
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                    <p className="text-sm text-gray-600">{org.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {currentOrganization?.uuid === org.uuid && (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  )}
                  
                  <OrganizationActions
                    organization={org}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    onView={handleView}
                    permissions={{
                      canEdit: true, // Temporalmente habilitado
                      canDelete: true, // Temporalmente habilitado
                      canChangeStatus: true, // Temporalmente habilitado
                      canView: true // Temporalmente habilitado
                    }}
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {/* Roles del usuario */}
                <div className="flex flex-wrap gap-1">
                  {org.roles && org.roles.length > 0 ? (
                    org.roles.map((role) => (
                      <span 
                        key={role.uuid}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          role.name === 'PLATFORM_ADMIN' 
                            ? 'bg-purple-100 text-purple-800' 
                            : role.name === 'OWNER'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {role.name === 'PLATFORM_ADMIN' && <Shield className="w-3 h-3 mr-1" />}
                        {role.name === 'OWNER' && <Crown className="w-3 h-3 mr-1" />}
                        {role.name}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Sin roles asignados
                    </span>
                  )}
                </div>

                {/* Información de la organización */}
                <div className="space-y-2 text-sm text-gray-600">
                  {org.domain && (
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-2" />
                      <span>{org.domain}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      {org.plan_type} - Expira {new Date(org.subscription_expires_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    <span>Miembro desde {new Date(org.member_since).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Estado */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    org.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800' 
                      : org.status === 'SUSPENDED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {org.status}
                  </span>
                  
                  {org.is_owner && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Crown className="w-3 h-3 mr-1" />
                      Propietario
                    </span>
                  )}
                </div>


              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sin organizaciones */}
      {organizations.length === 0 && !loading && !searchLoading && (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {hasActiveFilters ? 'No se encontraron organizaciones' : 'No tienes organizaciones'}
            </h3>
            <p className="text-gray-600 mb-4">
              {hasActiveFilters 
                ? 'Intenta ajustar los filtros o términos de búsqueda.'
                : 'Aún no has sido agregado a ninguna organización.'
              }
            </p>
            {canCreateOrganizations && !hasActiveFilters && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Organización
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modales */}
      <OrganizationModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
        }}
        onSubmit={handleCreateOrganization}
        loading={actionLoading}
      />

      <OrganizationModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedOrganization(null);
        }}
        organization={selectedOrganization}
        onSubmit={handleUpdateOrganization}
        loading={actionLoading}
      />

      {selectedOrganization && showDetailModal && (
        <OrganizationDetail
          organization={selectedOrganization}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedOrganization(null);
          }}
          onEdit={handleEdit}
        />
      )}

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setOrganizationToDelete(null);
        }}
        onConfirm={handleDeleteOrganization}
        title="Eliminar Organización"
        message={`¿Estás seguro de que quieres eliminar la organización "${organizationToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        loading={actionLoading}
      />

      {/* Sistema de toasts */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
}
